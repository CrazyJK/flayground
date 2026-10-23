import chokidar, { FSWatcher } from 'chokidar';
import { config } from '../config';
import { isImageFile } from '../sources/flay-source';
import { imageSource } from '../sources/image-source';

/**
 * 이미지 디렉토리 파일 변경 감시 서비스.
 * Java LocalImageSource.registWatcher() 대응 - chokidar 기반
 */

let watcher: FSWatcher | null = null;

/**
 * 이미지 파일 변경 시 changed 플래그를 설정한다.
 * Java LocalImageSource.DirectoryWatcher 콜백 대응
 */
function onFileChange(event: string, filePath: string): void {
  if (isImageFile(filePath)) {
    console.log(`[DirectoryWatcher] ${event}: ${filePath}`);
    imageSource.markChanged();
  }
}

/**
 * 디렉토리 감시를 시작한다.
 * Java LocalImageSource와 동일하게 imagePaths를 감시한다.
 */
export function startDirectoryWatcher(): void {
  const watchPaths = config.flay.imagePaths;
  console.log(`[DirectoryWatcher] 감시 시작: ${watchPaths.join(', ')}`);

  watcher = chokidar.watch(watchPaths, {
    ignoreInitial: true,
    depth: 3,
  });

  watcher
    .on('add', (fp: string) => onFileChange('add', fp))
    .on('unlink', (fp: string) => onFileChange('unlink', fp))
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
