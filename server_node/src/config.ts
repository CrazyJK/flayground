import fs from 'fs';
import path from 'path';

/** 백업 설정 */
export interface BackupConfig {
  instanceJarFilename: string;
  archiveJarFilename: string;
  instanceCsvFilename: string;
  archiveCsvFilename: string;
}

/** 점수 가중치 설정 */
export interface ScoreConfig {
  rankPoint: number;
  playPoint: number;
  subtitlesPoint: number;
  favoritePoint: number;
  likePoint: number;
}

/** Flay 관련 설정 (GroundProperties 대응) */
export interface FlayConfig {
  archivePath: string;
  storagePath: string;
  stagePaths: string[];
  coverPath: string;
  queuePath: string;
  candidatePath: string;
  subtitlesPath: string;
  infoPath: string;
  todayisPaths: string[];
  imagePaths: string[];
  backupPath: string;
  attachPath: string;
  diaryPath: string;

  playerApp: string;
  editorApp: string;
  paintApp: string;

  recyclebin: string;
  recyclebinUse: boolean;
  deleteLowerScore: boolean;
  storageLimit: number;

  score: ScoreConfig;
  backup: BackupConfig;

  automaticallyCertificatedIp: string[];
  useTorProxy: boolean;
  jsoupTimeout: number;
}

/** Web Push VAPID 설정 */
export interface WebPushConfig {
  publicKey: string;
  privateKey: string;
  subject: string;
}

/** 서버 설정 */
export interface ServerConfig {
  port: number;
  http2: boolean;
}

/** 전체 설정 */
export interface AppConfig {
  server: ServerConfig;
  flay: FlayConfig;
  webPush: WebPushConfig;
}

/**
 * JSON 설정 파일을 로드하여 AppConfig를 반환한다.
 * config/default.json을 기본으로, 환경별 파일이 있으면 병합한다.
 */
function loadConfig(): AppConfig {
  const configDir = path.resolve(__dirname, '..', 'config');
  const defaultPath = path.join(configDir, 'default.json');

  if (!fs.existsSync(defaultPath)) {
    throw new Error(`설정 파일을 찾을 수 없습니다: ${defaultPath}`);
  }

  const defaultConfig = JSON.parse(fs.readFileSync(defaultPath, 'utf-8'));

  // 환경별 설정 파일 병합 (예: config/home.json)
  const env = process.env.GROUND_ENV;
  if (env) {
    const envPath = path.join(configDir, `${env}.json`);
    if (fs.existsSync(envPath)) {
      const envConfig = JSON.parse(fs.readFileSync(envPath, 'utf-8'));
      return deepMerge(defaultConfig, envConfig) as AppConfig;
    }
  }

  return defaultConfig as AppConfig;
}

/**
 * 깊은 병합. source의 값이 target을 덮어쓴다.
 */
function deepMerge(target: Record<string, any>, source: Record<string, any>): Record<string, any> {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

/** 앱 전역 설정 인스턴스 */
export const config: AppConfig = loadConfig();
