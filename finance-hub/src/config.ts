import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 필수 환경변수 검증. 값이 없으면 오류를 던진다.
 */
function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`필수 환경변수 누락: ${key}`);
  return value;
}

/**
 * finance-hub 서버 설정
 */
export const config = {
  port: Number(process.env['PORT'] ?? 4000),

  codef: {
    clientId: requireEnv('CODEF_CLIENT_ID'),
    clientSecret: requireEnv('CODEF_CLIENT_SECRET'),
    publicKey: requireEnv('CODEF_PUBLIC_KEY'),
    /** sandbox: 샌드박스, demo: 개발용, production: 정식 엔드포인트 */
    env: (process.env['CODEF_ENV'] ?? 'sandbox') as 'sandbox' | 'demo' | 'production',
    /** 환경에 따른 API 베이스 URL */
    get apiBaseUrl(): string {
      if (this.env === 'production') return 'https://api.codef.io';
      if (this.env === 'demo') return 'https://development.codef.io';
      return 'https://sandbox.codef.io'; // sandbox
    },
    oauthUrl: 'https://oauth.codef.io/oauth/token',
    connectedId: process.env['CODEF_CONNECTED_ID'] ?? '',
  },

  mirae: {
    organization: process.env['MIRAE_ORGANIZATION'] ?? '0238',
    account: requireEnv('MIRAE_ACCOUNT'),
    accountPassword: requireEnv('MIRAE_ACCOUNT_PASSWORD'),
  },

  cors: {
    origins: (process.env['CORS_ORIGINS'] ?? 'http://localhost:8080').split(',').map((s) => s.trim()),
  },

  dataDir: path.resolve(__dirname, '..', 'data'),
  logDir: path.resolve(__dirname, '..', 'logs'),
};
