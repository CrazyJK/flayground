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

## Gemini API 무료 한도 주의

- 무료 티어는 **프로젝트·모델별 일일 요청 한도**가 있다: `gemini-2.5-flash` **20/일**(RPM 5), `gemma-4-26b-a4b-it` **14,400/일**(RPM 30). 그래서 Gemini 제공자 모델 목록에 Gemma 4 를 함께 둔다(같은 키·같은 SDK). 사용량은 [aistudio.google.com/rate-limit](https://aistudio.google.com/rate-limit).
- 기동 시 검증(`GeminiProvider.validateAccess`)은 `generateContent` 가 아니라 **모델 메타 조회(`GET models/{model}`)** 로 한다 — 생성 한도를 소모하지 않으므로 재기동을 반복해도 한도가 줄지 않는다. 검증에 `generateContent` 를 다시 쓰지 말 것.
- Gemma 계열은 기본으로 사고 과정(thinking)을 만들어 응답 파트에 `thought: true` 로 섞어 보내고 출력 토큰을 소모한다 → `generationConfigFor()` 가 `thinkingConfig.thinkingLevel='minimal'` 로 끄고(gemini-2.5-* 는 이 옵션 미지원이라 기본값), `answerText()` 가 사고 파트를 걸러 본문만 돌려준다. `response.text()` 를 직접 쓰지 말 것.

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
