import { config } from '../config.js';
import { getAccessToken } from './auth.js';
import { rsaEncrypt } from './rsa.js';

/**
 * ConnectedID 생성 요청 파라미터
 */
export interface ConnectedAccount {
  countryCode: string;
  businessType: string;
  clientType: string;
  organization: string;
  loginType: string;
  id: string;
  password: string;
}

/**
 * codef API에 ConnectedID를 신규 생성한다.
 * ConnectedID는 사용자 금융기관 인증정보를 codef에 등록할 때 발급되는 고유 식별자이며,
 * 이후 모든 계좌 조회 API에 사용된다. 최초 1회만 실행하면 된다.
 *
 * @param accounts - 등록할 계좌 정보 목록
 * @returns 발급된 connectedId
 */
export async function createConnectedId(accounts: ConnectedAccount[]): Promise<string> {
  const accessToken = await getAccessToken();
  const url = `${config.codef.apiBaseUrl}/v1/account/create`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ accountList: accounts }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`ConnectedID 생성 실패 (${response.status}): ${text}`);
  }

  // codef API는 응답 body를 URL 인코딩된 JSON 문자열로 반환한다.
  const raw = await response.text();
  let data: { data?: { connectedId?: string }; result?: { code: string; message: string } };
  try {
    data = JSON.parse(decodeURIComponent(raw));
  } catch {
    data = JSON.parse(raw);
  }

  const connectedId = data?.data?.connectedId;
  if (!connectedId) {
    throw new Error(`ConnectedID 응답에 connectedId 없음: ${JSON.stringify(data)}`);
  }

  console.info('[connector] ConnectedID 발급 완료:', connectedId);
  return connectedId;
}

/**
 * 미래에셋증권 계좌로 ConnectedID를 생성하기 위한 헬퍼.
 * 환경변수의 계좌 ID와 비밀번호를 RSA 암호화하여 codef에 등록한다.
 *
 * @param userId - 미래에셋증권 로그인 아이디
 * @param userPassword - 미래에셋증권 로그인 비밀번호 (평문)
 * @returns 발급된 connectedId
 */
export async function createMiraeConnectedId(userId: string, userPassword: string): Promise<string> {
  const encryptedPassword = rsaEncrypt(userPassword, config.codef.publicKey);

  return createConnectedId([
    {
      countryCode: 'KR',
      businessType: 'ST',
      clientType: 'P',
      organization: config.mirae.organization,
      loginType: '1',
      id: userId,
      password: encryptedPassword,
    },
  ]);
}

/**
 * 현재 설정에서 사용 가능한 connectedId를 반환한다.
 * 환경변수에 값이 없으면 오류를 던진다.
 *
 * @returns connectedId 문자열
 */
export function getConnectedId(): string {
  const id = config.codef.connectedId;
  if (!id) {
    throw new Error('CODEF_CONNECTED_ID 환경변수가 설정되지 않았습니다. /api/auth/connected-id API로 먼저 생성하세요.');
  }
  return id;
}
