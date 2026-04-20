import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';
import { AIProvider, GenerateOptions } from './provider.interface';

/**
 * Google Gemini AI 제공자
 */
export class GeminiProvider implements AIProvider {
  readonly providerName = 'gemini' as const;

  private genAI: GoogleGenerativeAI;

  /**
   * @param apiKey - Gemini API 키
   */
  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
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
      generationConfig: {
        temperature: options?.temperature ?? config.ai.temperature,
        maxOutputTokens: options?.maxOutputTokens ?? config.ai.maxOutputTokens,
      },
    });
    return result.response.text();
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
      generationConfig: {
        temperature: options?.temperature ?? config.ai.temperature,
        maxOutputTokens: options?.maxOutputTokens ?? config.ai.maxOutputTokens,
      },
    });
    return result.response.text();
  }
}
