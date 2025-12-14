import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { config } from "./config.js";
import { GeminiClient } from "./gemini-client.js";

/**
 * MCP 서버
 */
export class MCPServer {
  /**
   * @param {GeminiClient} geminiClient - Gemini 클라이언트
   */
  constructor(geminiClient) {
    this.geminiClient = geminiClient;
    this.server = new Server(
      {
        name: config.mcp.serverName,
        version: config.mcp.serverVersion,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  /**
   * 핸들러 설정
   */
  setupHandlers() {
    // 도구 목록 요청 처리
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "generate_text",
          description: "Gemini를 사용하여 텍스트 생성",
          inputSchema: {
            type: "object",
            properties: {
              prompt: {
                type: "string",
                description: "생성할 텍스트의 프롬프트",
              },
              temperature: {
                type: "number",
                description: "생성 온도 (0.0 - 2.0)",
                minimum: 0,
                maximum: 2,
              },
            },
            required: ["prompt"],
          },
        },
        {
          name: "chat",
          description: "Gemini와 대화형 채팅",
          inputSchema: {
            type: "object",
            properties: {
              message: {
                type: "string",
                description: "채팅 메시지",
              },
            },
            required: ["message"],
          },
        },
      ],
    }));

    // 도구 호출 요청 처리
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        switch (request.params.name) {
          case "generate_text":
            return await this.handleGenerateText(request.params.arguments);
          case "chat":
            return await this.handleChat(request.params.arguments);
          default:
            throw new Error(`알 수 없는 도구: ${request.params.name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `오류 발생: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  /**
   * 텍스트 생성 처리
   * @param {Object} args - 인자
   * @returns {Promise<Object>} 응답
   */
  async handleGenerateText(args) {
    const { prompt, temperature } = args;
    const text = await this.geminiClient.generateText(prompt, { temperature });

    return {
      content: [
        {
          type: "text",
          text,
        },
      ],
    };
  }

  /**
   * 채팅 처리
   * @param {Object} args - 인자
   * @returns {Promise<Object>} 응답
   */
  async handleChat(args) {
    const { message } = args;

    if (!this.chatSession) {
      this.chatSession = this.geminiClient.startChat();
    }

    const result = await this.chatSession.sendMessage(message);
    const response = result.response;

    return {
      content: [
        {
          type: "text",
          text: response.text(),
        },
      ],
    };
  }

  /**
   * 서버 실행
   * @returns {Promise<void>}
   */
  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("MCP Gemini 서버가 시작되었습니다.");
  }
}
