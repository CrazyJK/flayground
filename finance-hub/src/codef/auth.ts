import fs from 'fs';
import path from 'path';
import { config } from '../config.js';

interface TokenCache {
  accessToken: string;
  /** 만료 시각 (Unix ms) */
  expiresAt: number;
}

let memoryCache: TokenCache | null = null;

// 환경별로 토큰 캐시 파일을 분리하여 환경 전환 시 크로스 오염 방지
const CACHE_FILE = path.join(config.dataDir, `token-cache.${config.codef.env}.json`);

/** 캐시 파일에서 토큰을 불러온다. */
function loadFromFile(): TokenCache | null {
  try {
    if (!fs.existsSync(CACHE_FILE)) return null;
    const raw = fs.readFileSync(CACHE_FILE, 'utf-8');
    return JSON.parse(raw) as TokenCache;
  } catch {
    return null;
  }
}

/** 토큰을 파일에 저장한다. */
function saveToFile(cache: TokenCache): void {
  try {
    fs.mkdirSync(config.dataDir, { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[auth] 토큰 파일 저장 실패:', err);
  }
}

/**
 * codef OAuth2.0 Access Token을 발급한다.
 * 유효한 토큰이 캐싱되어 있으면 재사용하고, 만료된 경우에만 재발급한다.
 * 토큰은 7일 유효하며 메모리와 파일 양쪽에 캐싱된다.
 *
 * @returns Access Token 문자열
 */
export async function getAccessToken(): Promise<string> {
  // 메모리 캐시 확인
  if (memoryCache && memoryCache.expiresAt > Date.now()) {
    return memoryCache.accessToken;
  }

  // 파일 캐시 확인
  const fileCache = loadFromFile();
  if (fileCache && fileCache.expiresAt > Date.now()) {
    memoryCache = fileCache;
    return fileCache.accessToken;
  }

  // 신규 발급
  const { clientId, clientSecret, oauthUrl } = config.codef;
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(oauthUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`,
    },
    body: 'grant_type=client_credentials&scope=read',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`codef 토큰 발급 실패 (${response.status}): ${text}`);
  }

  const data = (await response.json()) as { access_token: string; expires_in: number };

  // 만료 시각: 현재 시각 + (expires_in초 - 5분 여유)
  const expiresAt = Date.now() + (data.expires_in - 300) * 1000;
  const cache: TokenCache = { accessToken: data.access_token, expiresAt };

  memoryCache = cache;
  saveToFile(cache);

  console.info('[auth] codef Access Token 신규 발급 완료');
  return cache.accessToken;
}

/** 캐싱된 토큰을 강제로 무효화한다 (토큰 만료 오류 시 사용). */
export function invalidateToken(): void {
  memoryCache = null;
  try {
    if (fs.existsSync(CACHE_FILE)) fs.unlinkSync(CACHE_FILE);
  } catch {
    // 무시
  }
}
