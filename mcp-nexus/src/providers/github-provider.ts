import OpenAI from 'openai';
import { config } from '../config';
import { AIProvider, GenerateOptions } from './provider.interface';

/**
 * GitHub Models AI 제공자 (OpenAI SDK 호환)
 */
export class GitHubProvider implements AIProvider {
  readonly providerName = 'github' as const;

  private client: OpenAI;

  /**
   * @param token - GitHub Personal Access Token
   */
  constructor(token: string) {
    this.client = new OpenAI({
      baseURL: config.ai.githubEndpoint,
      apiKey: token,
    });
  }

  /**
   * 단일 프롬프트로 텍스트 생성
   * @param prompt - 입력 프롬프트
   * @param modelName - 사용할 GitHub 모델명
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
   * @param modelName - 사용할 GitHub 모델명
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
