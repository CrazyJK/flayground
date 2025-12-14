import {
  ChatSession,
  GenerativeModel,
  GoogleGenerativeAI,
} from "@google/generative-ai";
import { config } from "./config.js";

/**
 * 생성 옵션 인터페이스
 */
export interface GenerateOptions {
  temperature?: number;
  maxOutputTokens?: number;
}

/**
 * Gemini API 클라이언트
 */
export class GeminiClient {
  public genAI: GoogleGenerativeAI;
  public model: GenerativeModel;

  /**
   * @param apiKey - Gemini API 키
   */
  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: config.gemini.model,
    });
  }

  /**
   * 텍스트 생성
   * @param prompt - 입력 프롬프트
   * @param options - 생성 옵션
   * @returns 생성된 텍스트
   */
  async generateText(
    prompt: string,
    options: GenerateOptions = {}
  ): Promise<string> {
    try {
      const generationConfig = {
        temperature: options.temperature || config.gemini.temperature,
        maxOutputTokens:
          options.maxOutputTokens || config.gemini.maxOutputTokens,
      };

      const result = await this.model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig,
      });

      const response = result.response;
      return response.text();
    } catch (error: any) {
      console.error("Gemini API 오류:", error);
      throw new Error(`텍스트 생성 실패: ${error.message}`);
    }
  }

  /**
   * 스트리밍 텍스트 생성
   * @param prompt - 입력 프롬프트
   * @param onChunk - 청크 수신 콜백
   */
  async generateTextStream(
    prompt: string,
    onChunk: (text: string) => void
  ): Promise<void> {
    try {
      const result = await this.model.generateContentStream({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          onChunk(chunkText);
        }
      }
    } catch (error: any) {
      console.error("Gemini 스트리밍 오류:", error);
      throw new Error(`스트리밍 생성 실패: ${error.message}`);
    }
  }

  /**
   * 대화형 채팅 시작
   * @returns 채팅 세션
   */
  startChat(): ChatSession {
    return this.model.startChat({
      generationConfig: {
        temperature: config.gemini.temperature,
        maxOutputTokens: config.gemini.maxOutputTokens,
      },
      history: [],
    });
  }
}
