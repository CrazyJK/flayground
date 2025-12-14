import dotenv from "dotenv";

dotenv.config();

/**
 * 애플리케이션 설정
 * @type {Object}
 */
export const config = {
  /** Gemini API 키 */
  geminiApiKey: process.env.GEMINI_API_KEY,

  /** MCP 서버 설정 */
  mcp: {
    serverName: process.env.MCP_SERVER_NAME || "gemini-server",
    serverVersion: process.env.MCP_SERVER_VERSION || "1.0.0",
  },

  /** Gemini 모델 설정 */
  gemini: {
    model: "gemini-2.5-flash", // 최신 안정 모델 (2025.6)
    maxOutputTokens: 8192,
    temperature: 0.7,
  },
};

/**
 * 설정 유효성 검사
 * @throws {Error} 필수 설정이 없을 경우
 */
export function validateConfig() {
  if (!config.geminiApiKey) {
    throw new Error(
      "GEMINI_API_KEY가 설정되지 않았습니다. .env 파일을 확인하세요."
    );
  }
}
