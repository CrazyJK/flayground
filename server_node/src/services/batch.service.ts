import fs from 'fs';
import path from 'path';
import { config } from '../config';
import { Flay } from '../domain/flay';
import { createHistory } from '../domain/history';
import { getArchiveFlay, getArchiveFlayList, getInstanceFlayList, loadAllFlaySources, reloadInstanceFlaySources } from '../sources/flay-source';
import { historyRepository } from '../sources/history-repository';
import { deleteFile, isEmptyDirectory, moveFileToDirectory } from './flay-file-handler';
import { listOrderByScoreDesc } from './score-calculator';
import { SseMessage, sseSend } from './sse-emitters';

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

/**
 * SSE를 통해 배치 로그를 전송한다.
 */
function batchLogger(message: string): void {
  console.log(`[Batch] ${message}`);
  const msg: SseMessage = { type: 'Batch', message };
  sseSend(msg);
}

/**
 * SSE를 통해 공지 알림을 전송한다.
 */
function noticeLogger(message: string): void {
  console.log(`[Batch] ${message}`);
  const msg: SseMessage = { type: 'Notice', message };
  sseSend(msg);
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
  // 비동기로 실행 (Node.js에서는 setImmediate로 메인 스레드 해제)
  setImmediate(() => {
    try {
      switch (operation) {
        case 'I':
          instanceBatch();
          break;
        case 'A':
          archiveBatch();
          break;
        case 'B':
          backup();
          break;
        default:
          throw new Error(`알 수 없는 배치 오퍼레이션: ${operation}`);
      }
    } catch (err: any) {
      console.error(`[Batch] 오류: ${err.message}`);
      batchLogger(`오류: ${err.message}`);
    }
  });
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
  batchLogger('[reload] Start');
  reloadInstanceFlaySources();
  batchLogger('[reload] End');
  noticeLogger('reload Completed');
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
function instanceBatch(): void {
  batchLogger('[instanceBatch] Start');

  // rank < 0 삭제
  batchLogger('[deleteLowerRank]');
  for (const flay of listLowerRank()) {
    archiving(flay, 'delete Lower Rank Video');
  }

  // low score 삭제
  if (deleteLowerScore) {
    batchLogger('[deleteLowerScore]');
    for (const flay of listLowerScore()) {
      archiving(flay, 'delete Lower Score Video');
    }
  }

  // 파일 재배치
  assembleFlay();

  // 빈 폴더 삭제
  const pathsToClean = [...config.flay.stagePaths, config.flay.coverPath, config.flay.storagePath];
  deleteEmptyFolders(pathsToClean);

  // 소스 리로드
  reloadInstanceFlaySources();

  batchLogger('[instanceBatch] End');
  noticeLogger('instanceBatch Completed');
}

/** 아카이브 배치 실행 */
function archiveBatch(): void {
  batchLogger('[archiveBatch] Start');
  batchLogger('[relocateArchiveFile]');

  for (const flay of getArchiveFlayList()) {
    const yyyyMM = getArchiveFolderName(flay);
    const destDir = path.join(config.flay.archivePath, yyyyMM);

    for (const [, fileList] of Object.entries(flay.files)) {
      for (const filePath of fileList) {
        const parentName = path.basename(path.dirname(filePath));
        if (parentName !== yyyyMM) {
          batchLogger(`move ${filePath} to ${destDir}`);
          moveFileToDirectory(filePath, destDir);
        }
      }
    }
  }

  deleteEmptyFolders([config.flay.archivePath]);
  loadAllFlaySources();

  batchLogger('[archiveBatch] End');
  noticeLogger('archiveBatch Completed');
}

/**
 * Flay 파일을 적절한 위치로 재배치한다.
 * Java BatchExecutor.assembleFlay() 대응
 */
function assembleFlay(): void {
  batchLogger('[assembleFlay]');

  for (const flay of getInstanceFlayList()) {
    if (flay.archive) continue;

    // 커버/자막이 없으면 아카이브에서 찾기
    recoverFromArchive(flay);

    const delegatePath = getDelegatePath(flay);

    for (const [, fileList] of Object.entries(flay.files)) {
      for (const filePath of fileList) {
        const parentDir = path.dirname(filePath);
        if (path.resolve(parentDir) !== path.resolve(delegatePath)) {
          batchLogger(`move ${path.basename(filePath)} => ${delegatePath}`);
          moveFileToDirectory(filePath, delegatePath);
        }
      }
    }
  }
}

/**
 * 아카이브에서 커버/자막 파일을 복원한다.
 */
function recoverFromArchive(flay: Flay): void {
  // 커버 파일이 없으면 아카이브에서 찾기
  if (!flay.files.cover || flay.files.cover.length === 0) {
    try {
      const archiveFlay = getArchiveFlay(flay.opus);
      if (archiveFlay.files.cover && archiveFlay.files.cover.length > 0) {
        flay.files.cover.push(archiveFlay.files.cover[0]);
        batchLogger(`add Cover ${archiveFlay.files.cover[0]}`);
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
        batchLogger(`add subtitles ${archiveFlay.files.subtitles.join(', ')}`);
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

  batchLogger(`Not determine delegate path, return to Queue path. ${flay.opus}`);
  return config.flay.queuePath;
}

/**
 * 아카이빙: cover/subtitles는 아카이브로 이동, 나머지는 삭제
 * Java BatchExecutor.archiving() 대응
 */
function archiving(flay: Flay, reason: string): void {
  const yyyyMM = getArchiveFolderName(flay);
  const archiveDir = path.join(config.flay.archivePath, yyyyMM);

  for (const [key, fileList] of Object.entries(flay.files)) {
    for (const filePath of fileList) {
      if (key === 'cover' || key === 'subtitles') {
        batchLogger(`will be move   ${filePath} to ${archiveDir}`);
        moveFileToDirectory(filePath, archiveDir);
      } else if (key !== 'candidate') {
        batchLogger(`will be delete ${filePath}`);
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
function deleteEmptyFolders(dirs: string[]): void {
  batchLogger('[deleteEmptyFolder]');
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    batchLogger(`  scanning...   ${dir}`);
    cleanEmptySubdirs(dir, dir);
  }
}

/** 재귀적으로 빈 하위 디렉토리를 삭제한다 */
function cleanEmptySubdirs(rootDir: string, currentDir: string): void {
  if (!fs.existsSync(currentDir)) return;
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const subDir = path.join(currentDir, entry.name);
      cleanEmptySubdirs(rootDir, subDir);

      if (isEmptyDirectory(subDir)) {
        batchLogger(`    empty directory delete ${subDir}`);
        fs.rmdirSync(subDir);
      }
    }
  }
}

/**
 * 백업 실행.
 * Java BatchExecutor.backup() 대응
 * instance/archive CSV와 Info 폴더를 백업한다.
 */
function backup(): void {
  const backupPath = config.flay.backupPath;
  if (!fs.existsSync(backupPath)) {
    console.warn('[Batch] 백업 경로가 존재하지 않습니다.');
    return;
  }

  batchLogger(`[Backup] START ${backupPath}`);

  const CSV_HEADER = 'Studio,Opus,Title,Actress,Released,Rank,Fullname';
  const instanceFlayList = getInstanceFlayList();
  const archiveFlayList = getArchiveFlayList();

  // Instance CSV
  const instanceCsvFilename = config.flay.backup.instanceCsvFilename;
  const instanceCsvPath = path.join(backupPath, instanceCsvFilename);
  const instanceLines = [CSV_HEADER];
  for (const flay of instanceFlayList) {
    const actress = flay.actressList.join(',');
    const fullname = `[${flay.studio}][${flay.opus}][${flay.title}][${actress}][${flay.release}]`;
    instanceLines.push(`"${flay.studio}","${flay.opus}","${flay.title}","${actress}","${flay.release}",${flay.video.rank},"${fullname}"`);
  }
  writeFileWithUtf8Bom(instanceCsvPath, instanceLines);
  batchLogger(`[Backup] Write instance csv ${instanceCsvFilename}`);

  // Archive CSV
  const archiveCsvFilename = config.flay.backup.archiveCsvFilename;
  const archiveCsvPath = path.join(backupPath, archiveCsvFilename);
  const archiveLines = [CSV_HEADER];
  for (const flay of archiveFlayList) {
    const actress = flay.actressList.join(',');
    const fullname = `[${flay.studio}][${flay.opus}][${flay.title}][${actress}][${flay.release}]`;
    archiveLines.push(`"${flay.studio}","${flay.opus}","${flay.title}","${actress}","${flay.release}",,"${fullname}"`);
  }
  writeFileWithUtf8Bom(archiveCsvPath, archiveLines);
  batchLogger(`[Backup] Write archive csv ${archiveCsvFilename}`);

  // Info 폴더 복사
  const infoSrc = config.flay.infoPath;
  const infoDest = path.join(backupPath, 'Info');
  if (fs.existsSync(infoSrc)) {
    copyDirectoryRecursive(infoSrc, infoDest);
    batchLogger(`[Backup] Copy Info folder ${infoSrc} to ${infoDest}`);
  }

  batchLogger('[Backup] END');
  noticeLogger('backup Completed');
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
