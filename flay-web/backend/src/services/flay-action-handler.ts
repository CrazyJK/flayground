import { spawn } from 'child_process';
import os from 'os';
import path from 'path';
import { config } from '../config';
import { Flay } from '../domain/flay';
import { sseSend } from './sse-emitters';

/**
 * 외부 프로세스를 비동기로 실행한다.
 * Java FlayAsyncExecutor 대응
 *
 * @param app - 실행할 프로그램
 * @param args - 프로그램 인자
 * @param shell - CMD 경유 여부 (특수문자 경로 처리 등)
 */
function execAsync(app: string, args: string[], shell = false): void {
  console.log(`[ActionHandler] 실행: ${[app, ...args].join(' ')}`);

  const child = spawn(app, args, {
    detached: !shell,
    stdio: 'ignore',
    shell,
  });
  child.unref();

  child.on('error', (err) => {
    console.error(`[ActionHandler] 실행 오류: ${err.message}`);
  });
}

/**
 * 영상을 재생한다.
 * Java FlayActionHandler.play() 대응
 *
 * @param flay 대상 Flay
 * @param seekTime 탐색 시간 (초). -1이면 처음부터
 */
export function play(flay: Flay, seekTime: number): void {
  if (!flay.files.movie || flay.files.movie.length === 0) {
    throw new Error('영상 파일이 없습니다');
  }

  let seekOption = '';
  if (seekTime > -1) {
    const hours = Math.floor(seekTime / 3600);
    const minutes = Math.floor((seekTime % 3600) / 60);
    const seconds = Math.floor(seekTime % 60);
    const milliseconds = Math.floor((seekTime - Math.floor(seekTime)) * 1000);
    seekOption = `/seek=${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
  }

  const args = [flay.files.movie[0]];
  if (seekOption) args.push(seekOption);

  execAsync(config.flay.playerApp, args);
  sseSend(flay);
}

/**
 * 자막 파일을 편집기로 연다.
 * Java FlayActionHandler.edit() 대응
 */
export function edit(flay: Flay): void {
  if (!flay.files.subtitles || flay.files.subtitles.length === 0) {
    throw new Error('자막 파일이 없습니다');
  }

  execAsync(config.flay.editorApp, [flay.files.subtitles[0]]);
  sseSend(flay);
}

/**
 * 이미지를 그림판으로 연다.
 * Java FlayActionHandler.paint() 대응
 */
export function paint(imagePath: string): void {
  execAsync(config.flay.paintApp, [imagePath]);
}

/**
 * 폴더를 파일 탐색기로 연다.
 * Java FlayActionHandler.openFolder() 대응
 */
export function openFolder(folder: string): void {
  const platform = os.platform();
  let explorer: string;

  switch (platform) {
    case 'win32':
      explorer = 'explorer';
      break;
    case 'linux':
      explorer = 'nemo';
      break;
    case 'darwin':
      explorer = 'open';
      break;
    default:
      throw new Error(`지원하지 않는 OS: ${platform}`);
  }

  const targetPath = path.resolve(folder);
  // Windows: /select, 옵션으로 탐색기에서 해당 파일을 선택 표시. shell: true로 CMD 경유하여 특수문자 경로 처리
  if (platform === 'win32') {
    execAsync(explorer, [`/select,"${targetPath}"`], true);
  } else {
    execAsync(explorer, [targetPath]);
  }
}
