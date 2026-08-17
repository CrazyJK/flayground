import { GenerateContentResult, GenerationConfig, GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';
import { AIProvider, GenerateOptions } from './provider.interface';

/**
 * 생성 설정. Gemma 계열(gemma-*)은 기본으로 사고 과정(thinking)을 만들어 응답 파트에 섞어 보내고
 * 출력 토큰도 소모하므로 thinkingLevel=minimal 로 끈다(gemini-2.5-* 는 이 옵션 미지원 → 기본값).
 * @param modelName - 모델명
 * @param options - 생성 옵션
 */
function generationConfigFor(modelName: string, options?: GenerateOptions): GenerationConfig {
  const base: GenerationConfig = {
    temperature: options?.temperature ?? config.ai.temperature,
    maxOutputTokens: options?.maxOutputTokens ?? config.ai.maxOutputTokens,
  };
  if (modelName.startsWith('gemma-')) {
    // SDK 타입에 없는 필드라 확장 객체로 전달 (REST 로 그대로 직렬화됨)
    return { ...base, thinkingConfig: { thinkingLevel: 'minimal' } } as GenerationConfig;
  }
  return base;
}

/**
 * 응답에서 사고 파트(thought: true)를 제외한 본문 텍스트만 추출.
 * (SDK 의 response.text() 는 사고 파트까지 이어 붙인다)
 * @param result - generateContent 결과
 */
function answerText(result: GenerateContentResult): string {
  const parts = (result.response.candidates?.[0]?.content?.parts ?? []) as Array<{ text?: string; thought?: boolean }>;
  const answer = parts
    .filter((p) => !p.thought)
    .map((p) => p.text ?? '')
    .join('')
    .trim();
  return answer || result.response.text();
}

/**
 * Google Gemini AI 제공자
 */
export class GeminiProvider implements AIProvider {
  readonly providerName = 'gemini' as const;

  private genAI: GoogleGenerativeAI;
  private apiKey: string;

  /**
   * @param apiKey - Gemini API 키
   */
  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.apiKey = apiKey;
  }

  /**
   * API 키의 유효성/권한을 사전 검증.
   * generateContent 대신 모델 메타 조회(GET models/{model})를 써서 무료 티어의
   * 일일 생성 한도(gemini-2.5-flash 는 20 요청/일)를 소모하지 않는다 — 서버를 재기동할 때마다
   * 한도가 줄어드는 것을 막는다.
   * @param modelName - 검증에 사용할 Gemini 모델명
   */
  async validateAccess(modelName: string): Promise<void> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}?key=${encodeURIComponent(this.apiKey)}`;
    const res = await fetch(url);
    if (!res.ok) {
      let detail = '';
      try {
        const body = (await res.json()) as { error?: { message?: string } };
        detail = body?.error?.message ?? '';
      } catch {
        // 본문 없음
      }
      throw new Error(`[${res.status}] ${detail || res.statusText}`);
    }
  }

  /**
   * 단일 프롬프트로 텍스트 생성
   * @param prompt - 입력 프롬프트
   * @param modelName - 사용할 Gemini 모델명
   * @param options - 생성 옵션
   */
  async generateText(prompt: string, modelName: string, options?: GenerateOptions): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: generationConfigFor(modelName, options),
    });
    return answerText(result);
  }

  /**
   * 대화 히스토리를 포함하여 텍스트 생성.
   * Gemini는 role: 'model'을 assistant로 사용
   * @param history - 전체 대화 히스토리
   * @param modelName - 사용할 Gemini 모델명
   * @param options - 생성 옵션
   */
  async generateWithHistory(history: Array<{ role: 'user' | 'assistant'; content: string }>, modelName: string, options?: GenerateOptions): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: modelName });
    const contents = history.map((h) => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.content }],
    }));
    const result = await model.generateContent({
      contents,
      generationConfig: generationConfigFor(modelName, options),
    });
    return answerText(result);
  }
}
