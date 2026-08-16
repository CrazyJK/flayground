/** FlayHistory 액션 타입 */
export type HistoryAction = 'PLAY' | 'DELETE' | 'UPDATE';

/** FlayHistory 도메인 */
export interface FlayHistory {
  /** "yyyy-MM-dd HH:mm:ss" 형식 */
  date: string;
  opus: string;
  action: string;
  desc: string;
}

/** 날짜 형식 상수 */
export const DATE_TIME_FORMAT = 'yyyy-MM-dd HH:mm:ss';

/**
 * 현재 시각을 "yyyy-MM-dd HH:mm:ss" 형식으로 포맷
 */
export function formatDateTime(d: Date = new Date()): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 * 새 FlayHistory 생성
 * @param opus 대상 opus
 * @param action 액션 종류
 * @param desc 설명
 */
export function createHistory(opus: string, action: HistoryAction, desc: string): FlayHistory {
  return { date: formatDateTime(), opus, action, desc };
}
