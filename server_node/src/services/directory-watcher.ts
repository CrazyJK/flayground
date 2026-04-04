import chokidar, { FSWatcher } from 'chokidar';
import { config } from '../config';
import { reloadInstanceFlaySources } from '../sources/flay-source';
import { SseMessage, sseSend } from './sse-emitters';

/**
 * 디렉토리 파일 변경 감시 서비스.
 * Java DirectoryWatcher 대응 - chokidar 기반
 */

let watcher: FSWatcher | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/** 디바운스 간격 (ms) */
const DEBOUNCE_MS = 3000;

/**
 * 파일 변경 시 디바운스 후 Flay 소스를 리로드한다.
 */
function scheduleReload(event: string, filePath: string): void {
  console.log(`[DirectoryWatcher] ${event}: ${filePath}`);

  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    console.log('[DirectoryWatcher] 변경 감지 → Flay 소스 리로드');
    reloadInstanceFlaySources();

    const msg: SseMessage = { type: 'Notice', message: '파일 변경 감지. 소스 리로드 완료' };
    sseSend(msg);
  }, DEBOUNCE_MS);
}

/**
 * 디렉토리 감시를 시작한다.
 * stage, storage 경로를 감시한다.
 */
export function startDirectoryWatcher(): void {
  const watchPaths = [...config.flay.stagePaths, config.flay.storagePath];
  console.log(`[DirectoryWatcher] 감시 시작: ${watchPaths.join(', ')}`);

  watcher = chokidar.watch(watchPaths, {
    ignoreInitial: true,
    depth: 3,
    awaitWriteFinish: { stabilityThreshold: 2000, pollInterval: 500 },
  });

  watcher
    .on('add', (fp: string) => scheduleReload('add', fp))
    .on('unlink', (fp: string) => scheduleReload('unlink', fp))
    .on('addDir', (fp: string) => scheduleReload('addDir', fp))
    .on('unlinkDir', (fp: string) => scheduleReload('unlinkDir', fp))
    .on('error', (err: unknown) => console.error('[DirectoryWatcher] 오류:', err));
}

/**
 * 디렉토리 감시를 중지한다.
 */
export function stopDirectoryWatcher(): void {
  if (watcher) {
    watcher.close();
    watcher = null;
    console.log('[DirectoryWatcher] 감시 중지');
  }
}
