/**
 * AI 벤더 타입
 */
export type AIVendor = 'openai' | 'gemini' | 'claude';

/**
 * AI 생성 옵션
 */
export interface GenerateOptions {
  /** 생성 온도 (0.0 ~ 2.0) */
  temperature?: number;
  /** 최대 출력 토큰 수 */
  maxTokens?: number;
  /** 시스템 프롬프트 */
  systemPrompt?: string;
}

/**
 * AI 응답 결과
 */
export interface AIResponse {
  /** 생성된 텍스트 */
  text: string;
  /** 사용된 벤더 */
  vendor: AIVendor;
  /** 응답 시간 (ms) */
  duration: number;
  /** 사용된 토큰 수 (선택적) */
  tokens?: {
    prompt: number;
    completion: number;
    total: number;
  };
}

/**
 * AI 클라이언트 인터페이스
 */
export interface IAIClient {
  /** 벤더 이름 */
  readonly vendor: AIVendor;

  /**
   * 텍스트 생성
   * @param prompt - 프롬프트
   * @param options - 생성 옵션
   * @returns 생성된 텍스트
   */
  generate(prompt: string, options?: GenerateOptions): Promise<string>;

  /**
   * 텍스트 번역
   * @param text - 번역할 텍스트
   * @param sourceLang - 원본 언어
   * @param targetLang - 목표 언어
   * @returns 번역된 텍스트
   */
  translate(text: string, sourceLang: string, targetLang: string): Promise<string>;
}

/**
 * AI 설정
 */
export interface AIConfig {
  /** 사용할 벤더 */
  vendor: AIVendor;
  /** OpenAI API 키 */
  openaiApiKey?: string | undefined;
  /** Gemini API 키 */
  geminiApiKey?: string | undefined;
  /** Claude API 키 */
  claudeApiKey?: string | undefined;
  /** 기본 생성 옵션 */
  defaultOptions?: GenerateOptions;
}
