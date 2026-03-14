import OpenAI from 'openai';
import { config } from './config.js';

/**
 * availableModels 중 하나를 랜덤으로 선택
 * @returns 선택된 모델 이름
 */
function pickRandomModel(): string {
  const models = config.ai.availableModels;
  const selected = models[Math.floor(Math.random() * models.length)];
  console.log(`[AI] 선택된 모델: ${selected}`);
  return selected;
}

/**
 * 생성 옵션 인터페이스
 */
export interface GenerateOptions {
  temperature?: number;
  maxOutputTokens?: number;
}

/**
 * 대화형 채팅 세션 (히스토리 직접 관리)
 */
export class ChatSession {
  private history: OpenAI.Chat.ChatCompletionMessageParam[] = [];
  private client: OpenAI;

  constructor(client: OpenAI) {
    this.client = client;
  }

  /**
   * 메시지 전송 및 응답 수신
   * @param message - 사용자 메시지
   * @returns 응답 객체
   */
  async sendMessage(message: string): Promise<{ response: { text: () => string } }> {
    this.history.push({ role: 'user', content: message });

    const completion = await this.client.chat.completions.create({
      messages: this.history,
      model: pickRandomModel(),
      max_tokens: config.ai.maxOutputTokens,
      temperature: config.ai.temperature,
    });

    const responseText = completion.choices[0]?.message?.content ?? '';
    this.history.push({ role: 'assistant', content: responseText });

    return { response: { text: () => responseText } };
  }
}

/**
 * GitHub Models AI 클라이언트 (OpenAI SDK 호환)
 */
export class GitHubModelsClient {
  private client: OpenAI;

  /**
   * @param token - GitHub Personal Access Token
   */
  constructor(token: string) {
    this.client = new OpenAI({
      baseURL: config.ai.endpoint,
      apiKey: token,
    });
  }

  /**
   * 텍스트 생성
   * @param prompt - 입력 프롬프트
   * @param options - 생성 옵션
   * @returns 생성된 텍스트
   */
  async generateText(prompt: string, options: GenerateOptions = {}): Promise<string> {
    try {
      const completion = await this.client.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: pickRandomModel(),
        max_tokens: options.maxOutputTokens ?? config.ai.maxOutputTokens,
        temperature: options.temperature ?? config.ai.temperature,
      });

      return completion.choices[0]?.message?.content ?? '';
    } catch (error: any) {
      console.error('GitHub Models API 오류:', error);
      throw new Error(`텍스트 생성 실패: ${error.message}`);
    }
  }

  /**
   * 스트리밍 텍스트 생성
   * @param prompt - 입력 프롬프트
   * @param onChunk - 청크 수신 콜백
   */
  async generateTextStream(prompt: string, onChunk: (text: string) => void): Promise<void> {
    try {
      const stream = await this.client.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: pickRandomModel(),
        stream: true,
      });

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? '';
        if (text) {
          onChunk(text);
        }
      }
    } catch (error: any) {
      console.error('GitHub Models 스트리밍 오류:', error);
      throw new Error(`스트리밍 생성 실패: ${error.message}`);
    }
  }

  /**
   * 대화형 채팅 시작
   * @returns 채팅 세션
   */
  startChat(): ChatSession {
    return new ChatSession(this.client);
  }
}
