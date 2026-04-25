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

/** 선택 환경변수. 값이 없으면 빈 문자열을 반환한다. */
function optionalEnv(key: string): string {
  return process.env[key] ?? '';
}

type CodefEnv = 'sandbox' | 'demo' | 'production';

const codefEnv = (process.env['CODEF_ENV'] ?? 'sandbox') as CodefEnv;

/** CODEF_ENV에 따라 환경별 자격증명 키 접두사를 반환한다. */
function envPrefix(env: CodefEnv): string {
  if (env === 'production') return 'CODEF_PROD';
  if (env === 'demo') return 'CODEF_DEMO';
  return 'CODEF_SANDBOX';
}

const prefix = envPrefix(codefEnv);

/**
 * finance-hub 서버 설정
 */
export const config = {
  port: Number(process.env['PORT'] ?? 4000),

  codef: {
    clientId: requireEnv(`${prefix}_CLIENT_ID`),
    clientSecret: requireEnv(`${prefix}_CLIENT_SECRET`),
    publicKey: requireEnv('CODEF_PUBLIC_KEY'),
    /** sandbox: 샌드박스, demo: 개발용, production: 정식 엔드포인트 */
    env: codefEnv,
    /** 환경에 따른 API 베이스 URL */
    get apiBaseUrl(): string {
      if (this.env === 'production') return 'https://api.codef.io';
      if (this.env === 'demo') return 'https://development.codef.io';
      return 'https://sandbox.codef.io'; // sandbox
    },
    oauthUrl: 'https://oauth.codef.io/oauth/token',
    connectedId: optionalEnv(`${prefix}_CONNECTED_ID`),
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
