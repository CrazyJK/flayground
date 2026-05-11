# mcp-nexus — Claude 지침

Google Gemini 및 GitHub Models를 통합하는 MCP(Model Context Protocol) AI 라우터 서버.
Shuffle Bag 방식 로드 밸런싱으로 요청을 분산한다.

## 기술 스택

- **런타임**: Node.js, TypeScript (tsup 빌드)
- **AI 제공자**: Google Gemini, GitHub Models (OpenAI 호환 API)
- **프로토콜**: MCP(stdio), HTTP(Express)

## 디렉토리 구조

```
src/
├── config.ts         # 환경 변수 및 모델 설정
├── index.ts          # MCP stdio 서버 진입점
├── http-server.ts    # HTTP 서버 진입점
├── mcp-server.ts     # MCP 서버 구현
├── model-router.ts   # Shuffle Bag 로드 밸런서
└── providers/        # AI 제공자 클라이언트 (Gemini, GitHub Models)
```

## 환경 변수 (`.env`)

```env
GEMINI_API_KEY=...
GITHUB_TOKEN=...
```

## 데이터 파일 (항상 `mcp-nexus/` 기준)

| 파일 | 설명 |
|------|------|
| `data/model-stats.json` | 모델별 호출 통계 |

## 스크립트

```bash
yarn dev           # HTTP 서버 개발 모드
yarn dev:stdio     # MCP stdio 개발 모드
yarn build         # tsup 프로덕션 빌드
yarn start         # HTTP 서버 실행
yarn start:stdio   # MCP stdio 서버 실행
```
