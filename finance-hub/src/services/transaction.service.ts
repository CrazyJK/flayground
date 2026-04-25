import { getConnectedId } from '../codef/connector.js';
import { rsaEncrypt } from '../codef/rsa.js';
import { config } from '../config.js';
import { codefPost } from './codef.service.js';

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

/** 거래내역 조회 옵션 */
export interface TransactionQuery {
  /** 조회 시작일 (YYYYMMDD) */
  startDate: string;
  /** 조회 종료일 (YYYYMMDD) */
  endDate: string;
  /** 정렬 순서: "0" 최신순, "1" 과거순 (기본: "0") */
  orderBy?: string;
}

/**
 * 미래에셋증권 주식계좌 거래내역(입출금내역)을 조회한다.
 * 계좌비밀번호는 codef publicKey로 RSA 암호화하여 전송한다.
 *
 * @param query - 조회 기간 및 정렬 옵션
 * @returns 거래내역 조회 결과
 */
export async function getTransactions(query: TransactionQuery): Promise<TransactionResult> {
  const { organization, account, accountPassword } = config.mirae;
  const connectedId = getConnectedId();
  const encryptedPassword = rsaEncrypt(accountPassword, config.codef.publicKey);

  const endpoint = `${config.codef.apiBaseUrl}/v1/kr/stock/a/account/transaction-list`;

  return codefPost<TransactionResult>(endpoint, {
    organization,
    connectedId,
    account,
    accountPassword: encryptedPassword,
    startDate: query.startDate,
    endDate: query.endDate,
    orderBy: query.orderBy ?? '0',
    id: '',
    add_password: '',
  });
}
