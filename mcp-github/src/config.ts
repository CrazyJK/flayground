import dotenv from 'dotenv';

dotenv.config();

/**
 * 애플리케이션 설정 타입
 */
export interface Config {
  /** GitHub Personal Access Token */
  githubToken: string | undefined;

  /** MCP 서버 설정 */
  mcp: {
    serverName: string;
    serverVersion: string;
  };

  /** AI 모델 설정 */
  ai: {
    endpoint: string;
    /** 기본 모델 (환경변수 미설정 시 사용) */
    model: string;
    /** 랜덤 선택 대상 모델 목록 */
    availableModels: string[];
    maxOutputTokens: number;
    temperature: number;
  };
}

/**
 * 애플리케이션 설정
 */
export const config: Config = {
  githubToken: process.env.GITHUB_TOKEN,

  mcp: {
    serverName: process.env.MCP_SERVER_NAME || 'github-models-server',
    serverVersion: process.env.MCP_SERVER_VERSION || '1.0.0',
  },

  ai: {
    endpoint: 'https://models.inference.ai.azure.com',
    model: process.env.GITHUB_MODELS_MODEL || 'gpt-4o-mini',
    availableModels: [
      'gpt-4o-mini', // OpenAI GPT-4o mini
      'gpt-4o', // OpenAI GPT-4o
      'Phi-4', // Microsoft Phi-4
      'Llama-3.3-70B-Instruct', // Meta Llama 3.3 70B
      'Mistral-small-2503', // Mistral Small 3.1
    ],
    maxOutputTokens: 8192,
    temperature: 0.7,
  },
};

/**
 * 설정 유효성 검사
 * @throws {Error} 필수 설정이 없을 경우
 */
export function validateConfig(): void {
  if (!config.githubToken) {
    throw new Error('GITHUB_TOKEN이 설정되지 않았습니다. .env 파일을 확인하세요.');
  }
}
