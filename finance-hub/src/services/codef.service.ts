import { getAccessToken, invalidateToken } from '../codef/auth.js';

/**
 * codef API 공통 응답 형식
 */
export interface CodefResponse<T = unknown> {
  result: {
    code: string;
    message: string;
    extraMessage: string | null;
    transactionId: string;
  };
  data: T;
}

/**
 * codef API에 POST 요청을 보내고 응답을 반환한다.
 * 토큰 만료(CF-00401) 시 토큰을 재발급하여 1회 재시도한다.
 *
 * @param endpoint - API 엔드포인트 전체 URL
 * @param body - 요청 바디 객체
 * @returns codef API 응답의 data 부분
 */
export async function codefPost<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  const callApi = async (): Promise<Response> => {
    const accessToken = await getAccessToken();
    return fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });
  };

  let response = await callApi();

  // HTTP 레벨 실패
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`codef API 오류 (${response.status}): ${text}`);
  }

  // codef API는 응답 body를 URL 인코딩된 문자열로 반환한다.
  const json = parseCodefResponse<T>(await response.text());

  // codef 토큰 만료 코드: CF-00401
  if (json.result?.code === 'CF-00401') {
    console.warn('[codef.service] Access Token 만료. 재발급 후 재시도...');
    invalidateToken();
    response = await callApi();
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`codef API 재시도 실패 (${response.status}): ${text}`);
    }
    const retryJson = parseCodefResponse<T>(await response.text());
    if (retryJson.result?.code !== 'CF-00000') {
      throw new Error(`codef API 오류 [${retryJson.result?.code}]: ${retryJson.result?.message}`);
    }
    return retryJson.data;
  }

  if (json.result?.code !== 'CF-00000') {
    throw new Error(`codef API 오류 [${json.result?.code}]: ${json.result?.message}`);
  }

  return json.data;
}

/**
 * codef API 응답 텍스트를 파싱한다.
 * codef는 응답 body를 URL 인코딩된 JSON 문자열로 반환하므로 decodeURIComponent 후 JSON.parse 한다.
 *
 * @param text - response.text() 원문
 */
function parseCodefResponse<T>(text: string): CodefResponse<T> {
  try {
    const decoded = decodeURIComponent(text);
    return JSON.parse(decoded) as CodefResponse<T>;
  } catch {
    // URL 인코딩이 아닌 경우 그대로 파싱 시도
    return JSON.parse(text) as CodefResponse<T>;
  }
}
