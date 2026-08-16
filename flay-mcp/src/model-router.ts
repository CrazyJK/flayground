import fs from 'fs';
import path from 'path';
import { ModelEntry, config } from './config';
import { GeminiProvider } from './providers/gemini-provider';
import { GitHubProvider } from './providers/github-provider';
import { LocalProvider } from './providers/local-provider';
import { GenerateOptions } from './providers/provider.interface';

/** 통계 파일 경로 */
const STATS_FILE = path.join(process.cwd(), 'data', 'model-stats.json');

/** 모델 통계 내부 저장 타입 */
interface ModelStats {
  successCount: number;
  totalTime: number;
  maxMs: number;
  slowCount: number;
  errors: number;
}

/** 모델별 통계 Map */
const modelStatsMap = new Map<string, ModelStats>();

// 앱 시작 시 파일에서 통계 로드
try {
  if (fs.existsSync(STATS_FILE)) {
    const parsed: Record<string, any> = JSON.parse(fs.readFileSync(STATS_FILE, 'utf-8'));
    for (const [model, s] of Object.entries(parsed)) {
      // 구버전(times 배열) 마이그레이션 지원
      if (Array.isArray(s.times)) {
        const times: number[] = s.times;
        modelStatsMap.set(model, {
          successCount: times.length,
          totalTime: times.reduce((a: number, b: number) => a + b, 0),
          maxMs: times.length > 0 ? Math.max(...times) : 0,
          slowCount: s.slowCount ?? 0,
          errors: s.errors ?? 0,
        });
      } else {
        modelStatsMap.set(model, {
          successCount: s.successCount ?? 0,
          totalTime: s.totalTime ?? 0,
          maxMs: s.maxMs ?? 0,
          slowCount: s.slowCount ?? 0,
          errors: s.errors ?? 0,
        });
      }
    }
    console.info(`[Nexus] 통계 파일 로드 완료: ${modelStatsMap.size}개 모델`);
  }
} catch {
  // 파싱 실패 시 빈 Map으로 시작
}

/**
 * 모델 응답 결과를 기록하고 통계를 저장
 * @param model - 사용된 모델명
 * @param ms - 응답 시간(밀리초), 오류 시 null
 * @param error - 오류 객체
 */
function trackModel(model: string, ms: number | null, error?: any): void {
  if (!modelStatsMap.has(model)) {
    modelStatsMap.set(model, { successCount: 0, totalTime: 0, maxMs: 0, slowCount: 0, errors: 0 });
  }
  const stats = modelStatsMap.get(model)!;

  if (error !== undefined) {
    stats.errors += 1;
    console.error(`[Nexus 오류] ${model} | ${error?.message ?? String(error)}`);
  } else if (ms !== null) {
    stats.successCount += 1;
    stats.totalTime += ms;
    if (ms > stats.maxMs) stats.maxMs = ms;
    if (ms >= 10_000) stats.slowCount += 1;
  }

  // 통계를 파일에 저장
  try {
    const obj: Record<string, ModelStats> = {};
    for (const [m, s] of modelStatsMap.entries()) obj[m] = s;
    fs.mkdirSync(path.dirname(STATS_FILE), { recursive: true });
    fs.writeFileSync(STATS_FILE, JSON.stringify(obj, null, 2), 'utf-8');
  } catch {
    // 파일 저장 실패는 무시
  }

  // SSE 리스너들에게 최신 통계 push
  const currentStats = getModelStats();
  for (const fn of statsListeners) fn(currentStats);
}

// ─── 셔플 백 ───────────────────────────────────────────────────────────────

/** 현재 셔플 백 (활성화된 모델 항목들) */
const modelBag: ModelEntry[] = [];

/** 활성화된 제공자 (초기화 여부에 따라 결정) */
let geminiProvider: GeminiProvider | undefined;
let githubProvider: GitHubProvider | undefined;
let localProvider: LocalProvider | undefined;

/** 제공자별 기본 검증 모델 */
const DEFAULT_VALIDATE_MODELS: Record<'gemini' | 'github' | 'local', string> = {
  gemini: 'gemini-2.5-flash',
  github: 'gpt-4o-mini',
  local: 'huihui_ai/qwen2.5-abliterate:7b',
};

/**
 * 제공자별 검증용 모델명을 조회
 * @param provider - 제공자 식별자
 * @returns 검증에 사용할 모델명
 */
function getValidationModel(provider: 'gemini' | 'github' | 'local'): string {
  return config.ai.availableModels.find((m) => m.provider === provider)?.name ?? DEFAULT_VALIDATE_MODELS[provider];
}

/**
 * 활성 모델로 셔플 백을 채움
 */
function refillBag(): void {
  const activeModels = config.ai.availableModels.filter((m) => {
    if (m.provider === 'gemini') return !!geminiProvider;
    if (m.provider === 'github') return !!githubProvider;
    if (m.provider === 'local') return !!localProvider;
    return false;
  });
  modelBag.push(...activeModels);
  console.info(`[Nexus] 모델 가방 재충전: [${activeModels.map((m) => m.name).join(', ')}]`);
}

/**
 * 셔플 백에서 랜덤 모델 선택. 가방이 비면 재충전
 * @returns 선택된 모델 항목
 */
function pickRandomModel(): ModelEntry {
  if (modelBag.length === 0) {
    refillBag();
  }
  const index = Math.floor(Math.random() * modelBag.length);
  const [selected] = modelBag.splice(index, 1);
  console.log(`[Nexus] 선택된 모델: ${selected.name} (${selected.provider}) - 남은 ${modelBag.length}개`);
  return selected;
}

// ─── 초기화 ───────────────────────────────────────────────────────────────

/**
 * 제공자 초기화. validateConfig() 호출 후 실행
 */
export async function initProviders(): Promise<void> {
  geminiProvider = undefined;
  githubProvider = undefined;
  localProvider = undefined;

  if (config.geminiApiKey) {
    const provider = new GeminiProvider(config.geminiApiKey);
    const modelName = getValidationModel('gemini');
    try {
      await provider.validateAccess(modelName);
      geminiProvider = provider;
      console.info(`[Nexus] Gemini 제공자 검증 완료 (${modelName})`);
    } catch (error: any) {
      console.warn(`[Nexus] Gemini 토큰 검증 실패 - 비활성화됩니다. ${error?.message ?? String(error)}`);
    }
  }

  if (config.githubToken) {
    const provider = new GitHubProvider(config.githubToken);
    const modelName = getValidationModel('github');
    try {
      await provider.validateAccess(modelName);
      githubProvider = provider;
      console.info(`[Nexus] GitHub 제공자 검증 완료 (${modelName})`);
    } catch (error: any) {
      console.warn(`[Nexus] GitHub 토큰 검증 실패 - 비활성화됩니다. ${error?.message ?? String(error)}`);
    }
  }

  if (config.localEndpoint) {
    const provider = new LocalProvider(config.localEndpoint, config.localApiKey);
    const modelName = getValidationModel('local');
    try {
      await provider.validateAccess(modelName);
      localProvider = provider;
      console.info(`[Nexus] 로컬 제공자 검증 완료 (${config.localEndpoint})`);
    } catch (error: any) {
      console.warn(`[Nexus] 로컬 엔드포인트 검증 실패 - 비활성화됩니다. ${error?.message ?? String(error)}`);
    }
  }

  if (!geminiProvider && !githubProvider && !localProvider) {
    throw new Error('사용 가능한 AI 제공자가 없습니다. API 키 유효성/권한을 확인하세요.');
  }

  refillBag();
}

// ─── 생성 함수 ─────────────────────────────────────────────────────────────

/** 생성 결과 */
export interface RouteResult {
  text: string;
  model: string;
  provider: 'gemini' | 'github' | 'local';
}

/**
 * 모델 실행 함수 타입
 */
type ModelExecutor = (entry: ModelEntry, modelName: string) => Promise<string>;

/**
 * 활성 모델 수만큼 자동 재시도하며 텍스트를 생성
 * @param operationName - 로그/오류 메시지에 사용할 동작 이름
 * @param executor - 모델별 실제 실행 로직
 * @returns 생성 결과
 */
async function executeWithFallback(operationName: string, executor: ModelExecutor): Promise<RouteResult> {
  const maxAttempts = getAvailableModels().length;

  if (maxAttempts === 0) {
    throw new Error('활성화된 모델이 없습니다. API 키 설정을 확인하세요.');
  }

  const errors: string[] = [];

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const entry = pickRandomModel();
    let modelName = entry.name;

    // 로컬은 'best-effort': 스왑(=메인 사용자 방해)을 피한다.
    // 다른 로컬 모델이 이미 로드돼 있고 허용 목록에 있으면 그 모델을 그대로 재사용한다.
    if (entry.provider === 'local' && localProvider) {
      const usable = await localProvider.resolveUsableModel(entry.name, config.ai.localChatModels);
      if (!usable) {
        console.info(`[Nexus] 로컬 모델 보류(GPU 사용 중, 스왑 회피): ${entry.name} [시도 ${attempt}/${maxAttempts}]`);
        continue;
      }
      if (usable !== entry.name) {
        console.info(`[Nexus] 로컬 로드된 모델 재사용(스왑 회피): ${usable} (요청 ${entry.name})`);
      }
      modelName = usable;
    }

    const start = Date.now();

    try {
      const text = await executor(entry, modelName);
      trackModel(modelName, Date.now() - start);

      if (attempt > 1) {
        console.warn(`[Nexus] ${operationName} 폴백 성공: ${modelName} (${entry.provider}) [시도 ${attempt}/${maxAttempts}]`);
      }

      return { text, model: modelName, provider: entry.provider };
    } catch (error: any) {
      trackModel(modelName, null, error);
      const message = error?.message ?? String(error);
      errors.push(`[${modelName}] ${message}`);
      console.warn(`[Nexus] ${operationName} 실패: ${modelName} (${entry.provider}) [시도 ${attempt}/${maxAttempts}]`);
    }
  }

  throw new Error(`${operationName} 실패: 활성 모델 ${maxAttempts}개 재시도 모두 실패 | ${errors.join(' | ')}`);
}

/**
 * 셔플 백으로 모델 선택 후 텍스트 생성
 * @param prompt - 입력 프롬프트
 * @param options - 생성 옵션
 * @returns 생성 결과
 */
export async function generateText(prompt: string, options?: GenerateOptions): Promise<RouteResult> {
  return executeWithFallback('텍스트 생성', (entry, modelName) => resolveProvider(entry).generateText(prompt, modelName, options));
}

/**
 * 셔플 백으로 모델 선택 후 대화 히스토리를 포함하여 텍스트 생성
 * @param history - 전체 대화 히스토리 (user/assistant 교대)
 * @param options - 생성 옵션
 * @returns 생성 결과
 */
export async function generateWithHistory(history: Array<{ role: 'user' | 'assistant'; content: string }>, options?: GenerateOptions): Promise<RouteResult> {
  return executeWithFallback('채팅 생성', (entry, modelName) => resolveProvider(entry).generateWithHistory(history, modelName, options));
}

/**
 * 제공자 인스턴스 반환
 * @param entry - 모델 항목
 */
function resolveProvider(entry: ModelEntry) {
  if (entry.provider === 'gemini' && geminiProvider) return geminiProvider;
  if (entry.provider === 'github' && githubProvider) return githubProvider;
  if (entry.provider === 'local' && localProvider) return localProvider;
  throw new Error(`제공자 ${entry.provider}가 초기화되지 않았습니다`);
}

// ─── 채팅 세션 ─────────────────────────────────────────────────────────────

/**
 * 통합 채팅 세션.
 * 대화 히스토리를 직접 관리하며, 메시지마다 셔플 백으로 모델을 선택.
 * Gemini/GitHub 제공자 간 자유롭게 전환하면서도 대화 맥락을 유지
 */
export class UnifiedChatSession {
  private history: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  /**
   * 메시지 전송 및 응답 수신
   * @param message - 사용자 메시지
   * @returns 응답 객체 (gemini/github 호환 형태)
   */
  async sendMessage(message: string): Promise<{ response: { text: () => string }; model: string; provider: string }> {
    this.history.push({ role: 'user', content: message });
    const result = await generateWithHistory(this.history);
    this.history.push({ role: 'assistant', content: result.text });
    return {
      response: { text: () => result.text },
      model: result.model,
      provider: result.provider,
    };
  }
}

/**
 * 새 통합 채팅 세션 시작
 * @returns UnifiedChatSession 인스턴스
 */
export function startChat(): UnifiedChatSession {
  return new UnifiedChatSession();
}

// ─── 통계 ──────────────────────────────────────────────────────────────────

/** 통계 변경 리스너 타입 */
type StatsListener = (stats: ReturnType<typeof getModelStats>) => void;

/** SSE 클라이언트 리스너 Set */
const statsListeners = new Set<StatsListener>();

/**
 * 통계 변경 리스너 등록
 * @param fn - 통계 업데이트 시 호출될 콜백
 */
export function addStatsListener(fn: StatsListener): void {
  statsListeners.add(fn);
}

/**
 * 통계 변경 리스너 제거
 * @param fn - 제거할 콜백
 */
export function removeStatsListener(fn: StatsListener): void {
  statsListeners.delete(fn);
}

/**
 * 전체 모델 통계 반환
 */
export function getModelStats(): Record<string, { requests: number; success: number; errors: number; avgMs: number; maxMs: number; slowCount: number; provider: string }> {
  const result: Record<string, { requests: number; success: number; errors: number; avgMs: number; maxMs: number; slowCount: number; provider: string }> = {};
  for (const [model, s] of modelStatsMap.entries()) {
    const entry = config.ai.availableModels.find((m) => m.name === model);
    result[model] = {
      requests: s.successCount + s.errors,
      success: s.successCount,
      errors: s.errors,
      avgMs: s.successCount > 0 ? Math.round(s.totalTime / s.successCount) : 0,
      maxMs: s.maxMs,
      slowCount: s.slowCount,
      provider: entry?.provider ?? 'unknown',
    };
  }
  return result;
}

/**
 * 활성화된 모델 목록 반환 (제공자별 필터링 지원)
 * @param providerFilter - 특정 제공자만 반환 (없으면 전체)
 */
export function getAvailableModels(providerFilter?: 'gemini' | 'github' | 'local'): ModelEntry[] {
  const active = config.ai.availableModels.filter((m) => {
    if (m.provider === 'gemini') return !!geminiProvider;
    if (m.provider === 'github') return !!githubProvider;
    if (m.provider === 'local') return !!localProvider;
    return false;
  });
  if (providerFilter) return active.filter((m) => m.provider === providerFilter);
  return active;
}
