import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './config';
import swaggerSchemas from './swagger-schemas.json';

/**
 * Swagger(OpenAPI 3.0) 스펙 옵션을 생성한다.
 * - 도메인 스키마: ts-json-schema-generator로 TypeScript 인터페이스에서 자동 생성 (yarn build:schema)
 * - 라우트 문서: 각 라우트 파일의 JSDoc @openapi 주석에서 수집
 */
const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Flay Ground API',
      version: '1.0.0',
      description: 'Flay Ground Node.js 서버 REST API 문서',
    },
    servers: [
      {
        url: `https://flay.kamoru.jk:{port}/api/v1`,
        description: 'Flay Ground API',
        variables: {
          port: {
            default: String(config.server.port),
          },
        },
      },
      {
        url: '/api/v1',
        description: '상대 경로 (API)',
      },
    ],
    tags: [
      { name: 'Flay', description: 'Flay 관리' },
      { name: 'Archive', description: 'Archive Flay 관리' },
      { name: 'Stream', description: '영상/자막 스트리밍' },
      { name: 'Video', description: 'Video 정보 관리' },
      { name: 'Actress', description: 'Actress 정보 관리' },
      { name: 'Tag', description: 'Tag 관리' },
      { name: 'TagGroup', description: 'TagGroup 관리' },
      { name: 'Studio', description: 'Studio 관리' },
      { name: 'History', description: '이력 조회' },
      { name: 'Diary', description: '일기 관리' },
      { name: 'Image', description: '이미지 관리' },
      { name: 'StaticFile', description: '정적 파일 (커버, 이미지)' },
      { name: 'SSE', description: 'Server-Sent Events' },
      { name: 'Config', description: '서버 설정' },
      { name: 'Todayis', description: 'Today Picks' },
      { name: 'Batch', description: '배치 작업' },
      { name: 'Memo', description: '메모' },
      { name: 'Attach', description: '첨부파일' },
      { name: 'Crawling', description: '크롤링' },
      { name: 'Download', description: 'URL 프록시 다운로드' },
      { name: 'Push', description: 'Web Push 구독' },
    ],
    components: {
      schemas: swaggerSchemas,
    },
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
