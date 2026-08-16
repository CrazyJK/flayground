import fs from 'fs';
import path from 'path';
import { config } from '../config';
import { Flay } from '../domain/flay';
import { FlayFileResult, resolveFlayFile } from './flay-file-resolver';
import { historyRepository } from './history-repository';
import { actressInfoSource, studioInfoSource, tagInfoSource, videoInfoSource } from './info-sources';

/** 파일 확장자 분류 상수 (Ground.FILE 대응) */
const VIDEO_EXTS = new Set(['avi', 'mpg', 'mkv', 'wmv', 'mp4', 'mov', 'rmvb', 'm2ts']);
const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'gif', 'jfif', 'webp']);
const SUBTITLES_EXTS = new Set(['smi', 'srt', 'ass', 'smil']);
const IGNORE_EXTS = new Set(['ds_store']);

/**
 * 확장자로 파일 종류 판별
 */
function getFileExt(filePath: string): string {
  return path.extname(filePath).substring(1).toLowerCase();
}

export function isVideoFile(filePath: string): boolean {
  return VIDEO_EXTS.has(getFileExt(filePath));
}
export function isImageFile(filePath: string): boolean {
  return IMAGE_EXTS.has(getFileExt(filePath));
}
export function isSubtitlesFile(filePath: string): boolean {
  return SUBTITLES_EXTS.has(getFileExt(filePath));
}

/**
 * 디렉토리를 재귀적으로 순회하여 모든 파일 경로를 수집한다.
 */
function listFilesRecursive(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    console.warn(`[FlaySource] 유효하지 않은 경로: ${dir}`);
    return results;
  }
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

/** Flay 맵에 파일을 분류하여 추가 */
function addFileToFlay(flay: Flay, filePath: string): void {
  if (isVideoFile(filePath)) {
    flay.files.movie.push(filePath);
  } else if (isSubtitlesFile(filePath)) {
    flay.files.subtitles.push(filePath);
  } else if (isImageFile(filePath)) {
    flay.files.cover.push(filePath);
  } else {
    console.warn(`[FlaySource] 알 수 없는 파일: ${flay.opus} -> ${filePath}`);
  }
}

/**
 * FlayFileResult로부터 새 Flay 객체를 생성한다.
 * Java FlayFactory.newFlay() 대응
 */
function createFlayFromResult(result: FlayFileResult, isArchive: boolean): Flay {
  // studioInfoSource에 없으면 자동 등록
  const studio = studioInfoSource.getOrNew(result.studio);

  // actressInfoSource에 없으면 자동 등록
  const actressList: string[] = [];
  for (const rawName of result.actress.split(',')) {
    const name = rawName.trim().split(/\s+/).join(' ');
    if (name) {
      actressList.push(actressInfoSource.getOrNew(name).name);
    }
  }

  // videoInfoSource에서 가져오거나 새로 생성
  const video = videoInfoSource.getOrNew(result.opus);

  // 아카이브가 아닐 때 lastPlay를 히스토리에서 갱신
  if (!isArchive) {
    const lastPlayHistory = historyRepository.findLastPlay(result.opus);
    if (lastPlayHistory) {
      const parsed = parseDateTime(lastPlayHistory.date);
      if (parsed) video.lastPlay = parsed;
    }
  }

  // 태그 정보 갱신
  if (video.tags) {
    for (const tag of video.tags) {
      const tagInSource = tagInfoSource.find(tag.id);
      if (tagInSource) {
        tag.name = tagInSource.name;
        tag.description = tagInSource.description;
      } else {
        console.warn(`[FlaySource] 태그 없음: id=${tag.id} opus=${result.opus}`);
      }
    }
  }

  return {
    studio: studio.name,
    opus: result.opus,
    title: result.title,
    actressList,
    release: result.release,
    score: 0,
    actressPoint: 0,
    studioPoint: 0,
    archive: isArchive,
    video,
    files: { movie: [], subtitles: [], cover: [], candidate: [] },
    length: 0,
    lastModified: -1,
  };
}

/**
 * "yyyy-MM-dd HH:mm:ss" 형식 문자열을 epoch ms로 변환
 */
function parseDateTime(dateStr: string): number | null {
  const d = new Date(dateStr.replace(' ', 'T'));
  return isNaN(d.getTime()) ? null : d.getTime();
}

/**
 * Flay의 length, lastModified를 파일 정보로부터 계산한다.
 */
function computeFlayMeta(flay: Flay): void {
  let totalLength = 0;
  let maxModified = -1;

  const allFiles = [...flay.files.movie, ...flay.files.subtitles, ...flay.files.cover];
  for (const fp of allFiles) {
    try {
      const stat = fs.statSync(fp);
      totalLength += stat.size;
      if (stat.mtimeMs > maxModified) maxModified = stat.mtimeMs;
    } catch {
      // 파일 접근 불가 시 무시
    }
  }

  flay.length = totalLength;
  flay.lastModified = maxModified;
}

// ============================================================
// FlaySource (FileBasedFlaySource 대응)
// ============================================================

/** Instance(Storage+Stage) Flay 맵 */
const instanceFlayMap = new Map<string, Flay>();
/** Archive Flay 맵 */
const archiveFlayMap = new Map<string, Flay>();

/** 로그 콜백 타입 (비동기) */
export type FlaySourceLogger = (message: string) => Promise<void>;

/** 기본 로거 (console.log) */
const defaultLogger: FlaySourceLogger = async (message) => console.log(message);

/** 이벤트 루프 양보 */
function yieldEventLoop(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

/**
 * 지정된 경로들에서 파일을 스캔하여 Flay 맵을 구성한다.
 */
async function loadFlaySource(paths: string[], isArchive: boolean, flayMap: Map<string, Flay>, logger: FlaySourceLogger = defaultLogger): Promise<void> {
  const label = isArchive ? 'Archive' : 'Instance';
  const allFiles: string[] = [];

  for (const dir of paths) {
    const files = listFilesRecursive(dir);
    await logger(`[FlaySource] [Load ${label}] ${String(files.length).padStart(5)} 파일 - ${dir}`);
    await yieldEventLoop();
    allFiles.push(...files);
  }

  flayMap.clear();

  for (let i = 0; i < allFiles.length; i++) {
    const filePath = allFiles[i];
    const ext = getFileExt(filePath);
    if (IGNORE_EXTS.has(ext)) continue;

    const result = resolveFlayFile(filePath);
    if (!result.valid) {
      console.warn(`[FlaySource] [Load ${label}] 잘못된 파일명 - ${filePath}`);
      continue;
    }

    let flay = flayMap.get(result.opus);
    if (!flay) {
      flay = createFlayFromResult(result, isArchive);
      flayMap.set(flay.opus, flay);
    }

    addFileToFlay(flay, result.filePath);

    // 1000개마다 이벤트 루프 양보
    if (i % 1000 === 999) await yieldEventLoop();
  }

  // 메타 정보 계산
  for (const flay of flayMap.values()) {
    computeFlayMeta(flay);
  }

  await logger(`[FlaySource] [Load ${label}] ${String(flayMap.size).padStart(5)} Flay`);
}

/**
 * 모든 Flay 소스를 로드한다.
 * 서버 시작 시 호출되어야 한다.
 */
export function loadAllFlaySources(): void {
  console.log('[FlaySource] 로드 시작...');

  // Instance: storage + stage + cover 경로
  const instancePaths = [config.flay.storagePath, ...config.flay.stagePaths, config.flay.coverPath];
  loadFlaySource(instancePaths, false, instanceFlayMap);

  // Archive
  loadFlaySource([config.flay.archivePath], true, archiveFlayMap);

  console.log('[FlaySource] 로드 완료');
}

/** Instance Flay 목록 */
export function getInstanceFlayList(): Flay[] {
  return Array.from(instanceFlayMap.values());
}

/** Archive Flay 목록 */
export function getArchiveFlayList(): Flay[] {
  return Array.from(archiveFlayMap.values());
}

/** opus로 Instance Flay 조회 */
export function getInstanceFlay(opus: string): Flay {
  const flay = instanceFlayMap.get(opus);
  if (!flay) throw new Error(`Instance Flay not found: ${opus}`);
  return flay;
}

/** opus로 Archive Flay 조회 */
export function getArchiveFlay(opus: string): Flay {
  const flay = archiveFlayMap.get(opus);
  if (!flay) throw new Error(`Archive Flay not found: ${opus}`);
  return flay;
}

/** Instance Flay 맵 직접 접근 */
export function getInstanceFlayMap(): Map<string, Flay> {
  return instanceFlayMap;
}

/** Archive Flay 맵 직접 접근 */
export function getArchiveFlayMap(): Map<string, Flay> {
  return archiveFlayMap;
}

/** Instance Flay 맵을 다시 로드한다 */
export async function reloadInstanceFlaySources(logger?: FlaySourceLogger): Promise<void> {
  const instancePaths = [config.flay.storagePath, ...config.flay.stagePaths, config.flay.coverPath];
  await loadFlaySource(instancePaths, false, instanceFlayMap, logger);
}

/** Archive Flay 맵을 다시 로드한다 */
export async function reloadArchiveFlaySources(logger?: FlaySourceLogger): Promise<void> {
  await loadFlaySource([config.flay.archivePath], true, archiveFlayMap, logger);
}
