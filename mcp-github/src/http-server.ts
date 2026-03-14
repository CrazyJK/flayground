import cors from 'cors';
import express, { Application, NextFunction, Request, Response } from 'express';
import { Server } from 'http';
import { config, validateConfig } from './config.js';
import { ChatSession, GitHubModelsClient } from './github-client.js';

/**
 * 채팅 세션 정보
 */
interface ChatSessionInfo {
  chat: ChatSession;
  createdAt: string;
  messageCount: number;
}

/**
 * 생성 요청 본문
 */
interface GenerateRequestBody {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * 채팅 요청 본문
 */
interface ChatRequestBody {
  message: string;
}

/**
 * 번역 요청 본문
 */
interface TranslateRequestBody {
  text: string;
}

/**
 * HTTP API 서버 (GitHub Models 기반)
 */
class HTTPServer {
  private aiClient: GitHubModelsClient;
  private chatSessions: Map<string, ChatSessionInfo>;
  private app: Application;
  private server?: Server;

  /**
   * @param aiClient - GitHub Models 클라이언트
   */
  constructor(aiClient: GitHubModelsClient) {
    this.aiClient = aiClient;
    this.chatSessions = new Map<string, ChatSessionInfo>();
    this.app = express();

    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * 미들웨어 설정
   */
  private setupMiddleware(): void {
    this.app.use(
      cors({
        origin: '*',
        methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
      })
    );

    this.app.use(express.json({ limit: '10mb' }));

    this.app.use((req: Request, res: Response, next: NextFunction) => {
      console.error(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
      next();
    });
  }

  /**
   * 라우트 설정
   */
  private setupRoutes(): void {
    // 서버 상태 확인
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      });
    });

    // API 정보
    this.app.get('/api/info', (req: Request, res: Response) => {
      res.json({
        name: 'MCP GitHub Models HTTP Server',
        version: '1.0.0',
        vendor: 'github',
        model: config.ai.model,
        endpoints: ['POST /api/generate - 텍스트 생성', 'POST /api/chat - 대화형 채팅', 'POST /api/chat/:sessionId - 특정 세션으로 채팅', 'POST /api/translate - 일본어→한국어 번역', 'GET /api/models - 사용 가능한 모델 목록', 'DELETE /api/chat/:sessionId - 채팅 세션 삭제', 'GET /api/sessions - 활성 세션 목록'],
      });
    });

    // 사용 가능한 모델 목록
    this.app.get('/api/models', (req: Request, res: Response) => {
      res.json({
        success: true,
        currentModel: config.ai.model,
        models: [
          { name: 'gpt-4o', displayName: 'GPT-4o', description: 'OpenAI GPT-4o' },
          { name: 'gpt-4o-mini', displayName: 'GPT-4o Mini', description: 'OpenAI GPT-4o Mini (기본값)' },
          { name: 'Meta-Llama-3.1-405B-Instruct', displayName: 'Llama 3.1 405B', description: 'Meta Llama 3.1' },
          { name: 'claude-3-5-sonnet', displayName: 'Claude 3.5 Sonnet', description: 'Anthropic Claude 3.5 Sonnet' },
        ],
      });
    });

    // 텍스트 생성
    this.app.post('/api/generate', async (req: Request, res: Response) => {
      try {
        const { prompt, temperature, maxTokens } = req.body as GenerateRequestBody;

        if (!prompt) {
          return res.status(400).json({ success: false, error: 'prompt는 필수 파라미터입니다' });
        }

        if (temperature !== undefined && (temperature < 0 || temperature > 2)) {
          return res.status(400).json({ success: false, error: 'temperature는 0.0 ~ 2.0 사이의 값이어야 합니다' });
        }

        const startTime = Date.now();
        const { text, model } = await this.aiClient.generateText(prompt, { temperature, maxOutputTokens: maxTokens });
        const duration = Date.now() - startTime;

        console.error(`텍스트 생성 완료: ${duration}ms, ${text.length}자, 모델: ${model}`);

        res.json({
          success: true,
          text,
          vendor: 'github',
          metadata: {
            promptLength: prompt.length,
            responseLength: text.length,
            duration: `${duration}ms`,
            model,
            temperature: temperature ?? config.ai.temperature,
          },
        });
      } catch (error) {
        console.error('텍스트 생성 오류:', error);
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    });

    // 대화형 채팅 (기본 세션)
    this.app.post('/api/chat', async (req: Request, res: Response) => {
      return this.handleChat(req, res, 'default');
    });

    // 특정 세션으로 채팅
    this.app.post('/api/chat/:sessionId', async (req: Request, res: Response) => {
      return this.handleChat(req, res, String(req.params.sessionId));
    });

    // 일본어→한국어 번역
    this.app.post('/api/translate', async (req: Request, res: Response) => {
      try {
        const { text } = req.body as TranslateRequestBody;

        if (!text) {
          return res.status(400).json({ success: false, error: 'text는 필수 파라미터입니다' });
        }

        const startTime = Date.now();
        const prompt = `다음 일본어 텍스트를 자연스러운 한국어로 번역해주세요. 번역문만 출력하고 다른 설명은 하지 마세요:\n\n${text}`;
        const { text: translation, model } = await this.aiClient.generateText(prompt, { temperature: 0.3 });
        const duration = Date.now() - startTime;

        console.error(`번역 완료: ${duration}ms, ${text.length}자 → ${translation.length}자`);

        res.json({
          success: true,
          original: text,
          translation,
          vendor: 'github',
          metadata: {
            originalLength: text.length,
            translationLength: translation.length,
            duration: `${duration}ms`,
            model,
            sourceLanguage: 'ja',
            targetLanguage: 'ko',
          },
        });
      } catch (error) {
        console.error('번역 오류:', error);
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    });

    // 채팅 세션 삭제
    this.app.delete('/api/chat/:sessionId', (req: Request, res: Response) => {
      const sessionId = String(req.params.sessionId);

      if (this.chatSessions.has(sessionId)) {
        this.chatSessions.delete(sessionId);
        res.json({ success: true, message: `세션 ${sessionId}가 삭제되었습니다` });
      } else {
        res.status(404).json({ success: false, error: `세션 ${sessionId}를 찾을 수 없습니다` });
      }
    });

    // 활성 세션 목록
    this.app.get('/api/sessions', (req: Request, res: Response) => {
      const sessions = Array.from(this.chatSessions.keys()).map((sessionId) => ({
        sessionId,
        createdAt: this.chatSessions.get(sessionId)!.createdAt,
      }));

      res.json({ success: true, sessions, count: sessions.length });
    });

    // 404 핸들러
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      res.status(404).json({ success: false, error: '엔드포인트를 찾을 수 없습니다' });
    });

    // 에러 핸들러
    this.app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
      console.error('서버 오류:', error);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    });
  }

  /**
   * 채팅 요청 처리
   * @param req - Express 요청 객체
   * @param res - Express 응답 객체
   * @param sessionId - 세션 ID
   */
  private async handleChat(req: Request, res: Response, sessionId: string): Promise<void> {
    try {
      const { message } = req.body as ChatRequestBody;

      if (!message) {
        res.status(400).json({ success: false, error: 'message는 필수 파라미터입니다' });
        return;
      }

      if (!this.chatSessions.has(sessionId)) {
        const chat = this.aiClient.startChat();
        this.chatSessions.set(sessionId, { chat, createdAt: new Date().toISOString(), messageCount: 0 });
        console.error(`새 채팅 세션 생성: ${sessionId}`);
      }

      const session = this.chatSessions.get(sessionId)!;
      const startTime = Date.now();

      const result = await session.chat.sendMessage(message);
      const response = result.response.text();
      const duration = Date.now() - startTime;

      session.messageCount++;
      console.error(`채팅 응답 완료 [${sessionId}]: ${duration}ms, ${response.length}자`);

      res.json({
        success: true,
        response,
        vendor: 'github',
        metadata: {
          sessionId,
          messageCount: session.messageCount,
          messageLength: message.length,
          responseLength: response.length,
          duration: `${duration}ms`,
          model: config.ai.model,
          createdAt: session.createdAt,
        },
      });
    } catch (error) {
      console.error(`채팅 오류 [${sessionId}]:`, error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  /**
   * 서버 시작
   * @param port - 포트 번호
   */
  start(port: number = 3001): Promise<void> {
    return new Promise((resolve) => {
      this.server = this.app.listen(port, () => {
        console.error(`🚀 MCP GitHub Models HTTP 서버가 http://localhost:${port}에서 실행 중입니다`);
        console.error(`📊 API 정보: http://localhost:${port}/api/info`);
        console.error(`💚 헬스 체크: http://localhost:${port}/health`);
        resolve();
      });
    });
  }

  /**
   * 서버 종료
   */
  stop(): void {
    if (this.server) {
      this.server.close();
      console.error('HTTP 서버가 종료되었습니다');
    }
  }
}

/**
 * 메인 함수
 */
async function main(): Promise<void> {
  try {
    validateConfig();

    const aiClient = new GitHubModelsClient(config.githubToken!);
    const httpServer = new HTTPServer(aiClient);

    const port = parseInt(process.env.PORT || '3001', 10);
    await httpServer.start(port);

    process.on('SIGINT', () => {
      console.error('종료 신호 수신...');
      httpServer.stop();
      process.exit(0);
    });
  } catch (error) {
    console.error('서버 시작 실패:', error);
    process.exit(1);
  }
}

main();
