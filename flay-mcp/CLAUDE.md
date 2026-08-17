# flay-mcp — 지침

Google Gemini · 외부 OpenAI 호환 API(OpenRouter 등) · 로컬 Ollama 를 통합하는 MCP(Model Context Protocol) AI 라우터 서버(package name `mcp-nexus`). Shuffle Bag 방식 로드 밸런싱으로 요청을 분산한다. `flay-web/frontend` 의 `src/ai/` 가 HTTP 로 호출한다.

## 기술 스택

- **런타임**: Node.js, TypeScript (tsup 빌드)
- **AI 제공자**: Google Gemini, 외부 OpenAI 호환 API(OpenRouter 등 — OpenAI SDK 에 `baseURL`·`apiKey` 만 바꿔 사용, 엔드포인트·키·모델 목록은 `.env` `OPENAI_COMPAT_*`), 로컬 Ollama(flay-ai 와 공유 — 메인 사용자인 flay-ai 의 작업을 방해하지 않도록 best-effort 게이트)
- **프로토콜**: MCP(stdio), HTTP(Express, `:3002`)

## 디렉토리 구조

```
src/
├── config.ts         # 환경 변수 및 모델 설정
├── index.ts          # MCP stdio 서버 진입점
├── http-server.ts    # HTTP 서버 진입점 (인증서는 루트 ../../.cert)
├── mcp-server.ts     # MCP 서버 구현
├── model-router.ts   # Shuffle Bag 로드 밸런서
└── providers/        # AI 제공자 클라이언트 (gemini-provider, openai-compat-provider, local-provider)
```

## 환경 변수 (`.env`, gitignore)

```env
GEMINI_API_KEY=...
OPENAI_COMPAT_BASE_URL=https://openrouter.ai/api/v1   # 외부 OpenAI 호환 API — 세 값이 모두 있어야 활성화
OPENAI_COMPAT_API_KEY=...
OPENAI_COMPAT_MODELS=nvidia/nemotron-3-super-120b-a12b:free,...   # 쉼표 구분, 서비스 표기 그대로, 첫 항목으로 기동 시 검증
LOCAL_AI_ENDPOINT=http://127.0.0.1:11434/v1
```

제공자 ID 는 `gemini | openai | local` (`config.ts` `ProviderId`). 셔플 백은 기동 시 검증에 성공한 제공자의 모델만 담는다. `.env` 를 바꾸면 dev 서버(tsx watch)는 자동 반영되지 않으므로 재기동한다.

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
