import cors from 'cors';
import express from 'express';
import fs from 'fs';
import http2 from 'http2';
import https from 'https';
import path from 'path';

import { config } from './config';
import { errorHandler } from './middleware/error-handler';
import { consoleLogger, createFileLogger } from './middleware/logger';
import { startDirectoryWatcher } from './services/directory-watcher';
import { initWebPush } from './services/web-push.service';
import { diarySource } from './sources/diary-source';
import { loadAllFlaySources } from './sources/flay-source';
import { historyRepository } from './sources/history-repository';
import { imageSource } from './sources/image-source';
import { loadAllInfoSources } from './sources/info-sources';
import { pushSubscriptionRepo } from './sources/push-subscription-repo';

// 라우트
import actressRoutes from './routes/actress.routes';
import attachRoutes from './routes/attach.routes';
import batchRoutes from './routes/batch.routes';
import candidatesRoutes from './routes/candidates.routes';
import diaryRoutes from './routes/diary.routes';
import flayArchiveRoutes from './routes/flay-archive.routes';
import flayRoutes from './routes/flay.routes';
import groundRoutes from './routes/ground.routes';
import historyRoutes from './routes/history.routes';
import imageRoutes from './routes/image.routes';
import memoRoutes from './routes/memo.routes';
import pushRoutes from './routes/push.routes';
import sseRoutes from './routes/sse.routes';
import streamRoutes from './routes/stream.routes';
import studioRoutes from './routes/studio.routes';
import tagGroupRoutes from './routes/tag-group.routes';
import tagRoutes from './routes/tag.routes';
import todayisRoutes from './routes/todayis.routes';
import videoRoutes from './routes/video.routes';

const API_PREFIX = '/api/v1';

/**
 * Express 앱을 생성하고 미들웨어, 라우트를 등록한다.
 */
function createApp(): express.Application {
  const app = express();

  // 미들웨어
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(consoleLogger);
  app.use(createFileLogger());

  // 정적 파일 서빙 (www/dist)
  const wwwDistPath = path.resolve(__dirname, '..', '..', 'www', 'dist');
  if (fs.existsSync(wwwDistPath)) {
    app.use('/dist', express.static(wwwDistPath));
  }

  // API 라우트 등록
  app.use(API_PREFIX, flayRoutes);
  app.use(API_PREFIX, flayArchiveRoutes);
  app.use(API_PREFIX, videoRoutes);
  app.use(API_PREFIX, actressRoutes);
  app.use(API_PREFIX, tagRoutes);
  app.use(API_PREFIX, tagGroupRoutes);
  app.use(API_PREFIX, studioRoutes);
  app.use(API_PREFIX, historyRoutes);
  app.use(API_PREFIX, diaryRoutes);
  app.use(API_PREFIX, imageRoutes);
  app.use(API_PREFIX, sseRoutes);
  app.use(API_PREFIX, groundRoutes);
  app.use(API_PREFIX, candidatesRoutes);
  app.use(API_PREFIX, streamRoutes);
  app.use(API_PREFIX, todayisRoutes);
  app.use(API_PREFIX, batchRoutes);
  app.use(API_PREFIX, memoRoutes);
  app.use(API_PREFIX, attachRoutes);

  // Push 구독은 별도 prefix (/api/push)
  app.use('/api/push', pushRoutes);

  // 헬스체크
  app.get(`${API_PREFIX}/health`, (_req, res) => {
    res.json({ status: 'UP', timestamp: new Date().toISOString() });
  });

  // 글로벌 에러 핸들러 (라우트 등록 후 마지막에 위치)
  app.use(errorHandler);

  return app;
}

/**
 * HTTPS/HTTP2 서버를 시작한다.
 * 인증서가 없으면 HTTP로 폴백한다.
 */
function startServer(app: express.Application): void {
  const { port, http2: useHttp2 } = config.server;

  const certDir = path.resolve(__dirname, '..', 'cert');
  const keyPath = path.join(certDir, 'kamoru.jk.key');
  const certPath = path.join(certDir, 'kamoru.jk.pem');

  const hasCert = fs.existsSync(keyPath) && fs.existsSync(certPath);

  if (hasCert) {
    const sslOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
      allowHTTP1: true, // HTTP/1.1 폴백 허용
    };

    if (useHttp2) {
      // HTTP/2 + TLS
      const server = http2.createSecureServer(sslOptions, app as any);
      server.listen(port, () => {
        console.log(`[Flay Ground] HTTP/2 서버 시작: https://localhost:${port}`);
        console.log(`[Flay Ground] API: https://localhost:${port}${API_PREFIX}`);
      });
    } else {
      // HTTPS (HTTP/1.1)
      const server = https.createServer(sslOptions, app);
      server.listen(port, () => {
        console.log(`[Flay Ground] HTTPS 서버 시작: https://localhost:${port}`);
      });
    }
  } else {
    // HTTP 폴백 (인증서 없을 때)
    console.warn('[Flay Ground] 인증서를 찾을 수 없습니다. HTTP 모드로 시작합니다.');
    app.listen(port, () => {
      console.log(`[Flay Ground] HTTP 서버 시작: http://localhost:${port}`);
    });
  }
}

// 데이터 소스 로드 + 앱 시작
function bootstrap(): void {
  // 1. Info Sources 로드 (video, actress, tag, studio, tagGroup)
  loadAllInfoSources();

  // 2. History 로드 (CSV)
  historyRepository.load();

  // 3. Flay Sources 로드 (파일시스템 스캔, Info Sources 참조)
  loadAllFlaySources();

  // 4. Diary 로드
  diarySource.load();

  // 5. Image 로드
  imageSource.load();

  // 6. Push Subscription DB 초기화
  pushSubscriptionRepo.init();

  // 7. Web Push 초기화
  initWebPush();

  // 8. Express 앱 생성 및 서버 시작
  const app = createApp();
  startServer(app);

  // 9. 디렉토리 감시 시작
  startDirectoryWatcher();

  // 이미지 변경 감시 (30초마다)
  setInterval(() => imageSource.checkAndReload(), 30_000);
}

bootstrap();
