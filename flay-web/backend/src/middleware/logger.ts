import fs from 'fs';
import morgan from 'morgan';
import path from 'path';

/**
 * 파일 로깅 미들웨어.
 * 기동 시 기존 access.log를 삭제하고 새로 기록한다.
 */
export function createFileLogger() {
  const logDir = path.resolve(process.cwd(), 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const logFile = path.join(logDir, 'access.log');
  if (fs.existsSync(logFile)) {
    fs.unlinkSync(logFile);
  }

  const accessLogStream = fs.createWriteStream(logFile, { flags: 'a' });
  return morgan('combined', { stream: accessLogStream });
}
