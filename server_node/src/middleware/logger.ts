import fs from 'fs';
import morgan from 'morgan';
import path from 'path';

/**
 * 콘솔 로깅 미들웨어 (개발용)
 */
export const consoleLogger = morgan('dev');

/**
 * 파일 로깅 미들웨어 (운영용).
 * logs/ 디렉토리에 access.log를 기록한다.
 */
export function createFileLogger() {
  const logDir = path.resolve(__dirname, '..', '..', 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const accessLogStream = fs.createWriteStream(path.join(logDir, 'access.log'), { flags: 'a' });
  return morgan('combined', { stream: accessLogStream });
}
