import { NextFunction, Request, Response } from 'express';

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

  // 계좌비밀번호 등 민감 정보는 로그에 출력하지 않는다
  console.error(`[ERROR] ${req.method} ${req.path} - ${status} ${message}`);

  res.status(status).json({
    status,
    message,
    path: req.path,
    timestamp: new Date().toISOString(),
  });
}
