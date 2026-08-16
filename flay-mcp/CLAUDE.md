# flay-mcp — 지침

Google Gemini · GitHub Models · 로컬 Ollama 를 통합하는 MCP(Model Context Protocol) AI 라우터 서버(package name `mcp-nexus`). Shuffle Bag 방식 로드 밸런싱으로 요청을 분산한다. `flay-web/frontend` 의 `src/ai/` 가 HTTP 로 호출한다.

## 기술 스택

- **런타임**: Node.js, TypeScript (tsup 빌드)
- **AI 제공자**: Google Gemini, GitHub Models (OpenAI 호환 API), 로컬 Ollama(flay-ai 와 공유 — 메인 사용자인 flay-ai 의 작업을 방해하지 않도록 best-effort 게이트)
- **프로토콜**: MCP(stdio), HTTP(Express, `:3002`)

## 디렉토리 구조

```
src/
├── config.ts         # 환경 변수 및 모델 설정
├── index.ts          # MCP stdio 서버 진입점
├── http-server.ts    # HTTP 서버 진입점 (인증서는 루트 ../../.cert)
├── mcp-server.ts     # MCP 서버 구현
├── model-router.ts   # Shuffle Bag 로드 밸런서
└── providers/        # AI 제공자 클라이언트 (Gemini, GitHub Models, local)
```

## 환경 변수 (`.env`, gitignore)

```env
GEMINI_API_KEY=...
GITHUB_TOKEN=...
```

## 데이터 파일 (항상 `flay-mcp/` 기준)

| 파일 | 설명 |
| --- | --- |
| `data/model-stats.json` | 모델별 호출 통계 (gitignore) |
| `logs/mcp-nexus.log` | 실행 로그 |

## 스크립트

```bash
yarn dev           # HTTP 서버 개발 모드
yarn dev:stdio     # MCP stdio 개발 모드
yarn build         # tsup 프로덕션 빌드
yarn start         # HTTP 서버 실행
yarn start:stdio   # MCP stdio 서버 실행
```
