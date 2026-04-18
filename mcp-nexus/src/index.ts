import { config, validateConfig } from './config.js';
import { MCPServer } from './mcp-server.js';
import { initProviders } from './model-router.js';

/**
 * 메인 함수 (MCP stdio 모드)
 * HTTP 서버는 http-server.ts 사용
 */
async function main(): Promise<void> {
  try {
    validateConfig();
    initProviders();

    const activeProviders = [config.geminiApiKey ? 'Gemini' : null, config.githubToken ? 'GitHub' : null].filter(Boolean).join(', ');

    console.info(`[Nexus] 활성 제공자: ${activeProviders}`);

    const mcpServer = new MCPServer();
    await mcpServer.run();
  } catch (error) {
    console.error('서버 시작 실패:', error);
    process.exit(1);
  }
}

main();
