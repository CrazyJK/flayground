import { getConnectedId } from '../codef/connector.js';
import { rsaEncrypt } from '../codef/rsa.js';
import { config } from '../config.js';
import { codefPost } from './codef.service.js';

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

/**
 * 미래에셋증권 주식잔고를 조회한다.
 * 계좌비밀번호는 codef publicKey로 RSA 암호화하여 전송한다.
 *
 * @returns 잔고 조회 결과
 */
export async function getBalance(): Promise<BalanceResult> {
  const { organization, account, accountPassword } = config.mirae;
  const connectedId = getConnectedId();
  const encryptedPassword = rsaEncrypt(accountPassword, config.codef.publicKey);

  const endpoint = `${config.codef.apiBaseUrl}/v1/kr/stock/a/account/balance-inquiry`;

  return codefPost<BalanceResult>(endpoint, {
    organization,
    connectedId,
    account,
    accountPassword: encryptedPassword,
    id: '',
    add_password: '',
  });
}
