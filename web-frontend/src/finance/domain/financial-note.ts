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

/** 증권 종목 */
export interface StockItem {
  id: number;
  accountId: number;
  code: string;
  name: string;
  buyPrice: number;
  buyQty: number;
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

const BASE = '/api/v1/financial-note';

/* ── 금융기관 ── */
export const fetchInstitutions = (): Promise<Institution[]> => fetch(`${BASE}/institutions`).then((r) => r.json());
export const addInstitution = (name: string, type: InstitutionType): Promise<Institution> => fetch(`${BASE}/institutions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, type }) }).then((r) => r.json());
export const deleteInstitution = (id: number): Promise<void> => fetch(`${BASE}/institutions/${id}`, { method: 'DELETE' }).then(() => undefined);

/* ── 계좌 ── */
export const fetchAllAccounts = (): Promise<Account[]> => fetch(`${BASE}/accounts`).then((r) => r.json());
export const addAccount = (institutionId: number, name: string, accountNumber = ''): Promise<Account> => fetch(`${BASE}/accounts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ institutionId, name, accountNumber }) }).then((r) => r.json());
export const updateAccountAmount = (id: number, amount: number): Promise<{ id: number; amount: number }> => fetch(`${BASE}/accounts/${id}/amount`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount }) }).then((r) => r.json());
export const deleteAccount = (id: number): Promise<void> => fetch(`${BASE}/accounts/${id}`, { method: 'DELETE' }).then(() => undefined);

/* ── 증권 종목 ── */
export const fetchStockItems = (accountId: number): Promise<StockItem[]> => fetch(`${BASE}/accounts/${accountId}/stock-items`).then((r) => r.json());
export const addStockItem = (accountId: number, code: string, name: string, buyPrice: number, buyQty: number): Promise<StockItem> => fetch(`${BASE}/accounts/${accountId}/stock-items`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, name, buyPrice, buyQty }) }).then((r) => r.json());
export const deleteStockItem = (id: number): Promise<void> => fetch(`${BASE}/stock-items/${id}`, { method: 'DELETE' }).then(() => undefined);
export const fetchStockPrice = (code: string): Promise<{ code: string; price: number }> => fetch(`${BASE}/stock-price/${code}`).then((r) => r.json());

/* ── 스냅샷 ── */
export const fetchSnapshotDates = (): Promise<string[]> => fetch(`${BASE}/snapshots`).then((r) => r.json());
export const fetchSnapshotSummaries = (): Promise<SnapshotSummary[]> => fetch(`${BASE}/snapshots/summaries`).then((r) => r.json());
export const fetchSnapshot = (date: string): Promise<Snapshot> => fetch(`${BASE}/snapshots/${date}`).then((r) => r.json());
export const saveSnapshot = (date: string, entries: SnapshotEntry[]): Promise<{ date: string }> => fetch(`${BASE}/snapshots`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date, entries }) }).then((r) => r.json());

/* ── CSV Import ── */
export const importInstitutionsCsv = (csv: string): Promise<{ message: string; created: number; skipped: number }> => fetch(`${BASE}/import/institutions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ csv }) }).then((r) => r.json());
export const importSnapshotsCsv = (csv: string): Promise<{ message: string; imported: number; failed: number }> => fetch(`${BASE}/import/snapshots`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ csv }) }).then((r) => r.json());

/* ── 전체 초기화 ── */
export const resetAll = (): Promise<{ message: string }> => fetch(`${BASE}/reset`, { method: 'DELETE' }).then((r) => r.json());

/** 숫자를 한국어 천단위 포맷으로 변환 */
export const fmtKrw = (n: number): string => Math.round(n).toLocaleString('ko-KR');
