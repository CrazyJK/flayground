/** 금융기관 타입 */
export type InstitutionType = 'bank' | 'insurance' | 'stock';

/** 금융기관 */
export interface Institution {
  id: number;
  name: string;
  type: InstitutionType;
  sort: number;
}

/** 계좌 */
export interface Account {
  id: number;
  institutionId: number;
  name: string;
  accountNumber: string;
  amount: number;
  sort: number;
}

/** 스냅샷 항목 */
export interface SnapshotEntry {
  accountId: number;
  name: string;
  amount: number;
  instName: string;
  instType: InstitutionType;
}

/** 스냅샷 */
export interface Snapshot {
  id: number;
  date: string;
  createdAt: string;
  entries: SnapshotEntry[];
}

/** 차트용 스냅샷 요약 */
export interface SnapshotSummary {
  date: string;
  instName: string;
  total: number;
}

/** 기관 CSV import 결과 */
interface InstitutionsImportResult {
  message: string;
  created: number;
  skipped: number;
}

/** 스냅샷 CSV import 결과 */
interface SnapshotsImportResult {
  message: string;
  imported: number;
  failed: number;
}

/** 스냅샷 저장 결과 */
interface SaveSnapshotResult {
  date: string;
}

/** 전체 초기화 결과 */
interface ResetAllResult {
  message: string;
}

const BASE = '/api/v1/financial-note';
const JSON_HEADERS = { 'Content-Type': 'application/json' };

/**
 * JSON 응답을 반환하는 공통 요청 함수.
 * @template T 응답 타입
 * @param {string} url 요청 URL
 * @param {RequestInit} [init] fetch 옵션
 * @returns {Promise<T>} JSON 파싱 결과
 */
const requestJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, init);
  return (await response.json()) as T;
};

/**
 * 응답 본문이 필요 없는 공통 요청 함수.
 * @param {string} url 요청 URL
 * @param {RequestInit} [init] fetch 옵션
 * @returns {Promise<void>} 완료 Promise
 */
const requestVoid = async (url: string, init?: RequestInit): Promise<void> => {
  await fetch(url, init);
};

/**
 * JSON 본문을 전송하는 요청 옵션을 생성한다.
 * @param {'POST' | 'PUT' | 'DELETE'} method HTTP 메서드
 * @param {unknown} [body] JSON 직렬화 대상
 * @returns {RequestInit} fetch 옵션
 */
const jsonRequest = (method: 'POST' | 'PUT' | 'DELETE', body?: unknown): RequestInit => ({
  method,
  headers: JSON_HEADERS,
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

/* ── 금융기관 ── */
/**
 * 금융기관 목록을 조회한다.
 * @returns {Promise<Institution[]>} 금융기관 목록
 */
export const fetchInstitutions = (): Promise<Institution[]> => requestJson<Institution[]>(`${BASE}/institutions`);

/**
 * 금융기관을 추가한다.
 * @param {string} name 금융기관명
 * @param {InstitutionType} type 금융기관 타입
 * @returns {Promise<Institution>} 생성된 금융기관
 */
export const addInstitution = (name: string, type: InstitutionType): Promise<Institution> => requestJson<Institution>(`${BASE}/institutions`, jsonRequest('POST', { name, type }));

/**
 * 금융기관을 삭제한다.
 * @param {number} id 금융기관 ID
 * @returns {Promise<void>} 완료 Promise
 */
export const deleteInstitution = (id: number): Promise<void> => requestVoid(`${BASE}/institutions/${id}`, { method: 'DELETE' });

/* ── 계좌 ── */
/**
 * 전체 계좌 목록을 조회한다.
 * @returns {Promise<Account[]>} 계좌 목록
 */
export const fetchAllAccounts = (): Promise<Account[]> => requestJson<Account[]>(`${BASE}/accounts`);

/**
 * 계좌를 추가한다.
 * @param {number} institutionId 금융기관 ID
 * @param {string} name 계좌명
 * @param {string} [accountNumber=''] 계좌번호
 * @returns {Promise<Account>} 생성된 계좌
 */
export const addAccount = (institutionId: number, name: string, accountNumber = ''): Promise<Account> => requestJson<Account>(`${BASE}/accounts`, jsonRequest('POST', { institutionId, name, accountNumber }));

/**
 * 계좌 금액을 갱신한다.
 * @param {number} id 계좌 ID
 * @param {number} amount 금액
 * @returns {Promise<{ id: number; amount: number }>} 갱신 결과
 */
export const updateAccountAmount = (id: number, amount: number): Promise<{ id: number; amount: number }> => requestJson<{ id: number; amount: number }>(`${BASE}/accounts/${id}/amount`, jsonRequest('PUT', { amount }));

/**
 * 계좌를 삭제한다.
 * @param {number} id 계좌 ID
 * @returns {Promise<void>} 완료 Promise
 */
export const deleteAccount = (id: number): Promise<void> => requestVoid(`${BASE}/accounts/${id}`, { method: 'DELETE' });

/* ── 스냅샷 ── */
/**
 * 저장된 스냅샷 날짜 목록을 조회한다.
 * @returns {Promise<string[]>} 날짜 목록
 */
export const fetchSnapshotDates = (): Promise<string[]> => requestJson<string[]>(`${BASE}/snapshots`);

/**
 * 스냅샷 요약 목록을 조회한다.
 * @returns {Promise<SnapshotSummary[]>} 스냅샷 요약 목록
 */
export const fetchSnapshotSummaries = (): Promise<SnapshotSummary[]> => requestJson<SnapshotSummary[]>(`${BASE}/snapshots/summaries`);

/**
 * 특정 날짜의 스냅샷을 조회한다.
 * @param {string} date 조회 날짜
 * @returns {Promise<Snapshot>} 스냅샷 데이터
 */
export const fetchSnapshot = (date: string): Promise<Snapshot> => requestJson<Snapshot>(`${BASE}/snapshots/${date}`);

/**
 * 스냅샷을 저장한다.
 * @param {string} date 저장 날짜
 * @param {SnapshotEntry[]} entries 스냅샷 항목
 * @returns {Promise<SaveSnapshotResult>} 저장 결과
 */
export const saveSnapshot = (date: string, entries: SnapshotEntry[]): Promise<SaveSnapshotResult> => requestJson<SaveSnapshotResult>(`${BASE}/snapshots`, jsonRequest('POST', { date, entries }));

/* ── CSV Import ── */
/**
 * 기관/계좌 CSV를 import한다.
 * @param {string} csv CSV 원문
 * @returns {Promise<InstitutionsImportResult>} import 결과
 */
export const importInstitutionsCsv = (csv: string): Promise<InstitutionsImportResult> => requestJson<InstitutionsImportResult>(`${BASE}/import/institutions`, jsonRequest('POST', { csv }));

/**
 * 스냅샷 CSV를 import한다.
 * @param {string} csv CSV 원문
 * @returns {Promise<SnapshotsImportResult>} import 결과
 */
export const importSnapshotsCsv = (csv: string): Promise<SnapshotsImportResult> => requestJson<SnapshotsImportResult>(`${BASE}/import/snapshots`, jsonRequest('POST', { csv }));

/* ── 전체 초기화 ── */
/**
 * 기관/계좌/스냅샷 데이터를 전체 초기화한다.
 * @returns {Promise<ResetAllResult>} 초기화 결과
 */
export const resetAll = (): Promise<ResetAllResult> => requestJson<ResetAllResult>(`${BASE}/reset`, { method: 'DELETE' });

/** 숫자를 한국어 천단위 포맷으로 변환 */
export const fmtKrw = (n: number): string => Math.round(n).toLocaleString('ko-KR');
