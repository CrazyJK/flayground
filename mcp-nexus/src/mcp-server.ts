import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, CallToolResult, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { config } from './config.js';
import { UnifiedChatSession, generateText, startChat } from './model-router.js';

/** 텍스트 생성 도구 인자 */
interface GenerateTextArgs {
  prompt: string;
  temperature?: number;
}

/** 채팅 도구 인자 */
interface ChatArgs {
  message: string;
}

/**
 * MCP 프로토콜 서버 (stdio 모드).
 * 셔플 백을 통해 Gemini/GitHub 모델을 균등하게 사용
 */
export class MCPServer {
  private server: Server;
  private chatSession?: UnifiedChatSession;

  constructor() {
    this.server = new Server({ name: config.mcp.serverName, version: config.mcp.serverVersion }, { capabilities: { tools: {} } });
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
          name: 'generate_text',
          description: '셔플 백으로 선택된 AI 모델(Gemini/GitHub)을 사용하여 텍스트 생성',
          inputSchema: {
            type: 'object',
            properties: {
              prompt: { type: 'string', description: '생성할 텍스트의 프롬프트' },
              temperature: { type: 'number', description: '생성 온도 (0.0 - 2.0)', minimum: 0, maximum: 2 },
            },
            required: ['prompt'],
          },
        },
        {
          name: 'chat',
          description: '셔플 백으로 선택된 AI 모델과 대화형 채팅. 대화 히스토리를 유지하며 메시지마다 다른 모델 사용 가능',
          inputSchema: {
            type: 'object',
            properties: {
              message: { type: 'string', description: '채팅 메시지' },
            },
            required: ['message'],
          },
        },
      ],
    }));

    // 도구 호출 요청 처리
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const args = request.params.arguments as Record<string, unknown>;

        switch (request.params.name) {
          case 'generate_text': {
            if (!args || typeof args.prompt !== 'string') throw new Error('prompt is required');
            return await this.handleGenerateText({
              prompt: args.prompt,
              temperature: typeof args.temperature === 'number' ? args.temperature : undefined,
            });
          }
          case 'chat': {
            if (!args || typeof args.message !== 'string') throw new Error('message is required');
            return await this.handleChat({ message: args.message });
          }
          default:
            throw new Error(`알 수 없는 도구: ${request.params.name}`);
        }
      } catch (error: any) {
        return {
          content: [{ type: 'text', text: `오류 발생: ${error.message}` }],
          isError: true,
        };
      }
    });
  }

  /**
   * 텍스트 생성 처리
   * @param args - 인자
   */
  private async handleGenerateText(args: GenerateTextArgs): Promise<CallToolResult> {
    const { text, model, provider } = await generateText(args.prompt, { temperature: args.temperature });
    return {
      content: [{ type: 'text', text: `[${provider}/${model}]\n\n${text}` }],
    };
  }

  /**
   * 채팅 처리 (세션 유지)
   * @param args - 인자
   */
  private async handleChat(args: ChatArgs): Promise<CallToolResult> {
    if (!this.chatSession) {
      this.chatSession = startChat();
    }
    const result = await this.chatSession.sendMessage(args.message);
    return {
      content: [{ type: 'text', text: result.response.text() }],
    };
  }

  /**
   * 서버 실행 (stdio 모드)
   */
  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.info('MCP Nexus 서버가 시작되었습니다 (stdio 모드)');
  }
}
