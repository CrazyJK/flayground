import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import { config } from './config.js';
import { errorHandler } from './middleware/error-handler.js';
import { createFileLogger } from './middleware/logger.js';
import accountRoutes from './routes/account.routes.js';
import healthRoutes from './routes/health.routes.js';

/**
 * Express 앱을 생성하고 미들웨어, 라우트를 등록한다.
 */
function createApp(): express.Application {
  const app = express();

  // CORS: 허용된 출처만 접근 가능
  app.use(
    cors({
      origin: config.cors.origins,
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // JSON 바디 파서
  app.use(express.json());

  // 콘솔 로거 (개발 환경)
  app.use(morgan('dev'));

  // 파일 로거
  app.use(createFileLogger());

  // 라우트
  app.use('/api/health', healthRoutes);
  app.use('/api/accounts', accountRoutes);
  // ConnectedID 생성 라우트는 account.routes에 포함 (/api/auth/connected-id)
  app.use('/api', accountRoutes);

  // 글로벌 에러 핸들러
  app.use(errorHandler);

  return app;
}

/**
 * 서버를 기동한다.
 */
async function main(): Promise<void> {
  const app = createApp();

  app.listen(config.port, () => {
    console.info(`[finance-hub] 서버 기동 완료: http://localhost:${config.port}`);
    console.info(`[finance-hub] 환경: ${config.codef.env} | 기관: 미래에셋증권(${config.mirae.organization})`);
  });
}

main().catch((err) => {
  console.error('[finance-hub] 서버 기동 실패:', err);
  process.exit(1);
});
