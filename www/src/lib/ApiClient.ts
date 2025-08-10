// Type definitions
export interface ApiClientOptions {
  responseType?: 'json' | 'text' | 'blob' | 'arrayBuffer';
  headers?: Record<string, string>;
  method?: string;
  body?: string | FormData | Blob | ArrayBuffer | URLSearchParams | null;
  [key: string]: unknown;
}

/**
 * API 요청을 처리하는 유틸리티 클래스
 * 서버에 요청 시 /api/v1 접두어가 자동으로 적용됨
 *
 * ## 기본 사용법
 *
 * ### GET 요청
 * ```javascript
 * // 기본 GET 요청 (JSON 응답)
 * const data = await ApiClient.get('/users');
 *
 * // 쿼리 파라미터를 포함한 GET 요청
 * const searchResults = await ApiClient.get('/users?name=홍길동');
 *
 * // 헤더를 포함한 GET 요청
 * const data = await ApiClient.get('/secured-endpoint', {
 *   headers: { 'Authorization': 'Bearer token' }
 * });
 * ```
 *
 * ### HEAD 요청
 * ```javascript
 * // 리소스 메타데이터만 확인 (본문 없음)
 * const response = await ApiClient.head('/files/large-file.mp4');
 * // 응답 헤더 확인
 * console.log('파일 크기:', response.headers.get('Content-Length'));
 * console.log('마지막 수정일:', response.headers.get('Last-Modified'));
 * console.log('콘텐츠 타입:', response.headers.get('Content-Type'));
 *
 * // 리소스 존재 여부 확인
 * try {
 *   await ApiClient.head('/resources/123');
 *   console.log('리소스가 존재합니다');
 * } catch (error) {
 *   console.log('리소스가 존재하지 않습니다');
 * }
 * ```
 *
 * ### POST, PUT, PATCH 요청 (JSON 데이터 전송)
 * ```javascript
 * // POST 요청
 * const newUser = await ApiClient.post('/users', { name: '홍길동', age: 30 });
 *
 * // PUT 요청 (전체 리소스 업데이트)
 * const updatedUser = await ApiClient.put('/users/123', { name: '홍길동', age: 31 });
 *
 * // PATCH 요청 (부분 업데이트)
 * const partiallyUpdatedUser = await ApiClient.patch('/users/123', { age: 32 });
 * ```
 *
 * ### DELETE 요청
 * ```javascript
 * // 리소스 삭제
 * await ApiClient.delete('/users/123');
 *
 * // 요청 본문이 필요한 DELETE 요청
 * await ApiClient.delete('/users/batch', {
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ ids: [1, 2, 3] })
 * });
 * ```
 *
 * ### 파일 및 폼 데이터 전송
 * ```javascript
 * // FormData 생성 및 파일 추가
 * const formData = new FormData();
 * formData.append('file', fileInput.files[0]);
 * formData.append('description', '프로필 이미지');
 *
 * // FormData POST 요청
 * const result = await ApiClient.postFormData('/upload', formData);
 *
 * // FormData PUT 요청
 * const updated = await ApiClient.putFormData('/users/123/avatar', formData);
 * ```
 *
 * ### Blob 응답 처리 (이미지, 파일 다운로드)
 * ```javascript
 * // 이미지 다운로드
 * const imageBlob = await ApiClient.get('/images/1', { responseType: 'blob' });
 * const imageUrl = URL.createObjectURL(imageBlob);
 * document.querySelector('img').src = imageUrl;
 *
 * // 파일 다운로드 및 저장
 * const fileBlob = await ApiClient.get('/files/document.pdf', { responseType: 'blob' });
 * const url = URL.createObjectURL(fileBlob);
 * const a = document.createElement('a');
 * a.href = url;
 * a.download = 'document.pdf';
 * a.click();
 * URL.revokeObjectURL(url); // 메모리 정리
 * ```
 *
 * ### 에러 처리
 * ```javascript
 * try {
 *   const data = await ApiClient.get('/might-fail');
 *   // 성공 처리
 * } catch (error) {
 *   console.error('API 요청 실패:', error.message);
 *   // 에러 처리 로직
 * }
 * ```
 */
export default class ApiClient {
  static #API_URL = '/api/v1'; // API 기본 URL

  /**
   * API URL을 완성해주는 헬퍼 메서드
   *
   * 주어진 URL이 절대 경로인 경우 API_URL을 붙이지 않음
   * 상대 경로인 경우 API_URL을 접두어로 붙임
   * @param url - API 엔드포인트
   * @param options - fetch 옵션
   * @returns
   */
  static buildUrl(url: string): string {
    // URL이 절대 경로인 경우 API_URL을 붙이지 않음
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `${this.#API_URL}${url}`;
  }

  /**
   * GET 요청 보내기
   *
   * @param url - API 엔드포인트
   * @param options - fetch 옵션
   * @returns 응답 Promise
   */
  static async get<T>(url: string, options: ApiClientOptions = {}): Promise<T | null> {
    return this.#request<T>(url, { method: 'GET', ...options });
  }

  /**
   * GET 요청 보내기 (Response 객체 반환)
   *
   * @param url - API 엔드포인트
   * @param options - fetch 옵션
   * @returns Response 객체 (헤더 정보 포함)
   */
  static async getResponse(url: string, options: ApiClientOptions = {}): Promise<Response> {
    return this.#requestAndResponse(url, options); // Response 객체 자체를 반환
  }

  /**
   * HEAD 요청 보내기
   *
   * 본문 없이 응답 헤더만 반환 (GET과 동일하나 응답 본문이 없음)
   * 리소스의 존재 여부, 크기, 수정 날짜 등 메타데이터 확인 용도
   *
   * @param url - API 엔드포인트
   * @param options - fetch 옵션
   * @returns Response 객체 (헤더 정보만 포함)
   */
  static async head(url: string, options: ApiClientOptions = {}): Promise<Response> {
    const fetchOptions = {
      method: 'HEAD',
      ...options,
    };
    // Response 객체 자체를 반환 (헤더 정보에 접근 가능)
    return this.#requestAndResponse(url, fetchOptions);
  }

  /**
   * POST 요청 보내기
   *
   * @param url - API 엔드포인트
   * @param data - 요청 본문 데이터
   * @param options - fetch 옵션
   * @returns 응답 Promise
   */
  static async post<T>(url: string, data: unknown, options: ApiClientOptions = {}): Promise<T | null> {
    const fetchOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      ...options,
    };
    return this.#request<T>(url, fetchOptions);
  }

  /**
   * PUT 요청 보내기
   *
   * @param url - API 엔드포인트
   * @param data - 요청 본문 데이터
   * @param options - fetch 옵션
   * @returns 응답 Promise
   */
  static async put<T>(url: string, data: unknown, options: ApiClientOptions = {}): Promise<T | null> {
    const fetchOptions = {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      ...options,
    };
    return this.#request<T>(url, fetchOptions);
  }

  /**
   * PATCH 요청 보내기
   *
   * @param url - API 엔드포인트
   * @param data - 요청 본문 데이터
   * @param options - fetch 옵션
   * @returns 응답 Promise
   */
  static async patch<T>(url: string, data: unknown, options: ApiClientOptions = {}): Promise<T | null> {
    const fetchOptions = {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      ...options,
    };
    return this.#request<T>(url, fetchOptions);
  }

  /**
   * DELETE 요청 보내기
   *
   * @param url - API 엔드포인트
   * @param options - fetch 옵션
   * @returns 응답 Promise
   */
  static async delete<T>(url: string, options: ApiClientOptions = {}): Promise<T | null> {
    return this.#request<T>(url, { method: 'DELETE', ...options });
  }

  /**
   * FormData를 전송하는 POST 요청
   *
   * @param url - API 엔드포인트
   * @param formData - FormData 객체
   * @param options - fetch 옵션
   * @returns 응답 Promise
   */
  static async postFormData<T>(url: string, formData: FormData, options: ApiClientOptions = {}): Promise<T | null> {
    const fetchOptions = {
      method: 'POST',
      body: formData,
      ...options,
    };
    return this.#request<T>(url, fetchOptions);
  }

  /**
   * FormData를 전송하는 PUT 요청
   *
   * @param url - API 엔드포인트
   * @param formData - FormData 객체
   * @param options - fetch 옵션
   * @returns 응답 Promise
   */
  static async putFormData<T>(url: string, formData: FormData, options: ApiClientOptions = {}): Promise<T | null> {
    const fetchOptions = {
      method: 'PUT',
      body: formData,
      ...options,
    };
    return this.#request<T>(url, fetchOptions);
  }

  /**
   * 공통 요청 처리 메서드
   *
   * @param url - API 엔드포인트
   * @param options - fetch 옵션
   * @returns 응답 Promise
   */
  static async #request<T>(url: string, options: ApiClientOptions = {}): Promise<T | null> {
    const response = await fetch(this.buildUrl(url), options);

    // 상태 코드에 따른 처리
    if (!response.ok) {
      // 오류 응답 처리
      if (response.status === 204) {
        return null; // 204 No Content 응답은 null로 처리
      }
      // 404 도 null 처리
      if (response.status === 404) {
        return null; // 404 Not Found 응답은 null로 처리
      }

      try {
        const errorData = await response.json();
        throw new Error(errorData.message || `API 요청 실패: ${response.status}`);
      } catch (e) {
        throw new Error(`API 요청 실패: ${response.status}`);
      }
    }

    // 응답 타입에 따른 처리
    const contentType = response.headers.get('Content-Type');
    if (contentType) {
      if (contentType.includes('application/json')) {
        return (await response.json()) as T;
      } else if (contentType.includes('application/octet-stream') || contentType.includes('image/') || contentType.includes('video/') || options.responseType === 'blob') {
        return (await response.blob()) as T;
      }
    }

    // 기본값으로 텍스트 반환
    return (await response.text()) as T;
  }

  /**
   * HEAD 요청 전용 처리 메서드
   * 일반 #request와 달리 Response 객체 자체를 반환
   *
   * @param url - API 엔드포인트
   * @param options - fetch 옵션
   * @returns Response 객체
   */
  static async #requestAndResponse(url: string, options: ApiClientOptions = {}): Promise<Response> {
    const response = await fetch(this.buildUrl(url), options);

    // 상태 코드에 따른 처리
    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw new Error(errorData.message || `API 요청 실패: ${response.status}`);
      } catch (e) {
        throw new Error(`API 요청 실패: ${response.status}`);
      }
    }

    return response;
  }
}
