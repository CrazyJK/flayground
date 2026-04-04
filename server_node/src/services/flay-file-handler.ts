import fs from 'fs';
import path from 'path';
import { config } from '../config';
import { Flay } from '../domain/flay';
import { isSubtitlesFile, isVideoFile } from '../sources/flay-source';

/**
 * Flay 파일 핸들러.
 * 파일 이동, 복사, 삭제, 이름 변경 등 파일 시스템 조작을 담당한다.
 * Java FlayFileHandler 대응
 */

/**
 * Flay의 전체 파일명을 생성한다.
 * [studio][opus][title][actress][release] 형식
 */
function getFullname(flay: Flay): string {
  const actress = flay.actressList.join(',');
  return `[${flay.studio}][${flay.opus}][${flay.title}][${actress}][${flay.release}]`;
}

/**
 * Flay의 모든 파일 이름을 변경한다.
 * Java FlayFileHandler.rename(Flay) 대응
 */
export function renameFlay(flay: Flay): void {
  const fullname = getFullname(flay);

  for (const [key, fileList] of Object.entries(flay.files)) {
    let fileCount = 0;
    const increaseCount = fileList.length > 1;
    const newFiles: string[] = [];

    for (const filePath of fileList) {
      const tail = increaseCount ? `${++fileCount}` : '';
      const ext = path.extname(filePath);
      const dir = path.dirname(filePath);
      const newPath = path.join(dir, `${fullname}${tail}${ext}`);

      if (filePath !== newPath) {
        try {
          fs.renameSync(filePath, newPath);
          console.log(`[FileHandler] 이름변경: ${path.basename(filePath)} -> ${path.basename(newPath)}`);
        } catch (err: any) {
          throw new Error(`이름 변경 실패: ${filePath} -> ${newPath}: ${err.message}`);
        }
      }
      newFiles.push(newPath);
    }

    (flay.files as any)[key] = newFiles;
  }
}

/**
 * Flay의 studio, title, actressList, release를 변경하고 파일 이름을 변경한다.
 * Java FlayFileHandler.rename(Flay, String, String, List<String>, String) 대응
 */
export function renameFlayWith(flay: Flay, studio: string, title: string, actressList: string[], release: string): void {
  flay.studio = studio;
  flay.title = title;
  flay.actressList = actressList;
  flay.release = release;
  renameFlay(flay);
}

/**
 * Flay의 배우 목록만 변경하고 파일 이름을 변경한다.
 */
export function renameFlayActress(flay: Flay, actressList: string[]): void {
  flay.actressList = actressList;
  renameFlay(flay);
}

/**
 * 파일을 지정된 디렉토리로 이동한다.
 * Java FlayFileHandler.moveFileToDirectory() 대응
 */
export function moveFileToDirectory(filePath: string, destDir: string): void {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const destPath = path.join(destDir, path.basename(filePath));

  if (fs.existsSync(destPath)) {
    const srcSize = fs.statSync(filePath).size;
    const destSize = fs.statSync(destPath).size;
    if (srcSize <= destSize) {
      // 소스가 같거나 작으면 소스 삭제
      fs.unlinkSync(filePath);
      console.warn(`[FileHandler] 대상 파일 이미 존재, 소스 삭제: ${filePath}`);
      return;
    } else {
      // 소스가 크면 대상 삭제 후 재시도
      fs.unlinkSync(destPath);
      console.warn(`[FileHandler] 대상 파일이 작아 삭제 후 재이동: ${destPath}`);
    }
  }

  fs.copyFileSync(filePath, destPath);
  fs.unlinkSync(filePath);
}

/**
 * 파일을 삭제한다. recyclebin 설정에 따라 휴지통으로 이동할 수 있다.
 * Java FlayFileHandler.deleteFile() 대응
 */
export function deleteFile(filePath: string): void {
  if (fs.statSync(filePath).isDirectory()) {
    throw new Error('디렉토리는 삭제할 수 없습니다: ' + filePath);
  }

  if (config.flay.recyclebinUse) {
    const root = path.parse(filePath).root;
    const recycleBin = path.join(root, config.flay.recyclebin);
    moveFileToDirectory(filePath, recycleBin);
    console.warn(`[FileHandler] 파일을 휴지통으로 이동: ${filePath} -> ${recycleBin}`);
  } else {
    fs.unlinkSync(filePath);
    console.warn(`[FileHandler] 파일 삭제: ${filePath}`);
  }
}

/**
 * Flay의 cover 파일들을 coverPath로 이동한다.
 * Java FlayFileHandler.moveCoverDirectory() 대응
 */
export function moveCoverDirectory(flay: Flay): void {
  for (const fileList of Object.values(flay.files)) {
    for (const filePath of fileList) {
      moveFileToDirectory(filePath, config.flay.coverPath);
    }
  }
}

/**
 * 디스크 여유 공간을 확인한다.
 */
export function checkDiskSpace(diskPath: string, requiredBytes: number): boolean {
  // Node.js에서 직접 free space를 구하기 어려우므로 간략 처리
  // 실제 운영에서는 추가 구현 필요
  return true;
}

/**
 * 디렉토리가 비어있는지 확인한다.
 */
export function isEmptyDirectory(dirPath: string): boolean {
  if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) return false;
  return fs.readdirSync(dirPath).length === 0;
}

/**
 * 후보 파일들을 찾는다.
 * Java CandidatesProvider.find() 대응
 */
export function findCandidateFiles(): string[] {
  const candidateFiles: string[] = [];
  const dirs = [config.flay.candidatePath, config.flay.subtitlesPath];

  for (const dir of dirs) {
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) continue;

    const files = listFilesRecursive(dir);
    const matched = files.filter((f) => isVideoFile(f) || isSubtitlesFile(f));
    console.log(`[Candidates] ${String(matched.length).padStart(5)} 파일    - ${dir}`);
    candidateFiles.push(...matched);
  }

  console.log(`[Candidates] ${String(candidateFiles.length).padStart(5)} candidates`);
  return candidateFiles;
}

/**
 * 후보 파일을 Flay에 매칭하여 candidate 리스트를 채운다.
 * Java CandidatesProvider.collect() 대응
 */
export function collectCandidates(flayList: Flay[]): Flay[] {
  const candidateFiles = findCandidateFiles();

  return flayList.filter((flay) => {
    // 후보 초기화
    flay.files.candidate = [];

    const key1 = flay.opus.toUpperCase();
    const key2 = key1.replace('-', '');
    const key3 = key1.replace('-', '00');

    let found = false;
    for (const file of candidateFiles) {
      const fileName = path.basename(file).toUpperCase();
      if (fileName.includes(key1) || fileName.includes(key2) || fileName.includes(key3)) {
        flay.files.candidate.push(file);
        found = true;
      }
    }
    return found;
  });
}

/**
 * 디렉토리 재귀 순회
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
