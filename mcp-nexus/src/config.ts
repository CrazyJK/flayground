import dotenv from 'dotenv';

dotenv.config();

/**
 * 통합 모델 항목 (제공자 정보 포함)
 */
export interface ModelEntry {
  /** 모델 식별자 */
  name: string;
  /** AI 제공자 */
  provider: 'gemini' | 'github' | 'local';
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
  /** GitHub Personal Access Token (없으면 GitHub 모델 비활성화) */
  githubToken: string | undefined;
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
    /** GitHub Models 엔드포인트 */
    githubEndpoint: string;
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
  };
}

/**
 * 애플리케이션 설정
 */
export const config: Config = {
  geminiApiKey: process.env.GEMINI_API_KEY,
  githubToken: process.env.GITHUB_TOKEN,
  localEndpoint: process.env.LOCAL_AI_ENDPOINT,
  localApiKey: process.env.LOCAL_AI_API_KEY || 'ollama',

  mcp: {
    serverName: process.env.MCP_SERVER_NAME || 'nexus-server',
    serverVersion: process.env.MCP_SERVER_VERSION || '1.0.0',
  },

  ai: {
    githubEndpoint: 'https://models.inference.ai.azure.com',
    maxOutputTokens: 8192,
    temperature: 0.7,
    availableModels: [
      // GitHub Models (OpenAI 호환 API)
      { name: 'gpt-4o-mini', provider: 'github', displayName: 'GPT-4o Mini', description: 'OpenAI GPT-4o Mini' },
      { name: 'gpt-4o', provider: 'github', displayName: 'GPT-4o', description: 'OpenAI GPT-4o' },
      { name: 'Phi-4', provider: 'github', displayName: 'Phi-4', description: 'Microsoft Phi-4' },
      { name: 'Llama-3.3-70B-Instruct', provider: 'github', displayName: 'Llama 3.3 70B', description: 'Meta Llama 3.3 70B Instruct' },
      { name: 'Mistral-small-2503', provider: 'github', displayName: 'Mistral Small', description: 'Mistral Small 3.1' },
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
  },
};

/**
 * 설정 유효성 검사.
 * GEMINI_API_KEY, GITHUB_TOKEN, LOCAL_AI_ENDPOINT 중 하나 이상이 있어야 함
 * @throws {Error} 세 설정이 모두 없을 경우
 */
export function validateConfig(): void {
  if (!config.geminiApiKey && !config.githubToken && !config.localEndpoint) {
    throw new Error('GEMINI_API_KEY, GITHUB_TOKEN, LOCAL_AI_ENDPOINT 중 하나 이상을 .env 파일에 설정해야 합니다.');
  }
  if (!config.geminiApiKey) {
    console.warn('[Nexus] GEMINI_API_KEY 없음 - Gemini 모델이 비활성화됩니다.');
  }
  if (!config.githubToken) {
    console.warn('[Nexus] GITHUB_TOKEN 없음 - GitHub 모델이 비활성화됩니다.');
  }
  if (!config.localEndpoint) {
    console.warn('[Nexus] LOCAL_AI_ENDPOINT 없음 - 로컬 모델이 비활성화됩니다.');
  }
}
