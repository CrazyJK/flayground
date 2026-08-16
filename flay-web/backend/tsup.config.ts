import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'dist',
  format: ['esm'],
  target: 'node22',
  platform: 'node',
  // TypeScript 소스를 직접 번들하므로 확장자 생략 import 그대로 동작
  bundle: true,
  // native addon, 무거운 서버 패키지는 번들에서 제외하고 node_modules에서 런타임 로드
  noExternal: [],
  // dependencies는 전부 external (서버는 node_modules를 같이 배포)
  external: ['better-sqlite3', 'archiver', 'cheerio', 'chokidar', 'compression', 'cors', 'csv-parse', 'csv-stringify', 'express', 'mime-types', 'morgan', 'multer', 'open', 'swagger-jsdoc', 'swagger-ui-express', 'web-push'],
  // JSON import 지원 - 번들에 인라인으로 포함
  loader: {
    '.json': 'json',
  },
  // 소스맵 생성
  sourcemap: true,
  // 빌드 전 dist 정리
  clean: true,
});
