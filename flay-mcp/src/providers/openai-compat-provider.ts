import OpenAI from 'openai';
import { config } from '../config';
import { AIProvider, GenerateOptions } from './provider.interface';

/**
 * 외부 OpenAI 호환 API 제공자 (OpenRouter, Groq 등 — OpenAI SDK 에 baseURL·apiKey 만 바꿔 사용).
 * 엔드포인트·키·모델 목록은 .env 의 OPENAI_COMPAT_* 로 지정한다.
 */
export class OpenAICompatProvider implements AIProvider {
  readonly providerName = 'openai' as const;

  private client: OpenAI;

  /**
   * @param baseUrl - OpenAI 호환 엔드포인트 (예: https://openrouter.ai/api/v1)
   * @param apiKey - 해당 서비스 API 키
   */
  constructor(baseUrl: string, apiKey: string) {
    this.client = new OpenAI({ baseURL: baseUrl, apiKey });
  }

  /**
   * 키 유효성/권한을 경량 요청으로 사전 검증
   * @param modelName - 검증에 사용할 모델명
   */
  async validateAccess(modelName: string): Promise<void> {
    await this.client.chat.completions.create({
      messages: [{ role: 'user', content: 'ping' }],
      model: modelName,
      max_tokens: 1,
      temperature: 0,
    });
  }

  /**
   * 단일 프롬프트로 텍스트 생성
   * @param prompt - 입력 프롬프트
   * @param modelName - 사용할 모델명
   * @param options - 생성 옵션
   */
  async generateText(prompt: string, modelName: string, options?: GenerateOptions): Promise<string> {
    const completion = await this.client.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: modelName,
      max_tokens: options?.maxOutputTokens ?? config.ai.maxOutputTokens,
      temperature: options?.temperature ?? config.ai.temperature,
    });
    return completion.choices[0]?.message?.content ?? '';
  }

  /**
   * 대화 히스토리를 포함하여 텍스트 생성
   * @param history - 전체 대화 히스토리
   * @param modelName - 사용할 모델명
   * @param options - 생성 옵션
   */
  async generateWithHistory(history: Array<{ role: 'user' | 'assistant'; content: string }>, modelName: string, options?: GenerateOptions): Promise<string> {
    const messages = history.map((h) => ({
      role: h.role as 'user' | 'assistant',
      content: h.content,
    }));
    const completion = await this.client.chat.completions.create({
      messages,
      model: modelName,
      max_tokens: options?.maxOutputTokens ?? config.ai.maxOutputTokens,
      temperature: options?.temperature ?? config.ai.temperature,
    });
    return completion.choices[0]?.message?.content ?? '';
  }
}
