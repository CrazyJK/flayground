import OpenAI from 'openai';
import { execFile } from 'node:child_process';
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
  /** Ollama 네이티브 `/api/ps` URL (OpenAI baseURL에서 `/v1` 제거 후 생성) */
  private psUrl: string;

  /**
   * @param baseURL - Ollama OpenAI 호환 엔드포인트 (예: http://127.0.0.1:11434/v1)
   * @param apiKey - 더미 API 키 (Ollama는 무시하지만 SDK가 비어 있으면 에러)
   */
  constructor(baseURL: string, apiKey: string) {
    this.client = new OpenAI({
      baseURL,
      apiKey,
    });
    this.psUrl = baseURL.replace(/\/v1\/?$/, '') + '/api/ps';
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
   * 모델 스왑을 유발하지 않고 사용할 로컬 모델명을 결정.
   * 메인 사용자(flayAI)의 작업을 방해하지 않기 위한 'best-effort' 게이트.
   *
   * - Ollama가 idle(로드된 모델 없음): 요청 모델을 로드해도 방해 없음 → 요청 모델 사용
   *   (단, PyTorch 등이 VRAM 점유 중일 수 있으므로 nvidia-smi free VRAM이 임계값 미만이면 보류)
   * - 요청 모델이 이미 로드됨: 스왑 불필요 → 요청 모델 사용
   * - 다른 모델이 로드 중이지만 허용 목록(acceptableModels)에 있음: 스왑 없이 그 모델 재사용
   * - 그 외(허용되지 않은 모델 사용 중) 또는 확인 실패: 보류(null)
   *
   * @param preferredModel - 셔플 백이 선택한 로컬 모델명
   * @param acceptableModels - 스왑 없이 재사용 가능한 로컬 모델 목록
   * @returns 사용할 모델명, 보류 시 null
   */
  async resolveUsableModel(preferredModel: string, acceptableModels: string[]): Promise<string | null> {
    try {
      const res = await fetch(this.psUrl);
      if (!res.ok) return null;
      const data = (await res.json()) as { models?: Array<{ name?: string; model?: string }> };
      const loaded = Array.isArray(data.models) ? data.models : [];
      const loadedNames = loaded.map((m) => m.name ?? m.model).filter((n): n is string => !!n);

      // idle: 새 모델을 로드해도 스왕 방해는 없지만, PyTorch 등이 VRAM을 점유 중일 수 있으므로
      // free VRAM이 충분할 때만 로드를 허용한다(nvidia-smi 조회 실패 시엔 기존대로 진행).
      if (loadedNames.length === 0) {
        const freeVram = await this.getFreeVramMB();
        if (freeVram !== null && freeVram < config.ai.localMinFreeVramMB) return null;
        return preferredModel;
      }
      if (loadedNames.includes(preferredModel)) return preferredModel;
      return loadedNames.find((n) => acceptableModels.includes(n)) ?? null;
    } catch {
      return null;
    }
  }

  /**
   * `nvidia-smi`로 현재 여유 VRAM(MB)을 조회.
   * 멀티 GPU면 가장 여유가 많은 GPU 기준. nvidia-smi 부재·실패 시 null을 반환한다(best-effort).
   * @returns 여유 VRAM(MB), 조회 불가 시 null
   */
  private getFreeVramMB(): Promise<number | null> {
    return new Promise((resolve) => {
      execFile(
        'nvidia-smi',
        ['--query-gpu=memory.free', '--format=csv,noheader,nounits'],
        { timeout: 1000, windowsHide: true },
        (err, stdout) => {
          if (err) return resolve(null);
          const values = stdout
            .split('\n')
            .map((line) => parseInt(line.trim(), 10))
            .filter((n) => Number.isFinite(n));
          if (values.length === 0) return resolve(null);
          resolve(Math.max(...values));
        },
      );
    });
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
