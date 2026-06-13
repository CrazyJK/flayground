import OpenAI from 'openai';
import { config } from '../config';
import { AIProvider, GenerateOptions } from './provider.interface';

/**
 * 로컬 Ollama AI 제공자 (OpenAI SDK 호환)
 *
 * 같은 PC의 Ollama OpenAI 호환 엔드포인트(`http://127.0.0.1:11434/v1`)에 직결한다.
 * TLS·인증이 없으므로 Ollama가 무시하는 더미 API 키를 전달한다.
 */
export class LocalProvider implements AIProvider {
  readonly providerName = 'local' as const;

  private client: OpenAI;

  /**
   * @param baseURL - Ollama OpenAI 호환 엔드포인트 (예: http://127.0.0.1:11434/v1)
   * @param apiKey - 더미 API 키 (Ollama는 무시하지만 SDK가 비어 있으면 에러)
   */
  constructor(baseURL: string, apiKey: string) {
    this.client = new OpenAI({
      baseURL,
      apiKey,
    });
  }

  /**
   * 엔드포인트 연결을 경량 요청으로 사전 검증.
   * 모델 로딩을 유발하지 않도록 모델 목록 조회만 수행한다.
   * @param _modelName - 인터페이스 호환용 (미사용)
   */
  async validateAccess(_modelName: string): Promise<void> {
    await this.client.models.list();
  }

  /**
   * 단일 프롬프트로 텍스트 생성
   * @param prompt - 입력 프롬프트
   * @param modelName - 사용할 Ollama 모델명
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
   * @param modelName - 사용할 Ollama 모델명
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
