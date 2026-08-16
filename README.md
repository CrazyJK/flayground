# Flay-Ground

로컬 비디오 컬렉션(`K:\Crazy\*`)을 **관리·스트리밍·검색**하는 완전 로컬 개인 프로젝트 모노레포.
성격이 다른 세 컴포넌트가 같은 원본 데이터와 인증서를 공유하면서 독립적으로 동작한다.

| 컴포넌트 | 역할 | 스택 | 서비스 |
| --- | --- | --- | --- |
| [`flay-web/`](#flay-web) | 영화 콘텐츠 관리·스트리밍 웹 (이미지 갤러리·다이어리·금융 노트·Web Push 포함) | Node.js 22 · Express · Webpack + TS Web Components | `https://flay.kamoru.jk` |
| [`flay-mcp/`](#flay-mcp) | MCP AI 라우터 (Gemini / GitHub Models / 로컬 Ollama, Shuffle Bag 로드 밸런싱) | Node.js · TypeScript · Express | `:3002` (HTTP), MCP stdio |
| [`flay-ai/`](#flay-ai) | 로컬 LLM + RAG 자연어 검색, 얼굴·OCR·CLIP 인덱싱, 일기형 대화, 영상 안정화·화질 개선·자막 | Python 3.11 · FastAPI · Qdrant · Ollama · Next.js 16 | `https://ai.kamoru.jk:8000` (API), `:3000` (Web) |

## 저장소 구조

```
flayground/
├── flay-web/            # frontend/ (Webpack+TS) · backend/ (Express) · playwright/ (E2E)
├── flay-mcp/            # MCP AI 라우터
├── flay-ai/             # apps/{api,web} · packages/{indexer,rag,diary,enhancer,stabilizer,subtitler,icogen} · tests · eval
├── bin/                 # 실행·운영 스크립트 — flay.bat(전체) · web/ · ai/ · backup/
├── docs/                # 문서 — plans/·design/(공용) · flay-web/ · flay-ai/
├── .claude/skills/      # Claude Code 스킬
├── .cert/               # kamoru.jk.{key,pem} 자체 서명 인증서 (gitignore, 세 컴포넌트 공유)
├── CLAUDE.md            # AI 지침 (루트 기본 + 각 폴더 CLAUDE.md 상세)
└── LICENSE, .gitignore, .editorconfig, .prettierrc, .eslintrc.js, .markdownlint.json
```

## 시스템 요구사항

- Windows 11, NVIDIA GPU 12GB+ (flay-ai, CUDA 12.4)
- Node.js 22 + **yarn 1.x** (`npm install -g yarn`) — 모든 Node 프로젝트 공통
- Python 3.11 + [uv](https://docs.astral.sh/uv/) (flay-ai, `.venv`)
- Docker Desktop (Qdrant), [Ollama](https://ollama.com/) (flay-ai)
- hosts 매핑: `flay.kamoru.jk`, `ai.kamoru.jk` → 127.0.0.1, 자체 서명 인증서 `.cert/kamoru.jk.{key,pem}`

## 빠른 시작

```cmd
bin\flay.bat start        :: web + mcp + ai 전체 기동
bin\flay.bat status       :: 포트별 상태
bin\flay.bat stop         :: 전체 종료
```

컴포넌트별:

```cmd
bin\web\FlayGroundStartup.bat              :: flay-web: mcp → frontend → backend 빌드 후 mcp·backend 기동
bin\ai\all.bat <start|stop|restart|status> :: flay-ai 개발 일괄 (qdrant → ollama → api → web, 별도 창)
bin\ai\prod.bat [--skip-build]             :: flay-ai 운영 HTTPS 일괄 기동 (단일 터미널 백그라운드)
bin\ai\reindex.bat <quick|sync|full|clean> :: flay-ai 재인덱싱
```

각 Node 프로젝트(`flay-web/frontend`, `flay-web/backend`, `flay-mcp`, `flay-ai/apps/web`)에서 `yarn install` → `yarn dev` / `yarn build` / `yarn start`. 상세는 [`bin/ai/README.md`](bin/ai/README.md), [`docs/flay-ai/dev-guide.md`](docs/flay-ai/dev-guide.md).

---

## flay-web

Express 백엔드가 REST API 와 정적 프론트(`frontend/dist`, `frontend/public`)를 함께 서빙한다.

### frontend

Webpack 5 + TypeScript 멀티 엔트리 SPA, 프레임워크 없이 Web Components. SCSS, ECharts, Toast UI Editor, D3 Hierarchy.

| 명령 | 설명 |
| --- | --- |
| `yarn dev` | 개발 빌드 + 파일 감시 |
| `yarn build` | 프로덕션 빌드 (`dist/`) |
| `yarn type-check` / `yarn lint` / `yarn format` | 타입 검사 / ESLint / Prettier |

주요 모듈: `src/flay/`(핵심), `src/finance/`(금융 노트), `src/image/`, `src/movie/`, `src/pension/`, `src/ai/`(flay-mcp 연동), `src/view/`(페이지 진입점), `src/lib/`(공통 유틸·컴포넌트).

### backend

Express 4 + TypeScript(ESM), `tsx`(개발) / `tsup`(빌드). better-sqlite3(금융 노트·Web Push 구독), HTTP/2 + HTTPS(`:443`).

| 명령 | 설명 |
| --- | --- |
| `yarn dev` | tsx watch 개발 서버 |
| `yarn build` / `yarn start` | tsup 빌드 (`dist/`) / `node dist/index.js` |
| `yarn build:schema` | Swagger 스키마 생성 |

API: `/api/v1/{flay,actress,studio,tag,financial-note,stock-price,stream,push,sse}`. 설정 `config/default.json`, 데이터 `data/*.db`, 로그 `logs/`.

### playwright

E2E 테스트. dev 서버 기동 후 `https://flay.kamoru.jk/dist/page.*.html` 로 접근.

## flay-mcp

Google Gemini · GitHub Models · 로컬 Ollama 를 통합하는 MCP(Model Context Protocol) AI 라우터(package `mcp-nexus`). Shuffle Bag 방식으로 요청을 분산한다.

| 명령 | 설명 |
| --- | --- |
| `yarn dev` / `yarn start` | HTTP 서버 (`:3002`) |
| `yarn dev:stdio` / `yarn start:stdio` | MCP stdio 서버 |
| `yarn build` | tsup 빌드 |

환경 변수 `.env`: `GEMINI_API_KEY`, `GITHUB_TOKEN`. 데이터 `data/model-stats.json`.

## flay-ai

로컬 비디오 컬렉션의 메타데이터·포스터를 로컬 LLM 챗봇으로 자연어 검색한다. 완전 로컬(외부 네트워크 노출 없음).

| 영역 | 기술 |
| --- | --- |
| 백엔드 | Python 3.11 + FastAPI + uvicorn (`apps/api/`, `:8000`) |
| 프론트 | Next.js 16 + React 19 + Tailwind 4 (`apps/web/`, `:3000`) |
| 벡터 DB | Qdrant (Docker, `:6333`) — videos / posters_clip / faces / poster_ocr / poster_caption |
| 관계 DB | SQLite (`data/sqlite/flay.db`) + FTS5(trigram) |
| LLM | Ollama (`config.yaml.models.*`, `:11434`) — 채팅·일기·비전 캡션 |
| 임베딩 | BGE-M3 (1024d), OpenCLIP ViT-L/14 (768d), InsightFace buffalo_l (512d), RapidOCR, NLLB-200 |

디렉토리: `apps/`(API + 웹), `packages/`(indexer · rag · diary · enhancer · stabilizer · subtitler · icogen · settings), `config.yaml`(경로·모델·포트), `data/`(SQLite·Qdrant·잡 산출물, gitignore), `tests/`, `eval/`, `scripts/`(파이썬 진단 스크립트).

```powershell
# cwd = flay-ai/
.\.venv\Scripts\python.exe -m pytest -q                       # 테스트
.\.venv\Scripts\python.exe -m ruff check .                    # 린트
.\.venv\Scripts\python.exe -m packages.indexer.cli <stage>    # 인덱서 단계 직접 실행
cd apps\web ; yarn build ; yarn lint                          # 프론트
```

문서: [`docs/flay-ai/README.md`](docs/flay-ai/README.md) (overview · architecture · indexing-pipeline · chat-and-rag · api-reference · dev-guide · admin · diary · translate-api), 설계 명세 [`docs/flay-ai/AI_PLAN.md`](docs/flay-ai/AI_PLAN.md), 미해결 [`docs/flay-ai/TODO.md`](docs/flay-ai/TODO.md).

---

## 백업 (Windows 작업 스케줄러)

| 작업 | 스크립트 | 주기 |
| --- | --- | --- |
| Flay-Weekly-Backup | `bin\backup\flay-backup.ps1` (flay-web 인스턴스·아카이브 zip) | 주 1회 |
| flayAI Backup Tier1 | `bin\backup\backup-tier1.ps1` (SQLite·일기 자산·private 오버라이드) | 매일 |
| flayAI Backup Tier2 | `bin\backup\backup-tier2.ps1` (Qdrant 스냅샷) | 주 1회 |

등록: `bin\backup\register-schedule.ps1`.

## 문서

- [`docs/plans/`](docs/plans/) — 공용 계획 (모노레포 통합, 데스크톱 셸)
- [`docs/design/`](docs/design/) — 디자인 참고
- [`docs/flay-web/`](docs/flay-web/) — flay-web 문서·계획 (FlayPIP, TODO, codef · financial.note · web-push · dashboard 등)
- [`docs/flay-ai/`](docs/flay-ai/) — flay-ai 동작 설명서·설계·TODO

## 라이선스

MIT — [LICENSE](LICENSE) 참고. 개인 학습·사용 목적 프로젝트.
