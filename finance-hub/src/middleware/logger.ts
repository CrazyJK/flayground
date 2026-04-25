import fs from 'fs';
import morgan from 'morgan';
import path from 'path';
import { config } from '../config.js';

/**
 * 파일 로깅 미들웨어.
 * 기동 시 기존 access.log를 삭제하고 새로 기록한다.
 */
export function createFileLogger() {
  if (!fs.existsSync(config.logDir)) {
    fs.mkdirSync(config.logDir, { recursive: true });
  }

  const logFile = path.join(config.logDir, 'access.log');
  if (fs.existsSync(logFile)) {
    fs.unlinkSync(logFile);
  }

  const accessLogStream = fs.createWriteStream(logFile, { flags: 'a' });
  return morgan('combined', { stream: accessLogStream });
}
