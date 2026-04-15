import OpenAI from 'openai';
import { config } from './config.js';

/** 모델별 통계: 모델명 -> { times, slowCount, errors } */
const modelStatsMap = new Map<string, { times: number[]; slowCount: number; errors: number }>();

/**
 * 모델 응답 결과를 기록하고 통계를 콘솔에 출력
 * @param model - 사용된 모델명
 * @param ms - 응답 시간(밀리초), 오류 시 null
 * @param error - 오류 객체 (오류 시에만 전달)
 */
function trackModel(model: string, ms: number | null, error?: any): void {
  if (!modelStatsMap.has(model)) {
    modelStatsMap.set(model, { times: [], slowCount: 0, errors: 0 });
  }
  const stats = modelStatsMap.get(model)!;

  if (error !== undefined) {
    stats.errors += 1;
    console.error(`[AI 오류] ${model} | ${error?.message ?? String(error)}`);
  } else if (ms !== null) {
    stats.times.push(ms);
    if (ms >= 10_000) stats.slowCount += 1;
  }

  const rows = [...modelStatsMap.entries()].map(([m, s]) => {
    const cnt = s.times.length + s.errors;
    const avg = s.times.length > 0 ? Math.round(s.times.reduce((a, b) => a + b, 0) / s.times.length) : 0;
    const max = s.times.length > 0 ? Math.max(...s.times) : 0;
    return {
      Model: m,
      Requests: cnt,
      Success: cnt - s.errors,
      Errors: s.errors,
      Current: m === model ? (ms !== null ? ms.toLocaleString() : 'Error') : '-',
      Average: avg ? avg.toLocaleString() : '-',
      Max: max ? max.toLocaleString() : '-',
      '10s+': s.slowCount,
    };
  });
  console.table(rows);
}

/**
 * 셔플 백(Shuffle Bag): 가방에서 랜덤으로 꺼내고, 모두 소진되면 다시 채움
 */
const modelBag: string[] = [];

function pickRandomModel(): string {
  if (modelBag.length === 0) {
    modelBag.push(...config.ai.availableModels);
    console.log(`[AI] 모델 가방 재충전: [${modelBag.join(', ')}]`);
  }
  // 가방에서 랜덤 위치의 모델을 꺼냄
  const index = Math.floor(Math.random() * modelBag.length);
  const [selected] = modelBag.splice(index, 1);
  console.log(`[AI] 선택된 모델: ${selected} (남은 ${modelBag.length}개)`);
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

    const model = pickRandomModel();
    const start = Date.now();
    try {
      const completion = await this.client.chat.completions.create({
        messages: this.history,
        model,
        max_tokens: config.ai.maxOutputTokens,
        temperature: config.ai.temperature,
      });

      trackModel(model, Date.now() - start);
      const responseText = completion.choices[0]?.message?.content ?? '';
      this.history.push({ role: 'assistant', content: responseText });

      return { response: { text: () => responseText } };
    } catch (error: any) {
      trackModel(model, null, error);
      throw error;
    }
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
   * @returns 생성된 텍스트와 사용된 모델명
   */
  async generateText(prompt: string, options: GenerateOptions = {}): Promise<{ text: string; model: string }> {
    const model = pickRandomModel();
    const start = Date.now();
    try {
      const completion = await this.client.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model,
        max_tokens: options.maxOutputTokens ?? config.ai.maxOutputTokens,
        temperature: options.temperature ?? config.ai.temperature,
      });

      trackModel(model, Date.now() - start);
      return { text: completion.choices[0]?.message?.content ?? '', model };
    } catch (error: any) {
      trackModel(model, null, error);
      throw new Error(`텍스트 생성 실패: ${error.message}`);
    }
  }

  /**
   * 스트리밍 텍스트 생성
   * @param prompt - 입력 프롬프트
   * @param onChunk - 청크 수신 콜백
   */
  async generateTextStream(prompt: string, onChunk: (text: string) => void): Promise<void> {
    const model = pickRandomModel();
    const start = Date.now();
    try {
      const stream = await this.client.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model,
        stream: true,
      });

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? '';
        if (text) {
          onChunk(text);
        }
      }
      trackModel(model, Date.now() - start);
    } catch (error: any) {
      trackModel(model, null, error);
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
