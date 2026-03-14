import { config, validateConfig } from './config.js';
import { GitHubModelsClient } from './github-client.js';

/**
 * 메인 함수 (MCP 서버 모드)
 * HTTP 서버는 http-server.ts 사용
 */
async function main(): Promise<void> {
  try {
    validateConfig();

    const aiClient = new GitHubModelsClient(config.githubToken!);
    console.error('GitHub Models 클라이언트 초기화 완료:', config.ai.model);
  } catch (error) {
    console.error('초기화 실패:', error);
    process.exit(1);
  }
}

main();
