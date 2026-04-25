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

/** 스냅샷 항목 (계좌별 금액 기록) */
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
