import cors from 'cors';
import express, { Application, NextFunction, Request, Response } from 'express';
import fs from 'fs';
import { Server } from 'http';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';
import { config, validateConfig } from './config.js';
import { UnifiedChatSession, addStatsListener, generateText, getAvailableModels, getModelStats, initProviders, removeStatsListener, startChat } from './model-router.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** 채팅 세션 정보 */
interface ChatSessionInfo {
  chat: UnifiedChatSession;
  createdAt: string;
  messageCount: number;
}

/** 생성 요청 본문 */
interface GenerateRequestBody {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
}

/** 채팅 요청 본문 */
interface ChatRequestBody {
  message: string;
}

/** 번역 요청 본문 */
interface TranslateRequestBody {
  text: string;
}

/**
 * MCP Nexus HTTP API 서버.
 * Gemini와 GitHub Models를 셔플 백으로 통합 제공
 */
class HTTPServer {
  private chatSessions: Map<string, ChatSessionInfo>;
  private app: Application;
  private server?: Server | https.Server;

  constructor() {
    this.chatSessions = new Map();
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

    // public 폴더 정적 파일 서빙 (stats.html 등)
    this.app.use(express.static(path.join(__dirname, '../public')));

    this.app.use((req: Request, res: Response, next: NextFunction) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
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
        providers: {
          gemini: !!config.geminiApiKey,
          github: !!config.githubToken,
        },
      });
    });

    // API 정보
    this.app.get('/api/info', (req: Request, res: Response) => {
      res.json({
        name: 'MCP Nexus HTTP Server',
        version: '1.0.0',
        providers: {
          gemini: !!config.geminiApiKey,
          github: !!config.githubToken,
        },
        activeModels: getAvailableModels().map((m) => m.name),
        endpoints: [
          'POST /api/generate - 텍스트 생성 (셔플 백 모델 선택)',
          'POST /api/chat - 대화형 채팅 (기본 세션)',
          'POST /api/chat/:sessionId - 특정 세션으로 채팅',
          'POST /api/translate - 일본어→한국어 번역',
          'GET /api/models - 활성 모델 목록',
          'DELETE /api/chat/:sessionId - 채팅 세션 삭제',
          'GET /api/sessions - 활성 세션 목록',
          'GET /api/stats - 모델별 통계',
          'GET /api/stats/stream - 모델 통계 SSE 스트림 (실시간)',
        ],
      });
    });

    // 활성 모델 목록 (제공자별 필터 지원: ?provider=gemini|github)
    this.app.get('/api/models', (req: Request, res: Response) => {
      const providerFilter = req.query.provider as 'gemini' | 'github' | undefined;
      const models = getAvailableModels(providerFilter);
      res.json({ success: true, models });
    });

    // 텍스트 생성 (셔플 백으로 모델 자동 선택)
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
        const { text, model, provider } = await generateText(prompt, { temperature, maxOutputTokens: maxTokens });
        const duration = Date.now() - startTime;

        console.info(`텍스트 생성 완료: ${duration}ms, ${text.length}자, 모델: ${model} (${provider})`);

        res.json({
          success: true,
          text,
          provider,
          metadata: {
            promptLength: prompt.length,
            responseLength: text.length,
            duration: `${duration}ms`,
            model,
            provider,
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
        const { text: translation, model, provider } = await generateText(prompt, { temperature: 0.3 });
        const duration = Date.now() - startTime;

        console.info(`번역 완료: ${duration}ms, ${text.length}자 → ${translation.length}자`);

        res.json({
          success: true,
          original: text,
          translation,
          provider,
          metadata: {
            originalLength: text.length,
            translationLength: translation.length,
            duration: `${duration}ms`,
            model,
            provider,
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
        messageCount: this.chatSessions.get(sessionId)!.messageCount,
      }));
      res.json({ success: true, sessions, count: sessions.length });
    });

    // 모델 통계 조회
    this.app.get('/api/stats', (req: Request, res: Response) => {
      res.json({ success: true, stats: getModelStats() });
    });

    // 모델 통계 실시간 스트림 (SSE)
    this.app.get('/api/stats/stream', (req: Request, res: Response) => {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      // 연결 즉시 현재 통계 전송
      res.write(`data: ${JSON.stringify(getModelStats())}\n\n`);

      const listener = (stats: ReturnType<typeof getModelStats>) => {
        res.write(`data: ${JSON.stringify(stats)}\n\n`);
      };

      addStatsListener(listener);
      req.on('close', () => removeStatsListener(listener));
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
        this.chatSessions.set(sessionId, {
          chat: startChat(),
          createdAt: new Date().toISOString(),
          messageCount: 0,
        });
        console.info(`새 채팅 세션 생성: ${sessionId}`);
      }

      const session = this.chatSessions.get(sessionId)!;
      const startTime = Date.now();

      const result = await session.chat.sendMessage(message);
      const response = result.response.text();
      const duration = Date.now() - startTime;

      session.messageCount++;
      console.info(`채팅 응답 완료 [${sessionId}]: ${duration}ms, ${response.length}자, 모델: ${result.model} (${result.provider})`);

      res.json({
        success: true,
        response,
        provider: result.provider,
        metadata: {
          sessionId,
          messageCount: session.messageCount,
          messageLength: message.length,
          responseLength: response.length,
          duration: `${duration}ms`,
          model: result.model,
          provider: result.provider,
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
  start(port: number = 3002): Promise<void> {
    return new Promise((resolve) => {
      const certDir = path.resolve(__dirname, '../../cert');
      const keyPath = path.join(certDir, 'kamoru.jk.key');
      const certPath = path.join(certDir, 'kamoru.jk.pem');
      const hasCert = fs.existsSync(keyPath) && fs.existsSync(certPath);

      const onListening = (protocol: string) => {
        console.info(`🚀 MCP Nexus HTTP 서버가 ${protocol}://flay.kamoru.jk:${port}에서 실행 중입니다`);
        console.info(`📊 API 정보: ${protocol}://flay.kamoru.jk:${port}/api/info`);
        console.info(`💚 헬스 체크: ${protocol}://flay.kamoru.jk:${port}/health`);
        console.info(`📈 모델 통계: ${protocol}://flay.kamoru.jk:${port}/stats.html`);
        resolve();
      };

      if (hasCert) {
        this.server = https.createServer({ key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) }, this.app);
        this.server.listen(port, () => onListening('https'));
      } else {
        console.warn('[Nexus] 인증서를 찾을 수 없습니다. HTTP 모드로 시작합니다.');
        this.server = this.app.listen(port, () => onListening('http'));
      }
    });
  }

  /**
   * 서버 종료
   */
  stop(): void {
    if (this.server) {
      this.server.close();
      console.info('HTTP 서버가 종료되었습니다');
    }
  }
}

/**
 * 메인 함수
 */
async function main(): Promise<void> {
  try {
    validateConfig();
    initProviders();

    const httpServer = new HTTPServer();
    const port = parseInt(process.env.PORT || '3002', 10);
    await httpServer.start(port);

    process.on('SIGINT', () => {
      console.info('종료 신호 수신...');
      httpServer.stop();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.info('종료 신호 수신...');
      httpServer.stop();
      process.exit(0);
    });
  } catch (error) {
    console.error('서버 시작 실패:', error);
    process.exit(1);
  }
}

main();
