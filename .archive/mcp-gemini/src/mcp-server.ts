import { ChatSession } from "@google/generative-ai";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  CallToolResult,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { config } from "./config.js";
import { GeminiClient } from "./gemini-client.js";

/**
 * 도구 인자 인터페이스
 */
interface GenerateTextArgs {
  prompt: string;
  temperature?: number;
}

interface ChatArgs {
  message: string;
}

/**
 * MCP 서버
 */
export class MCPServer {
  private geminiClient: GeminiClient;
  private server: Server;
  private chatSession?: ChatSession;

  /**
   * @param geminiClient - Gemini 클라이언트
   */
  constructor(geminiClient: GeminiClient) {
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
  private setupHandlers(): void {
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
        const args = request.params.arguments as Record<string, unknown>;

        switch (request.params.name) {
          case "generate_text": {
            if (!args || typeof args.prompt !== "string") {
              throw new Error("prompt is required");
            }
            const temperature =
              typeof args.temperature === "number"
                ? args.temperature
                : undefined;
            return await this.handleGenerateText({
              prompt: args.prompt,
              temperature,
            });
          }
          case "chat": {
            if (!args || typeof args.message !== "string") {
              throw new Error("message is required");
            }
            return await this.handleChat({ message: args.message });
          }
          default:
            throw new Error(`알 수 없는 도구: ${request.params.name}`);
        }
      } catch (error: any) {
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
   * @param args - 인자
   * @returns 응답
   */
  private async handleGenerateText(
    args: GenerateTextArgs
  ): Promise<CallToolResult> {
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
   * @param args - 인자
   * @returns 응답
   */
  private async handleChat(args: ChatArgs): Promise<CallToolResult> {
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
   */
  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("MCP Gemini 서버가 시작되었습니다.");
  }
}
