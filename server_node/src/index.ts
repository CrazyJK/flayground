import cors from 'cors';
import express from 'express';
import fs from 'fs';
import https from 'https';
import path from 'path';

import { config } from './config';
import { errorHandler } from './middleware/error-handler';
import { createFileLogger } from './middleware/logger';
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
import crawlingRoutes from './routes/crawling.routes';
import diaryRoutes from './routes/diary.routes';
import downloadRoutes from './routes/download.routes';
import flayArchiveRoutes from './routes/flay-archive.routes';
import flayRoutes from './routes/flay.routes';
import groundRoutes from './routes/ground.routes';
import historyRoutes from './routes/history.routes';
import imageRoutes from './routes/image.routes';
import memoRoutes from './routes/memo.routes';
import pushRoutes from './routes/push.routes';
import sseRoutes from './routes/sse.routes';
import staticFileRoutes from './routes/static-file.routes';
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
  app.use(createFileLogger());

  // 정적 파일 서빙
  const wwwDistPath = path.resolve(__dirname, '..', '..', 'www', 'dist');
  const wwwPublicPath = path.resolve(__dirname, '..', '..', 'www', 'public');

  // 루트 정적 파일 (index.html, manifest.webmanifest, service-worker.js 등)
  if (fs.existsSync(wwwPublicPath)) {
    app.use(express.static(wwwPublicPath));
  }

  // webpack 빌드 결과 (/dist/*)
  if (fs.existsSync(wwwDistPath)) {
    app.use('/dist', express.static(wwwDistPath));
  }

  // API 라우트 등록
  app.use(API_PREFIX, flayRoutes);
  app.use(API_PREFIX, flayArchiveRoutes);
  app.use(API_PREFIX, streamRoutes);
  app.use(API_PREFIX, videoRoutes);
  app.use(API_PREFIX, actressRoutes);
  app.use(API_PREFIX, tagRoutes);
  app.use(API_PREFIX, tagGroupRoutes);
  app.use(API_PREFIX, studioRoutes);
  app.use(API_PREFIX, historyRoutes);
  app.use(API_PREFIX, diaryRoutes);
  app.use(API_PREFIX, imageRoutes);
  app.use(API_PREFIX, staticFileRoutes);
  app.use(API_PREFIX, sseRoutes);
  app.use(API_PREFIX, groundRoutes);
  app.use(API_PREFIX, todayisRoutes);
  app.use(API_PREFIX, batchRoutes);
  app.use(API_PREFIX, memoRoutes);
  app.use(API_PREFIX, attachRoutes);
  app.use(API_PREFIX, crawlingRoutes);
  app.use(API_PREFIX, downloadRoutes);

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
      // HTTPS + TLS (Express 4는 http2 모듈과 호환되지 않으므로 https 사용)
      const server = https.createServer(sslOptions, app);
      server.listen(port, () => {
        console.log(`[Flay Ground] HTTPS 서버 시작: https://flay.kamoru.jk${port === 443 ? '' : ':' + port}`);
        console.log(`[Flay Ground] API: https://flay.kamoru.jk${port === 443 ? '' : ':' + port}${API_PREFIX}`);
      });
    } else {
      // HTTPS (HTTP/1.1)
      const server = https.createServer(sslOptions, app);
      server.listen(port, () => {
        console.log(`[Flay Ground] HTTPS 서버 시작: https://flay.kamoru.jk${port === 443 ? '' : ':' + port}`);
      });
    }
  } else {
    // HTTP 폴백 (인증서 없을 때)
    console.warn('[Flay Ground] 인증서를 찾을 수 없습니다. HTTP 모드로 시작합니다.');
    app.listen(port, () => {
      console.log(`[Flay Ground] HTTP 서버 시작: http://flay.kamoru.jk${port === 80 ? '' : ':' + port}`);
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
