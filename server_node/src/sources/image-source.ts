import fs from 'fs';
import path from 'path';
import { config } from '../config';

/** Image 도메인 (Java Image 클래스 대응) */
export interface ImageEntry {
  idx: number;
  name: string;
  path: string;
  length: number;
  modified: number;
  /** 파일 절대 경로 (JSON 응답에서는 제외) */
  file: string;
}

const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'gif', 'jfif', 'webp']);

/** 이미지 목록 (메모리) */
let imageList: ImageEntry[] = [];
let changed = false;

/**
 * 지정된 이미지 디렉토리들을 스캔하여 이미지 목록을 구성한다.
 * Java LocalImageSource.load() 대응
 */
function load(): void {
  let idx = 0;
  imageList = [];

  for (const dir of config.flay.imagePaths) {
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) continue;

    const files = listFilesRecursive(dir);
    let count = 0;
    for (const filePath of files) {
      const ext = path.extname(filePath).substring(1).toLowerCase();
      if (IMAGE_EXTS.has(ext)) {
        const stat = fs.statSync(filePath);
        imageList.push({
          idx: idx++,
          name: path.basename(filePath, path.extname(filePath)),
          path: path.dirname(filePath),
          length: stat.size,
          modified: stat.mtimeMs,
          file: filePath,
        });
        count++;
      }
    }
    console.log(`[Image] ${String(count).padStart(5)} 파일    - ${dir}`);
  }

  console.log(`[Image] ${String(imageList.length).padStart(5)} Image`);
}

/**
 * 디렉토리를 재귀 순회
 */
function listFilesRecursive(dir: string): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...listFilesRecursive(fullPath));
    } else if (entry.isFile()) {
      results.push(fullPath);
    }
  }
  return results;
}

/** 전체 이미지 목록 */
function list(): ImageEntry[] {
  return imageList;
}

/** 이미지 수 */
function size(): number {
  return imageList.length;
}

/** 인덱스로 이미지 조회 */
function get(idx: number): ImageEntry {
  if (idx < 0 || idx >= imageList.length) {
    throw new Error(`Image not found: idx=${idx}`);
  }
  return imageList[idx];
}

/** 인덱스로 이미지 삭제 (파일도 삭제) */
function deleteByIdx(idx: number): void {
  const image = get(idx);
  imageList.splice(imageList.indexOf(image), 1);
  // 인덱스 재할당
  imageList.forEach((img, i) => {
    img.idx = i;
  });
  try {
    fs.unlinkSync(image.file);
  } catch (err: any) {
    console.error(`[Image] 파일 삭제 실패: ${image.file}`, err.message);
  }
}

/** 변경 플래그 설정 (chokidar 감시용) */
function markChanged(): void {
  changed = true;
}

/** 변경이 감지되면 리로드 */
function checkAndReload(): void {
  if (changed) {
    console.log('[Image] 변경 감지, 리로드');
    load();
    changed = false;
  }
}

export const imageSource = {
  load,
  list,
  size,
  get,
  deleteByIdx,
  markChanged,
  checkAndReload,
};
