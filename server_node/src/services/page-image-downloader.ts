import * as cheerio from 'cheerio';
import fs from 'fs';
import http from 'http';
import https from 'https';
import path from 'path';
import { config } from '../config';

/**
 * 웹 페이지에서 이미지를 추출하여 다운로드하는 서비스.
 * Java PageImageDownloader 대응 - cheerio 기반
 */

/** 다운로드 결과 */
export interface DownloadResult {
  pageUrl: string;
  localPath: string;
  message: string;
  result: boolean;
  imageFiles: string[];
  imageUrls: string[];
}

/**
 * 페이지 이미지를 다운로드한다.
 * @param pageUrl 이미지를 추출할 웹페이지 URL
 * @param downloadDir 다운로드 저장 디렉토리
 * @param folderName 폴더명
 * @param titlePrefix 파일명 접두어 (비어있으면 페이지에서 추출)
 * @param titleCssQuery 제목 추출용 CSS 선택자
 * @param minimumKbSize 최소 파일 크기 (KB)
 */
export async function downloadPageImages(pageUrl: string, downloadDir: string, folderName: string, titlePrefix: string, titleCssQuery: string, minimumKbSize: number): Promise<DownloadResult> {
  const result: DownloadResult = {
    pageUrl,
    localPath: '',
    message: '',
    result: false,
    imageFiles: [],
    imageUrls: [],
  };

  try {
    // 1. HTML 가져오기
    const html = await fetchHtml(pageUrl);
    const $ = cheerio.load(html);

    // 2. 이미지 URL 추출
    const imageUrls: string[] = [];
    $('img').each((_i, el) => {
      const src = $(el).attr('src');
      if (src) {
        const absoluteUrl = new URL(src, pageUrl).href;
        imageUrls.push(absoluteUrl);
      }
    });
    result.imageUrls = imageUrls;

    // 3. 제목 결정
    let title = titlePrefix;
    if (!title) {
      title = titleCssQuery ? $(titleCssQuery).first().text().trim() : '';
    }
    if (!title) {
      title = $('title').text().trim();
    }
    if (!title) {
      title = pageUrl;
    }
    // 불법 문자 제거 및 정리
    title = title.replace(/[:\\/%*?:|"<>]/g, '').replace(/\s+/g, '_');

    // 4. 저장 디렉토리 생성
    const saveDir = path.join(downloadDir, folderName);
    if (!fs.existsSync(saveDir)) {
      fs.mkdirSync(saveDir, { recursive: true });
    }
    result.localPath = saveDir;

    // 5. 이미지 병렬 다운로드
    const minimumSize = minimumKbSize * 1024;
    const downloadPromises = imageUrls.map((url, idx) => {
      const paddedIdx = String(idx + 1).padStart(4, '0');
      return downloadImage(url, saveDir, `${title}-${paddedIdx}`, minimumSize);
    });

    const downloadResults = await Promise.allSettled(downloadPromises);
    for (const r of downloadResults) {
      if (r.status === 'fulfilled' && r.value) {
        result.imageFiles.push(r.value);
      }
    }

    result.result = true;
    result.message = `${result.imageFiles.length}/${imageUrls.length} 이미지 다운로드 완료`;
  } catch (err: any) {
    result.message = err.message;
    result.result = false;
  }

  return result;
}

/** HTML 페이지를 가져온다 */
function fetchHtml(url: string): Promise<string> {
  const timeout = config.flay.jsoupTimeout || 60000;

  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { timeout }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // 리다이렉트 처리
        fetchHtml(new URL(res.headers.location, url).href).then(resolve).catch(reject);
        return;
      }
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Timeout: ${url}`));
    });
  });
}

/** 이미지를 다운로드한다 */
function downloadImage(imgUrl: string, destDir: string, title: string, minimumSize: number): Promise<string | null> {
  return new Promise((resolve) => {
    const client = imgUrl.startsWith('https') ? https : http;
    const req = client.get(imgUrl, { timeout: 30000 }, (res) => {
      if (res.statusCode !== 200) {
        resolve(null);
        return;
      }

      const contentType = res.headers['content-type'] || '';
      if (!contentType.startsWith('image/')) {
        res.resume();
        resolve(null);
        return;
      }

      // 확장자 결정
      let ext = getExtFromUrl(imgUrl);
      if (!ext) ext = getExtFromContentType(contentType);
      if (!ext) ext = 'jpg';

      const filePath = path.join(destDir, `${title}.${ext}`);
      const chunks: Buffer[] = [];

      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        if (buffer.length < minimumSize) {
          resolve(null);
          return;
        }
        fs.writeFileSync(filePath, buffer);
        resolve(filePath);
      });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
  });
}

const VALID_IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp']);

/** URL에서 확장자를 추출한다 */
function getExtFromUrl(url: string): string | null {
  try {
    const pathname = new URL(url).pathname;
    const ext = path.extname(pathname).substring(1).toLowerCase();
    return VALID_IMAGE_EXTS.has(ext) ? ext : null;
  } catch {
    return null;
  }
}

/** Content-Type에서 확장자를 추출한다 */
function getExtFromContentType(contentType: string): string | null {
  const mapping: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/bmp': 'bmp',
  };
  return mapping[contentType.split(';')[0].trim()] || null;
}
