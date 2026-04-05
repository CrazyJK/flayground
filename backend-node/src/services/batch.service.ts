import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { config } from '../config';
import { Flay } from '../domain/flay';
import { createHistory } from '../domain/history';
import { getArchiveFlay, getArchiveFlayList, getInstanceFlayList, reloadArchiveFlaySources, reloadInstanceFlaySources } from '../sources/flay-source';
import { historyRepository } from '../sources/history-repository';
import { deleteFile, isEmptyDirectory, moveFileToDirectory } from './flay-file-handler';
import { listOrderByScoreDesc } from './score-calculator';
import { sseSend } from './sse-emitters';

/**
 * 배치 서비스.
 * Java BatchExecutor 대응 - 인스턴스/아카이브 배치, 백업 등
 */

/** 배치 옵션 */
export type BatchOption = 'S' | 'R';

/** 배치 오퍼레이션 */
export type BatchOperation = 'I' | 'A' | 'B';

/** 런타임 옵션 상태 */
let deleteLowerScore = config.flay.deleteLowerScore;

/** 이벤트 루프 양보 - SSE 버퍼 플러시를 위해 필요 */
function yieldEventLoop(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

/**
 * SSE를 통해 배치 로그를 전송한다. (비동기 - 이벤트 루프 양보)
 */
async function batchLogger(message: string): Promise<void> {
  console.log(`[Batch] ${message}`);
  sseSend({ type: 'Batch', message });
  await yieldEventLoop();
}

/**
 * SSE를 통해 배치 로그를 전송한다. (동기 - FlaySourceLogger 콜백용)
 */
function batchLoggerSync(message: string): void {
  console.log(`[Batch] ${message}`);
  sseSend({ type: 'Batch', message });
}

/**
 * SSE를 통해 공지 알림을 전송한다.
 */
async function noticeLogger(message: string): Promise<void> {
  console.log(`[Batch] ${message}`);
  sseSend({ type: 'Notice', message });
  await yieldEventLoop();
}

/** 배치 옵션 조회 */
export function getOption(option: BatchOption): boolean {
  switch (option) {
    case 'S':
      return deleteLowerScore;
    default:
      throw new Error(`알 수 없는 배치 옵션: ${option}`);
  }
}

/** 배치 옵션 토글 */
export function toggleOption(option: BatchOption): boolean {
  switch (option) {
    case 'S':
      deleteLowerScore = !deleteLowerScore;
      return deleteLowerScore;
    default:
      throw new Error(`알 수 없는 배치 옵션: ${option}`);
  }
}

/** 배치 실행 (비동기) */
export function startBatch(operation: BatchOperation): void {
  // 비동기로 실행
  (async () => {
    try {
      switch (operation) {
        case 'I':
          await instanceBatch();
          break;
        case 'A':
          await archiveBatch();
          break;
        case 'B':
          await backup();
          break;
        default:
          throw new Error(`알 수 없는 배치 오퍼레이션: ${operation}`);
      }
    } catch (err: any) {
      console.error(`[Batch] 오류: ${err.message}`);
      await batchLogger(`오류: ${err.message}`);
    }
  })();
}

/** 배치 사전 검사 */
export function checkBatch(operation: BatchOperation): Record<string, Flay[]> {
  switch (operation) {
    case 'I':
      return instanceCheck();
    default:
      throw new Error(`알 수 없는 배치 오퍼레이션: ${operation}`);
  }
}

/** 소스 리로드 */
export function reload(): void {
  (async () => {
    await batchLogger('[reload] Start');
    reloadInstanceFlaySources(batchLoggerSync);
    await batchLogger('[reload] End');
    await noticeLogger('reload Completed');
  })();
}

// ─── 내부 구현 ───

/** rank < 0인 Flay 목록 */
function listLowerRank(): Flay[] {
  return getInstanceFlayList().filter((flay) => flay.video.rank < 0);
}

/** 용량 초과 시 low score Flay 목록 */
function listLowerScore(): Flay[] {
  const storageSize = config.flay.storageLimit * 1024 * 1024 * 1024;
  const sorted = listOrderByScoreDesc(getInstanceFlayList());
  const result: Flay[] = [];
  let lengthSum = 0;

  for (const flay of sorted) {
    lengthSum += flay.length;
    if (lengthSum > storageSize) {
      result.push(flay);
    }
  }

  return result;
}

/** 인스턴스 배치 사전 검사 */
function instanceCheck(): Record<string, Flay[]> {
  return {
    rank: listLowerRank(),
    score: listLowerScore(),
  };
}

/** 인스턴스 배치 실행 */
async function instanceBatch(): Promise<void> {
  await batchLogger('[instanceBatch] Start');

  // rank < 0 삭제
  await batchLogger('[deleteLowerRank]');
  for (const flay of listLowerRank()) {
    await archiving(flay, 'delete Lower Rank Video');
  }

  // low score 삭제
  if (deleteLowerScore) {
    await batchLogger('[deleteLowerScore]');
    for (const flay of listLowerScore()) {
      await archiving(flay, 'delete Lower Score Video');
    }
  }

  // 파일 재배치
  await assembleFlay();

  // 빈 폴더 삭제
  const pathsToClean = [...config.flay.stagePaths, config.flay.coverPath, config.flay.storagePath];
  await deleteEmptyFolders(pathsToClean);

  // 소스 리로드
  reloadInstanceFlaySources(batchLoggerSync);

  await batchLogger('[instanceBatch] End');
  await noticeLogger('instanceBatch Completed');
}

/** 아카이브 배치 실행 */
async function archiveBatch(): Promise<void> {
  await batchLogger('[archiveBatch] Start');
  await batchLogger('[relocateArchiveFile]');

  for (const flay of getArchiveFlayList()) {
    const yyyyMM = getArchiveFolderName(flay);
    const destDir = path.join(config.flay.archivePath, yyyyMM);

    for (const [, fileList] of Object.entries(flay.files)) {
      for (const filePath of fileList) {
        const parentName = path.basename(path.dirname(filePath));
        if (parentName !== yyyyMM) {
          await batchLogger(`move ${filePath} to ${destDir}`);
          moveFileToDirectory(filePath, destDir);
        }
      }
    }
  }

  await deleteEmptyFolders([config.flay.archivePath]);
  reloadArchiveFlaySources(batchLoggerSync);

  await batchLogger('[archiveBatch] End');
  await noticeLogger('archiveBatch Completed');
}

/**
 * Flay 파일을 적절한 위치로 재배치한다.
 * Java BatchExecutor.assembleFlay() 대응
 */
async function assembleFlay(): Promise<void> {
  await batchLogger('[assembleFlay]');

  for (const flay of getInstanceFlayList()) {
    if (flay.archive) continue;

    // 커버/자막이 없으면 아카이브에서 찾기
    await recoverFromArchive(flay);

    const delegatePath = getDelegatePath(flay);

    for (const [, fileList] of Object.entries(flay.files)) {
      for (const filePath of fileList) {
        const parentDir = path.dirname(filePath);
        if (path.resolve(parentDir) !== path.resolve(delegatePath)) {
          await batchLogger(`move ${path.basename(filePath)} => ${delegatePath}`);
          moveFileToDirectory(filePath, delegatePath);
        }
      }
    }
  }
}

/**
 * 아카이브에서 커버/자막 파일을 복원한다.
 */
async function recoverFromArchive(flay: Flay): Promise<void> {
  // 커버 파일이 없으면 아카이브에서 찾기
  if (!flay.files.cover || flay.files.cover.length === 0) {
    try {
      const archiveFlay = getArchiveFlay(flay.opus);
      if (archiveFlay.files.cover && archiveFlay.files.cover.length > 0) {
        flay.files.cover.push(archiveFlay.files.cover[0]);
        await batchLogger(`add Cover ${archiveFlay.files.cover[0]}`);
      }
    } catch {
      // 아카이브에도 없으면 무시
    }
  }

  // 자막 파일이 없으면 아카이브에서 찾기
  if (!flay.files.subtitles || flay.files.subtitles.length === 0) {
    try {
      const archiveFlay = getArchiveFlay(flay.opus);
      if (archiveFlay.files.subtitles && archiveFlay.files.subtitles.length > 0) {
        flay.files.subtitles.push(...archiveFlay.files.subtitles);
        await batchLogger(`add subtitles ${archiveFlay.files.subtitles.join(', ')}`);
      }
    } catch {
      // 무시
    }
  }
}

/**
 * Flay가 위치해야 할 폴더를 결정한다.
 * Java BatchExecutor.getDelegatePath() 대응
 */
function getDelegatePath(flay: Flay): string {
  const movieCount = flay.files.movie?.length || 0;
  const coverCount = flay.files.cover?.length || 0;

  if (movieCount > 0) {
    const movieDir = path.dirname(flay.files.movie[0]);
    const rank = flay.video.rank;

    if (rank > 0) {
      // storage에 [studio]로
      return path.join(config.flay.storagePath, flay.studio);
    } else if (rank === 0) {
      // 같은 디스크의 stage에 [연도]로
      const root = path.parse(movieDir).root;
      const stagePath = config.flay.stagePaths.find((p) => p.startsWith(root.substring(0, 1)));
      if (stagePath) {
        return path.join(stagePath, flay.release.substring(0, 4));
      }
    }
  } else if (coverCount > 0) {
    // 비디오 없는 파일은 cover로
    return path.join(config.flay.coverPath, flay.release.substring(0, 4));
  }

  batchLoggerSync(`Not determine delegate path, return to Queue path. ${flay.opus}`);
  return config.flay.queuePath;
}

/**
 * 아카이빙: cover/subtitles는 아카이브로 이동, 나머지는 삭제
 * Java BatchExecutor.archiving() 대응
 */
async function archiving(flay: Flay, reason: string): Promise<void> {
  const yyyyMM = getArchiveFolderName(flay);
  const archiveDir = path.join(config.flay.archivePath, yyyyMM);

  for (const [key, fileList] of Object.entries(flay.files)) {
    for (const filePath of fileList) {
      if (key === 'cover' || key === 'subtitles') {
        await batchLogger(`will be move   ${filePath} to ${archiveDir}`);
        moveFileToDirectory(filePath, archiveDir);
      } else if (key !== 'candidate') {
        await batchLogger(`will be delete ${filePath}`);
        deleteFile(filePath);
      }
    }
  }

  flay.archive = true;
  historyRepository.save(createHistory(flay.opus, 'DELETE', reason));
}

/** 아카이브 폴더명 (yyyy-MM 형식) */
function getArchiveFolderName(flay: Flay): string {
  return flay.release.substring(0, 4) + '-' + flay.release.substring(5, 7);
}

/** 빈 폴더 삭제 */
async function deleteEmptyFolders(dirs: string[]): Promise<void> {
  await batchLogger('[deleteEmptyFolder]');
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    await batchLogger(`  scanning...   ${dir}`);
    await cleanEmptySubdirs(dir, dir);
  }
}

/** 재귀적으로 빈 하위 디렉토리를 삭제한다 */
async function cleanEmptySubdirs(rootDir: string, currentDir: string): Promise<void> {
  if (!fs.existsSync(currentDir)) return;
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const subDir = path.join(currentDir, entry.name);
      await cleanEmptySubdirs(rootDir, subDir);

      if (isEmptyDirectory(subDir)) {
        await batchLogger(`    empty directory delete ${subDir}`);
        fs.rmdirSync(subDir);
      }
    }
  }
}

/**
 * 백업 실행.
 * Java BatchExecutor.backup() 대응
 * 임시 폴더에 CSV/Info/Instance 파일을 모은 뒤 jar로 압축한다.
 */
async function backup(): Promise<void> {
  const backupPath = config.flay.backupPath;
  if (!fs.existsSync(backupPath)) {
    console.warn('[Batch] 백업 경로가 존재하지 않습니다.');
    return;
  }

  await batchLogger(`[Backup] START ${backupPath}`);

  const CSV_HEADER = 'Studio,Opus,Title,Actress,Released,Rank,Fullname';
  const CSV_FORMAT = (studio: string, opus: string, title: string, actress: string, release: string, rank: string, fullname: string) => `"${studio}","${opus}","${title}","${actress}","${release}",${rank},"${fullname}"`;

  const instanceJarFilename = config.flay.backup.instanceJarFilename;
  const archiveJarFilename = config.flay.backup.archiveJarFilename;
  const instanceCsvFilename = config.flay.backup.instanceCsvFilename;
  const archiveCsvFilename = config.flay.backup.archiveCsvFilename;

  const backupInstanceJarPath = path.join(backupPath, instanceJarFilename);
  const backupArchiveJarPath = path.join(backupPath, archiveJarFilename);
  const backupRootPath = path.join(config.flay.queuePath, 'InstanceBackupTemp');
  const backupInstanceFilePath = path.join(backupRootPath, 'instanceFiles');

  // 임시 폴더 생성/정리
  if (fs.existsSync(backupRootPath)) {
    fs.rmSync(backupRootPath, { recursive: true, force: true });
  }
  fs.mkdirSync(backupRootPath, { recursive: true });
  fs.mkdirSync(backupInstanceFilePath, { recursive: true });

  const instanceFlayList = getInstanceFlayList();
  const archiveFlayList = getArchiveFlayList();
  const historyList = historyRepository.list();

  // Instance CSV
  await batchLogger(`[Backup] Write instance csv ${instanceCsvFilename} to ${backupRootPath}`);
  const instanceLines = [CSV_HEADER];
  for (const flay of instanceFlayList) {
    const actress = flay.actressList.join(',');
    const fullname = `[${flay.studio}][${flay.opus}][${flay.title}][${actress}][${flay.release}]`;
    instanceLines.push(CSV_FORMAT(flay.studio, flay.opus, flay.title, actress, flay.release, String(flay.video.rank), fullname));
  }
  writeFileWithUtf8Bom(path.join(backupRootPath, instanceCsvFilename), instanceLines);

  // Archive CSV (히스토리에만 있고 아카이브에 없는 opus도 포함)
  await batchLogger(`[Backup] Write archive  csv ${archiveCsvFilename}  to ${backupRootPath}`);
  const archiveLines = [CSV_HEADER];
  const archiveOpusSet = new Set<string>();
  for (const flay of archiveFlayList) {
    archiveOpusSet.add(flay.opus);
    const actress = flay.actressList.join(',');
    const fullname = `[${flay.studio}][${flay.opus}][${flay.title}][${actress}][${flay.release}]`;
    archiveLines.push(CSV_FORMAT(flay.studio, flay.opus, flay.title, actress, flay.release, '', fullname));
  }
  for (const history of historyList) {
    if (!archiveOpusSet.has(history.opus)) {
      archiveLines.push(CSV_FORMAT('', history.opus, '', '', '', '', history.desc));
    }
  }
  writeFileWithUtf8Bom(path.join(backupRootPath, archiveCsvFilename), archiveLines);

  // Info 폴더 복사
  const infoSrc = config.flay.infoPath;
  if (fs.existsSync(infoSrc)) {
    await batchLogger(`[Backup] Copy Info folder ${infoSrc} to ${backupRootPath}`);
    copyDirectoryRecursive(infoSrc, path.join(backupRootPath, 'Info'));
  }

  // Instance cover/subtitles 파일 복사
  await batchLogger(`[Backup] Copy Instance file to ${backupInstanceFilePath}`);
  for (const flay of instanceFlayList) {
    for (const file of flay.files.cover) {
      if (fs.existsSync(file)) {
        fs.copyFileSync(file, path.join(backupInstanceFilePath, path.basename(file)));
      }
    }
    for (const file of flay.files.subtitles) {
      if (fs.existsSync(file)) {
        fs.copyFileSync(file, path.join(backupInstanceFilePath, path.basename(file)));
      }
    }
  }

  // Instance jar 압축
  await batchLogger('[Backup] Compress Instance folder');
  await compress(backupInstanceJarPath, backupRootPath);

  // Archive jar 압축
  await batchLogger('[Backup] Compress Archive folder');
  await compress(backupArchiveJarPath, config.flay.archivePath);

  // 임시 폴더 삭제
  await batchLogger(`[Backup] Delete Instance Backup Temp folder ${backupRootPath}`);
  fs.rmSync(backupRootPath, { recursive: true, force: true });

  await batchLogger('[Backup] END');
  await noticeLogger('backup Completed');
}

/**
 * jar 명령어로 폴더를 압축한다.
 * Java BatchExecutor.compress() 대응
 */
async function compress(destJarPath: string, targetFolder: string): Promise<void> {
  const jarFileName = path.basename(destJarPath);
  const logFileName = `${jarFileName}.${new Date().toISOString().slice(0, 10)}.log`;
  const logFilePath = path.join(config.flay.queuePath, logFileName);
  await batchLogger(`         jar cf0M "${destJarPath}" -C "${targetFolder}" .`);
  try {
    const logFd = fs.openSync(logFilePath, 'w');
    try {
      const result = spawnSync('jar', ['cf0M', destJarPath, '-C', targetFolder, '.'], { stdio: ['ignore', logFd, logFd] });
      if (result.status !== 0) {
        throw new Error(`jar 프로세스 종료 코드: ${result.status}`);
      }
    } finally {
      fs.closeSync(logFd);
    }
    const size = fs.statSync(destJarPath).size;
    const prettySize = size > 1024 * 1024 * 1024 ? `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB` : size > 1024 * 1024 ? `${(size / (1024 * 1024)).toFixed(1)} MB` : `${(size / 1024).toFixed(1)} KB`;
    await batchLogger(`         completed ${prettySize}`);
  } catch (err: any) {
    await batchLogger(`         jar 압축 실패: ${err.message}`);
  }
}

/** UTF-8 BOM 포함 파일 쓰기 */
function writeFileWithUtf8Bom(filePath: string, lines: string[]): void {
  const content = '\uFEFF' + lines.join('\n') + '\n';
  fs.writeFileSync(filePath, content, 'utf-8');
}

/** 디렉토리를 재귀적으로 복사한다 */
function copyDirectoryRecursive(src: string, dest: string): void {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirectoryRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
