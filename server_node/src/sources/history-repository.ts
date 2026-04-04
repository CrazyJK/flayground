import fs from 'fs';
import path from 'path';
import { config } from '../config';
import { History } from '../domain/history';

const LINE = '\r\n';
const UTF8_BOM = '\uFEFF';
const HISTORY_FILENAME = 'history.csv';

/** History 목록 (메모리) */
let historyList: History[] = [];

/**
 * CSV 파일에서 History를 로드한다.
 * Java HistoryRepository.load() 대응
 */
function load(): void {
  const filePath = getFilePath();
  if (!fs.existsSync(filePath)) {
    console.warn(`[History] 파일 없음: ${filePath}`);
    historyList = [];
    return;
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.split(/\r?\n/);
  historyList = [];
  let isFirst = true;

  for (let line of lines) {
    if (isFirst && line.startsWith(UTF8_BOM)) {
      line = line.substring(1);
      isFirst = false;
    }
    line = line.trim();
    if (!line) continue;

    // CSV: date, opus, action, desc (최대 4분할)
    const parts = line.split(',').map((s) => s.trim());
    const history: History = {
      date: parts[0] || '',
      opus: parts[1] || '',
      action: parts[2] || '',
      desc: parts.slice(3).join(',').trim(),
    };
    historyList.push(history);
  }

  console.log(`[History] ${String(historyList.length).padStart(5)} 건 로드 - ${filePath}`);
}

/** History 파일 경로 */
function getFilePath(): string {
  return path.join(config.flay.infoPath, HISTORY_FILENAME);
}

/**
 * History를 CSV 형식 문자열로 변환
 */
function toFileSaveString(h: History): string {
  return `${h.date}, ${h.opus}, ${h.action}, ${h.desc || ''}${LINE}`;
}

/** 전체 목록 반환 */
function list(): History[] {
  return historyList;
}

/**
 * 새 History를 저장한다.
 * 메모리에 추가 + 파일에 append
 */
function save(history: History): void {
  historyList.push(history);
  fs.appendFileSync(getFilePath(), toFileSaveString(history), 'utf-8');
}

/**
 * opus에 대한 마지막 PLAY 기록을 찾는다.
 */
function findLastPlay(opus: string): History | null {
  for (let i = historyList.length - 1; i >= 0; i--) {
    const h = historyList[i];
    if (h.opus === opus && h.action === 'PLAY') {
      return h;
    }
  }
  return null;
}

/**
 * 검색어로 History를 필터링한다.
 */
function search(query: string): History[] {
  return historyList.filter((h) => h.date.includes(query) || h.opus === query || h.action === query || h.desc.includes(query));
}

export const historyRepository = {
  load,
  list,
  save,
  findLastPlay,
  search,
};
