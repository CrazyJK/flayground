import dotenv from 'dotenv';

dotenv.config();

/**
 * 통합 모델 항목 (제공자 정보 포함)
 */
/** 제공자 식별자. openai = 외부 OpenAI 호환 API(OpenRouter 등, 엔드포인트·키·모델은 .env) */
export type ProviderId = 'gemini' | 'openai' | 'local';

export interface ModelEntry {
  /** 모델 식별자 */
  name: string;
  /** AI 제공자 */
  provider: ProviderId;
  /** 표시 이름 */
  displayName: string;
  /** 설명 */
  description: string;
}

/**
 * 애플리케이션 설정 타입
 */
export interface Config {
  /** Gemini API 키 (없으면 Gemini 모델 비활성화) */
  geminiApiKey: string | undefined;
  /**
   * 외부 OpenAI 호환 API(OpenRouter·Groq 등). baseUrl·apiKey·models 가 모두 있어야 활성화.
   * 모델 ID 는 해당 서비스 표기 그대로(예: OpenRouter `nvidia/nemotron-3-super-120b-a12b:free`).
   */
  openaiCompat: {
    baseUrl: string | undefined;
    apiKey: string | undefined;
    models: string[];
  };
  /** 로컬 Ollama OpenAI 호환 엔드포인트 (없으면 로컬 모델 비활성화) */
  localEndpoint: string | undefined;
  /** 로컬 제공자용 더미 API 키 (Ollama는 무시) */
  localApiKey: string;

  /** MCP 서버 설정 */
  mcp: {
    serverName: string;
    serverVersion: string;
  };

  /** AI 공통 설정 */
  ai: {
    /** 기본 최대 출력 토큰 */
    maxOutputTokens: number;
    /** 기본 생성 온도 */
    temperature: number;
    /** 셔플 백에 포함할 전체 모델 목록 */
    availableModels: ModelEntry[];
    /**
     * 로컬(Ollama)에서 스왑 없이 재사용 가능한 채팅 모델 목록.
     * 셔플 백이 로컬을 선택했을 때, 이 중 이미 로드된 모델이 있으면
     * 메인 사용자(flayAI)의 모델을 내리지 않고 그 모델을 그대로 사용한다.
     */
    localChatModels: string[];
    /**
     * 로컬 모델을 새로 로드해도 되는 최소 여유 VRAM(MB).
     * Ollama가 idle이어도 PyTorch 등 다른 프로세스가 VRAM을 점유 중일 수 있으므로,
     * `nvidia-smi`의 free VRAM이 이 값 미만이면 로컬 로드를 보류한다(best-effort).
     */
    localMinFreeVramMB: number;
  };
}

/** OPENAI_COMPAT_MODELS(쉼표 구분 모델 ID) → 모델 항목. displayName 은 ID 그대로(서비스 표기 유지). */
const openaiCompatModels = (process.env.OPENAI_COMPAT_MODELS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

/**
 * 애플리케이션 설정
 */
export const config: Config = {
  geminiApiKey: process.env.GEMINI_API_KEY,
  openaiCompat: {
    baseUrl: process.env.OPENAI_COMPAT_BASE_URL,
    apiKey: process.env.OPENAI_COMPAT_API_KEY,
    models: openaiCompatModels,
  },
  localEndpoint: process.env.LOCAL_AI_ENDPOINT,
  localApiKey: process.env.LOCAL_AI_API_KEY || 'ollama',

  mcp: {
    serverName: process.env.MCP_SERVER_NAME || 'nexus-server',
    serverVersion: process.env.MCP_SERVER_VERSION || '1.0.0',
  },

  ai: {
    maxOutputTokens: 8192,
    temperature: 0.7,
    availableModels: [
      // 외부 OpenAI 호환 API 모델 (.env OPENAI_COMPAT_MODELS)
      ...openaiCompatModels.map((name): ModelEntry => ({ name, provider: 'openai', displayName: name, description: `OpenAI 호환 API 모델 ${name}` })),
      // Google Gemini Models
      { name: 'gemini-2.5-flash', provider: 'gemini', displayName: 'Gemini 2.5 Flash', description: 'Google Gemini 2.5 Flash' },
      // { name: 'gemini-2.0-flash', provider: 'gemini', displayName: 'Gemini 2.0 Flash', description: 'Google Gemini 2.0 Flash' },
      // 로컬 Ollama Models (OpenAI 호환 API)
      { name: 'huihui_ai/qwen2.5-abliterate:7b', provider: 'local', displayName: 'Qwen2.5 7B (Local)', description: 'Local Ollama Qwen2.5 Abliterate 7B' },
      // { name: 'huihui_ai/exaone3.5-abliterated:7.8b', provider: 'local', displayName: 'EXAONE 3.5 7.8B (Local)', description: 'Local Ollama EXAONE 3.5 Abliterated 7.8B' },
    ],
    localChatModels: [
      'huihui_ai/qwen2.5-abliterate:7b', //
      'huihui_ai/exaone3.5-abliterated:7.8b',
    ],
    localMinFreeVramMB: 6000,
  },
};

/**
 * 외부 OpenAI 호환 제공자 활성 조건: baseUrl·apiKey·모델 1개 이상
 */
export function hasOpenaiCompat(): boolean {
  const c = config.openaiCompat;
  return !!(c.baseUrl && c.apiKey && c.models.length > 0);
}

/**
 * 설정 유효성 검사.
 * GEMINI_API_KEY, OPENAI_COMPAT_*(BASE_URL+API_KEY+MODELS), LOCAL_AI_ENDPOINT 중 하나 이상이 있어야 함
 * @throws {Error} 세 설정이 모두 없을 경우
 */
export function validateConfig(): void {
  if (!config.geminiApiKey && !hasOpenaiCompat() && !config.localEndpoint) {
    throw new Error('GEMINI_API_KEY, OPENAI_COMPAT_BASE_URL/API_KEY/MODELS, LOCAL_AI_ENDPOINT 중 하나 이상을 .env 파일에 설정해야 합니다.');
  }
  if (!config.geminiApiKey) {
    console.warn('[Nexus] GEMINI_API_KEY 없음 - Gemini 모델이 비활성화됩니다.');
  }
  if (!hasOpenaiCompat()) {
    console.warn('[Nexus] OPENAI_COMPAT_BASE_URL/API_KEY/MODELS 미완성 - 외부 OpenAI 호환 모델이 비활성화됩니다.');
  }
  if (!config.localEndpoint) {
    console.warn('[Nexus] LOCAL_AI_ENDPOINT 없음 - 로컬 모델이 비활성화됩니다.');
  }
}
