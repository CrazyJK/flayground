import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "./config.js";

/**
 * Gemini API 클라이언트
 */
export class GeminiClient {
  /**
   * @param {string} apiKey - Gemini API 키
   */
  constructor(apiKey) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: config.gemini.model,
    });
  }

  /**
   * 텍스트 생성
   * @param {string} prompt - 입력 프롬프트
   * @param {Object} options - 생성 옵션
   * @returns {Promise<string>} 생성된 텍스트
   */
  async generateText(prompt, options = {}) {
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
    } catch (error) {
      console.error("Gemini API 오류:", error);
      throw new Error(`텍스트 생성 실패: ${error.message}`);
    }
  }

  /**
   * 스트리밍 텍스트 생성
   * @param {string} prompt - 입력 프롬프트
   * @param {Function} onChunk - 청크 수신 콜백
   * @returns {Promise<void>}
   */
  async generateTextStream(prompt, onChunk) {
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
    } catch (error) {
      console.error("Gemini 스트리밍 오류:", error);
      throw new Error(`스트리밍 생성 실패: ${error.message}`);
    }
  }

  /**
   * 대화형 채팅 시작
   * @returns {Object} 채팅 세션
   */
  startChat() {
    return this.model.startChat({
      generationConfig: {
        temperature: config.gemini.temperature,
        maxOutputTokens: config.gemini.maxOutputTokens,
      },
      history: [],
    });
  }
}
