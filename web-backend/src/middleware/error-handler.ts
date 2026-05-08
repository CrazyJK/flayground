import { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ERROR_PAGE_DIR = path.resolve(__dirname, '..', '..', '..', 'web-frontend', 'public', 'error');

/**
 * API 에러 응답 형식
 */
interface ErrorResponse {
  status: number;
  message: string;
  path: string;
  timestamp: string;
}

/**
 * HTTP 에러를 나타내는 커스텀 에러 클래스
 */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

/**
 * 글로벌 에러 핸들러 미들웨어.
 * 모든 라우트에서 발생한 에러를 잡아 일관된 JSON 응답으로 변환한다.
 */
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  const status = err instanceof HttpError ? err.status : 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[ERROR] ${req.method} ${req.path} - ${status} ${message}`);
  if (status === 500) {
    console.error(err.stack);
  }

  // 브라우저 요청(HTML 수락)인 경우 에러 페이지 HTML 반환
  if (req.accepts('html')) {
    const errorPagePath = path.join(ERROR_PAGE_DIR, `${status}.html`);
    if (fs.existsSync(errorPagePath)) {
      res.status(status).sendFile(errorPagePath);
      return;
    }
  }

  const body: ErrorResponse = {
    status,
    message,
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
  };

  res.status(status).json(body);
}
