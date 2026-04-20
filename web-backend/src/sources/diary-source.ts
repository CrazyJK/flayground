import fs from 'fs';
import path from 'path';
import { config } from '../config';
import { Diary } from '../domain/diary';

const DIARY_EXT = '.diary';

/** Diary 맵 (date -> Diary) */
const diaryMap = new Map<string, Diary>();

/**
 * 다이어리 디렉토리에서 모든 .diary 파일을 로드한다.
 * Java DiarySourceImpl.load() 대응
 */
function load(): void {
  const diaryDir = config.flay.diaryPath;
  diaryMap.clear();

  if (!fs.existsSync(diaryDir) || !fs.statSync(diaryDir).isDirectory()) {
    console.warn(`[Diary] 디렉토리 없음: ${diaryDir}`);
    return;
  }

  const files = fs.readdirSync(diaryDir).filter((f) => f.endsWith(DIARY_EXT));
  console.log(`[Diary] ${String(files.length).padStart(5)} diary - ${diaryDir}`);

  for (const fileName of files) {
    const filePath = path.join(diaryDir, fileName);
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const diary: Diary = JSON.parse(raw);
      diaryMap.set(diary.meta.date, diary);
    } catch (err: any) {
      console.error(`[Diary] 파일 읽기 실패: ${filePath}`, err.message);
    }
  }
}

/** 모든 날짜 키 반환 */
function dates(): string[] {
  return Array.from(diaryMap.keys()).sort();
}

/** 모든 Diary 목록 반환 */
function list(): Diary[] {
  return Array.from(diaryMap.values());
}

/** 날짜로 Diary 조회 */
function find(date: string): Diary | null {
  return diaryMap.get(date) ?? null;
}

/** 메타 목록만 반환 */
function metaList(): Diary['meta'][] {
  return list().map((d) => d.meta);
}

/**
 * Diary를 저장한다.
 * 기존 파일이 있으면 백업 후 덮어쓴다.
 */
function save(diary: Diary): Diary {
  diary.meta.lastModified = new Date().toISOString();
  diaryMap.set(diary.meta.date, diary);

  const diaryDir = config.flay.diaryPath;
  const diaryFile = path.join(diaryDir, `${diary.meta.date}${DIARY_EXT}`);

  // 기존 파일 백업
  if (fs.existsSync(diaryFile)) {
    const backupPath = getBackupPath(diaryFile);
    fs.copyFileSync(diaryFile, backupPath);
  }

  fs.writeFileSync(diaryFile, JSON.stringify(diary, null, 2), 'utf-8');
  console.log(`[Diary] 저장: ${diary.meta.date} - ${diary.meta.title}`);

  return diary;
}

/**
 * 백업 파일 경로를 생성한다. 기존 백업 중 가장 큰 번호 + 1
 */
function getBackupPath(filePath: string): string {
  const dir = path.dirname(filePath);
  const base = path.basename(filePath);
  const existing = fs.readdirSync(dir).filter((f) => f.startsWith(base));

  let maxNum = 0;
  for (const f of existing) {
    const ext = f.substring(base.length + 1);
    const num = parseInt(ext, 10);
    if (!isNaN(num) && num > maxNum) maxNum = num;
  }

  return path.join(dir, `${base}.${maxNum + 1}`);
}

export const diarySource = {
  load,
  dates,
  list,
  find,
  metaList,
  save,
};
