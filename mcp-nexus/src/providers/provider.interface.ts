/**
 * AI 생성 옵션
 */
export interface GenerateOptions {
  /** 생성 온도 (0.0 ~ 2.0) */
  temperature?: number;
  /** 최대 출력 토큰 수 */
  maxOutputTokens?: number;
}

/**
 * AI 제공자 공통 인터페이스.
 * 모델명은 외부(model-router)에서 지정하여 호출.
 */
export interface AIProvider {
  /** 제공자 식별자 */
  readonly providerName: 'gemini' | 'github';

  /**
   * 단일 프롬프트로 텍스트 생성
   * @param prompt - 입력 프롬프트
   * @param modelName - 사용할 모델명
   * @param options - 생성 옵션
   * @returns 생성된 텍스트
   */
  generateText(prompt: string, modelName: string, options?: GenerateOptions): Promise<string>;

  /**
   * 대화 히스토리를 포함하여 텍스트 생성
   * @param history - 전체 대화 히스토리 (마지막 항목이 현재 사용자 메시지)
   * @param modelName - 사용할 모델명
   * @param options - 생성 옵션
   * @returns 생성된 텍스트
   */
  generateWithHistory(history: Array<{ role: 'user' | 'assistant'; content: string }>, modelName: string, options?: GenerateOptions): Promise<string>;
}
