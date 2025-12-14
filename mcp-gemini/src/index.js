import { config, validateConfig } from "./config.js";
import { GeminiClient } from "./gemini-client.js";
import { MCPServer } from "./mcp-server.js";

/**
 * 메인 함수
 */
async function main() {
  try {
    // 설정 검증
    validateConfig();

    // Gemini 클라이언트 초기화
    const geminiClient = new GeminiClient(config.geminiApiKey);

    // MCP 서버 초기화 및 실행
    const mcpServer = new MCPServer(geminiClient);
    await mcpServer.run();
  } catch (error) {
    console.error("서버 시작 실패:", error);
    process.exit(1);
  }
}

main();
