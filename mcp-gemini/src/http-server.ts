import { ChatSession } from "@google/generative-ai";
import cors from "cors";
import express, { Application, NextFunction, Request, Response } from "express";
import { Server } from "http";
import { config, validateConfig } from "./config.js";
import { GeminiClient } from "./gemini-client.js";

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
 * API 응답
 */
interface ApiResponse<T = any> {
  success: boolean;
  error?: string;
  [key: string]: any;
}

/**
 * 모델 정보
 */
interface ModelInfo {
  name: string;
  displayName: string;
  description: string;
  supportedGenerationMethods: string[];
}

/**
 * HTTP API 서버
 */
class HTTPServer {
  private geminiClient: GeminiClient;
  private chatSessions: Map<string, ChatSessionInfo>;
  private app: Application;
  private server?: Server;

  /**
   * @param geminiClient - Gemini 클라이언트
   */
  constructor(geminiClient: GeminiClient) {
    this.geminiClient = geminiClient;
    this.chatSessions = new Map<string, ChatSessionInfo>();
    this.app = express();

    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * 미들웨어 설정
   */
  private setupMiddleware(): void {
    // CORS 설정
    this.app.use(
      cors({
        origin: "*",
        methods: ["GET", "POST", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
      })
    );

    // JSON 파싱
    this.app.use(express.json({ limit: "10mb" }));

    // 로깅 미들웨어
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
    this.app.get("/health", (req: Request, res: Response) => {
      res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
      });
    });

    // API 정보 엔드포인트
    this.app.get("/api/info", (req: Request, res: Response) => {
      res.json({
        name: "MCP Gemini HTTP Server",
        version: "1.0.0",
        model: config.gemini.model,
        endpoints: [
          "POST /api/generate - 텍스트 생성",
          "POST /api/chat - 대화형 채팅",
          "POST /api/chat/:sessionId - 특정 세션으로 채팅",
          "POST /api/translate - 일본어→한국어 번역",
          "GET /api/models - 사용 가능한 모델 목록",
          "DELETE /api/chat/:sessionId - 채팅 세션 삭제",
          "GET /api/sessions - 활성 세션 목록",
        ],
      });
    });

    // 사용 가능한 모델 목록
    this.app.get("/api/models", async (req: Request, res: Response) => {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${config.geminiApiKey}`
        );

        if (!response.ok) {
          throw new Error(
            `API 오류: ${response.status} ${response.statusText}`
          );
        }

        const data = (await response.json()) as { models: any[] };
        const availableModels: ModelInfo[] = data.models
          .filter((model: any) =>
            model.supportedGenerationMethods?.includes("generateContent")
          )
          .map((model: any) => ({
            name: model.name.replace("models/", ""),
            displayName: model.displayName,
            description: model.description,
            supportedGenerationMethods: model.supportedGenerationMethods,
          }));

        res.json({
          success: true,
          currentModel: config.gemini.model,
          models: availableModels,
        });
      } catch (error) {
        console.error("모델 목록 조회 오류:", error);
        res.status(500).json({
          success: false,
          error: (error as Error).message,
        });
      }
    });

    // 텍스트 생성
    this.app.post("/api/generate", async (req: Request, res: Response) => {
      try {
        const { prompt, temperature } = req.body as GenerateRequestBody;

        if (!prompt) {
          return res.status(400).json({
            success: false,
            error: "prompt는 필수 파라미터입니다",
          });
        }

        if (temperature !== undefined && (temperature < 0 || temperature > 2)) {
          return res.status(400).json({
            success: false,
            error: "temperature는 0.0 ~ 2.0 사이의 값이어야 합니다",
          });
        }

        const startTime = Date.now();
        const text = await this.geminiClient.generateText(prompt, {
          temperature,
        });
        const duration = Date.now() - startTime;

        console.error(`텍스트 생성 완료: ${duration}ms, ${text.length}자`);

        res.json({
          success: true,
          text,
          metadata: {
            promptLength: prompt.length,
            responseLength: text.length,
            duration: `${duration}ms`,
            model: config.gemini.model,
            temperature: temperature || config.gemini.temperature,
          },
        });
      } catch (error) {
        console.error("텍스트 생성 오류:", error);
        res.status(500).json({
          success: false,
          error: (error as Error).message,
        });
      }
    });

    // 대화형 채팅 (기본 세션)
    this.app.post("/api/chat", async (req: Request, res: Response) => {
      return this.handleChat(req, res, "default");
    });

    // 특정 세션으로 채팅
    this.app.post(
      "/api/chat/:sessionId",
      async (req: Request, res: Response) => {
        return this.handleChat(req, res, req.params.sessionId);
      }
    );

    // 일본어→한국어 번역
    this.app.post("/api/translate", async (req: Request, res: Response) => {
      try {
        const { text } = req.body as TranslateRequestBody;

        if (!text) {
          return res.status(400).json({
            success: false,
            error: "text는 필수 파라미터입니다",
          });
        }

        const startTime = Date.now();
        const prompt = `다음 일본어 텍스트를 자연스러운 한국어로 번역해주세요. 번역문만 출력하고 다른 설명은 하지 마세요:\n\n${text}`;

        const translation = await this.geminiClient.generateText(prompt, {
          temperature: 0.3, // 정확한 번역을 위해 낮은 온도
        });
        const duration = Date.now() - startTime;

        console.error(
          `번역 완료: ${duration}ms, ${text.length}자 → ${translation.length}자`
        );

        res.json({
          success: true,
          original: text,
          translation,
          metadata: {
            originalLength: text.length,
            translationLength: translation.length,
            duration: `${duration}ms`,
            model: config.gemini.model,
            sourceLanguage: "ja",
            targetLanguage: "ko",
          },
        });
      } catch (error) {
        console.error("번역 오류:", error);
        res.status(500).json({
          success: false,
          error: (error as Error).message,
        });
      }
    });

    // 채팅 세션 삭제
    this.app.delete("/api/chat/:sessionId", (req: Request, res: Response) => {
      const sessionId = req.params.sessionId;

      if (this.chatSessions.has(sessionId)) {
        this.chatSessions.delete(sessionId);
        console.error(`채팅 세션 삭제: ${sessionId}`);
        res.json({
          success: true,
          message: `세션 ${sessionId}가 삭제되었습니다`,
        });
      } else {
        res.status(404).json({
          success: false,
          error: `세션 ${sessionId}를 찾을 수 없습니다`,
        });
      }
    });

    // 활성 세션 목록
    this.app.get("/api/sessions", (req: Request, res: Response) => {
      const sessions = Array.from(this.chatSessions.keys()).map(
        (sessionId) => ({
          sessionId,
          createdAt: this.chatSessions.get(sessionId)!.createdAt,
        })
      );

      res.json({
        success: true,
        sessions,
        count: sessions.length,
      });
    });

    // 404 핸들러
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      res.status(404).json({
        success: false,
        error: "엔드포인트를 찾을 수 없습니다",
        availableEndpoints: [
          "GET /health",
          "GET /api/info",
          "POST /api/generate",
          "POST /api/chat",
          "POST /api/chat/:sessionId",
          "POST /api/translate",
          "DELETE /api/chat/:sessionId",
          "GET /api/sessions",
        ],
      });
    });

    // 에러 핸들러
    this.app.use(
      (error: Error, req: Request, res: Response, next: NextFunction) => {
        console.error("서버 오류:", error);
        res.status(500).json({
          success: false,
          error: "Internal Server Error",
        });
      }
    );
  }

  /**
   * 채팅 요청 처리
   * @param req - Express 요청 객체
   * @param res - Express 응답 객체
   * @param sessionId - 세션 ID
   */
  private async handleChat(
    req: Request,
    res: Response,
    sessionId: string
  ): Promise<void> {
    try {
      const { message } = req.body as ChatRequestBody;

      if (!message) {
        res.status(400).json({
          success: false,
          error: "message는 필수 파라미터입니다",
        });
        return;
      }

      // 세션이 없으면 새로 생성
      if (!this.chatSessions.has(sessionId)) {
        const chat = this.geminiClient.startChat();
        this.chatSessions.set(sessionId, {
          chat,
          createdAt: new Date().toISOString(),
          messageCount: 0,
        });
        console.error(`새 채팅 세션 생성: ${sessionId}`);
      }

      const session = this.chatSessions.get(sessionId)!;
      const startTime = Date.now();

      const result = await session.chat.sendMessage(message);
      const response = result.response.text();
      const duration = Date.now() - startTime;

      session.messageCount++;

      console.error(
        `채팅 응답 완료 [${sessionId}]: ${duration}ms, ${response.length}자`
      );

      res.json({
        success: true,
        response,
        metadata: {
          sessionId,
          messageCount: session.messageCount,
          messageLength: message.length,
          responseLength: response.length,
          duration: `${duration}ms`,
          model: config.gemini.model,
          createdAt: session.createdAt,
        },
      });
    } catch (error) {
      console.error(`채팅 오류 [${sessionId}]:`, error);
      res.status(500).json({
        success: false,
        error: (error as Error).message,
      });
    }
  }

  /**
   * 서버 시작
   * @param port - 포트 번호
   */
  start(port: number = 3000): Promise<void> {
    return new Promise((resolve) => {
      this.server = this.app.listen(port, () => {
        console.error(
          `🚀 MCP Gemini HTTP 서버가 http://localhost:${port}에서 실행 중입니다`
        );
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
      console.error("HTTP 서버가 종료되었습니다");
    }
  }
}

/**
 * 메인 함수
 */
async function main(): Promise<void> {
  try {
    // 설정 검증
    validateConfig();

    // Gemini 클라이언트 초기화
    const geminiClient = new GeminiClient(config.geminiApiKey!);

    // HTTP 서버 초기화 및 실행
    const httpServer = new HTTPServer(geminiClient);

    const port = parseInt(process.env.PORT || "3000", 10);
    await httpServer.start(port);

    // 우아한 종료 처리
    process.on("SIGINT", () => {
      console.error("종료 신호 수신...");
      httpServer.stop();
      process.exit(0);
    });

    process.on("SIGTERM", () => {
      console.error("종료 신호 수신...");
      httpServer.stop();
      process.exit(0);
    });
  } catch (error) {
    console.error("서버 시작 실패:", error);
    process.exit(1);
  }
}

// 직접 실행 시에만 서버 시작
if (
  import.meta.url.endsWith("http-server.ts") ||
  import.meta.url.endsWith("http-server.js")
) {
  main();
}

export { HTTPServer };
