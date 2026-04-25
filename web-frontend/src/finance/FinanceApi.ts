/** finance-hub API 서버 베이스 URL */
const FINANCE_HUB_BASE = 'http://localhost:4000/api';

/** 외화예수금 항목 */
export interface ForeignDeposit {
  resAmount: string;
  resAccountCurrency: string;
}

/** 종목별 잔고 항목 */
export interface StockItem {
  resProductType: string;
  resProductTypeCd: string;
  resItemName: string;
  resItemCode: string;
  resBalanceType: string;
  resQuantity: string;
  resSettleQuantity: string;
  resPresentAmt: string;
  resAvgPresentAmt: string;
  resPurchaseAmount: string;
  resValuationAmt: string;
  resValuationPL: string;
  resEarningsRate: string;
  resAccountCurrency: string;
  resAccountEx: string;
  resResultCode: string;
  resResultDesc: string;
}

/** 주식잔고 조회 응답 */
export interface BalanceResult {
  resAccount: string;
  resDepositReceived: string;
  resDepositReceivedD1: string;
  resDepositReceivedD2: string;
  resDepositReceivedF: string;
  resDepositReceivedFList: ForeignDeposit[];
  resItemList: StockItem[];
}

/** 거래내역 단건 */
export interface TransactionItem {
  resAfterTranBalance: string;
  resAccountDesc1: string;
  resAccountDesc2: string;
  resAccountDesc3: string;
  resAccountDesc4: string;
  resAccountIn: string;
  resAccountOut: string;
  resAccountTrTime: string;
  resAccountTrDate: string;
}

/** 거래내역 조회 응답 */
export interface TransactionResult {
  resTrHistoryList: TransactionItem[];
  resAccountHolder: string;
  resAccountName: string;
  resWithdrawalAmt: string;
  resAccountBalance: string;
  resAccount: string;
  commStartDate: string;
  commEndDate: string;
}

/**
 * finance-hub 서버에서 주식잔고를 조회한다.
 */
export async function fetchBalance(): Promise<BalanceResult> {
  const res = await fetch(`${FINANCE_HUB_BASE}/accounts/balance`);
  if (!res.ok) {
    const err = (await res.json().catch(() => ({ message: res.statusText }))) as { message: string };
    throw new Error(err.message);
  }
  return res.json() as Promise<BalanceResult>;
}

/**
 * finance-hub 서버에서 거래내역을 조회한다.
 *
 * @param startDate - 조회 시작일 (YYYYMMDD)
 * @param endDate - 조회 종료일 (YYYYMMDD)
 * @param orderBy - 정렬: "0" 최신순, "1" 과거순
 */
export async function fetchTransactions(startDate: string, endDate: string, orderBy = '0'): Promise<TransactionResult> {
  const params = new URLSearchParams({ startDate, endDate, orderBy });
  const res = await fetch(`${FINANCE_HUB_BASE}/accounts/transactions?${params}`);
  if (!res.ok) {
    const err = (await res.json().catch(() => ({ message: res.statusText }))) as { message: string };
    throw new Error(err.message);
  }
  return res.json() as Promise<TransactionResult>;
}

/**
 * 숫자 문자열을 한국어 통화 형식으로 포맷한다.
 * @param value - 숫자 문자열
 */
export function formatCurrency(value: string): string {
  const num = Number(value);
  if (isNaN(num)) return value;
  return num.toLocaleString('ko-KR') + '원';
}

/**
 * 수익률 문자열을 % 포맷으로 반환한다.
 * @param rate - 수익률 문자열
 */
export function formatRate(rate: string): string {
  const num = parseFloat(rate);
  if (isNaN(num)) return rate;
  return (num >= 0 ? '+' : '') + num.toFixed(2) + '%';
}

/**
 * YYYYMMDD 형식의 날짜를 YYYY-MM-DD로 포맷한다.
 */
export function formatDate(d: string): string {
  if (!d || d.length !== 8) return d;
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
}

/**
 * HHMMSS 형식의 시각을 HH:MM:SS로 포맷한다.
 */
export function formatTime(t: string): string {
  if (!t || t.length !== 6) return t;
  return `${t.slice(0, 2)}:${t.slice(2, 4)}:${t.slice(4, 6)}`;
}

/**
 * 오늘 날짜를 YYYYMMDD 형식으로 반환한다.
 */
export function todayStr(): string {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '');
}

/**
 * N일 전 날짜를 YYYYMMDD 형식으로 반환한다.
 */
export function daysAgoStr(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}
