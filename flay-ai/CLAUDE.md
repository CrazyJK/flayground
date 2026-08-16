# flay-ai — 지침

로컬 비디오 컬렉션(`K:\Crazy\*`)의 메타데이터·포스터를 로컬 LLM 챗봇으로 자연어 검색하는 **완전 로컬** 서브프로젝트. Python 3.11(FastAPI + 인덱서 + RAG) + Next.js 16 프론트. **모든 명령은 `flay-ai/` 를 cwd 로** 실행한다.

동작 설명서: `docs/flay-ai/` ([README](../docs/flay-ai/README.md) · overview · architecture · indexing-pipeline · chat-and-rag · api-reference · dev-guide · admin). 미해결 작업: [docs/flay-ai/TODO.md](../docs/flay-ai/TODO.md). 실제 모델/컬렉션/포트 값은 추정하지 말고 **`config.yaml` 과 코드에서 확인**한다(문서마다 표기가 엇갈릴 수 있음).

## 컴포넌트 및 포트

| 컴포넌트 | 기술 | 포트 |
| --- | --- | --- |
| 백엔드 | FastAPI + uvicorn (`apps/api/`) | 8000 (`https://ai.kamoru.jk:8000`) |
| 프론트 | Next.js 16 + React 19 + Tailwind 4 (`apps/web/`) | 3000 (`https://ai.kamoru.jk:3000`) |
| 벡터 DB | Qdrant (Docker, `docker-compose.yml`) | 6333 |
| LLM | Ollama (`config.yaml.models.*`) | 11434 |
| 관계 DB | SQLite `data/sqlite/flay.db` + FTS5(trigram) | — |

호스팅: 로컬 도메인 `ai.kamoru.jk`(hosts 매핑) + 루트 `../.cert/kamoru.jk.{key,pem}` 자체 서명 **HTTPS**. `config.yaml.server.host`, CORS 화이트리스트, `main.py` 호스트 검증 모두 `127.0.0.1`/`localhost`/`::1`/`ai.kamoru.jk` 만 허용 — 공용 인터넷 노출 금지.

## 아키텍처 (빅 픽처)

원본 데이터 → **인덱서 파이프라인**이 검색 인덱스(데이터 저장소들)를 구축 → **RAG/API** 가 그 위에서 채팅·검색을 서빙 → **웹**이 표시. 두 서브시스템은 데이터 저장소를 통해서만 연결된다.

```
K:\Crazy\Info\*.json,*.csv  +  K:\Crazy\{Storage,Archive}\**.jpg
        │  packages/indexer  (CLI: python -m packages.indexer.cli <stage>)
        ▼
┌─────────────── 데이터 저장소 ───────────────┐
│ SQLite (data/*.db, WAL) + FTS5(trigram)      │  ← 메타·관계·전문검색
│ Qdrant 5 컬렉션:                              │  ← 벡터 검색
│   videos(1024d,bge-m3) posters_clip(768d,CLIP)│
│   faces(512d,InsightFace) poster_ocr(1024d)   │
│   poster_caption(1024d)                       │
│ Ollama: chat LLM + vision(캡션) 모델          │  ← 생성/캡션 (외부 프로세스)
└──────────────────────────────────────────────┘
        │  packages/rag (검색·라우팅)  →  apps/api (FastAPI)
        ▼  apps/web (Next.js)
```

- **인덱서 파이프라인** (`packages/indexer`, 상세 지침 `packages/indexer/CLAUDE.md`): 12단계 순차 실행 `load → scan → history → fts → translate → caption-posters → embed → embed-clip → extract-faces → cluster-faces → ocr-posters → sync-payload`. 순서가 중요(`caption-posters` 가 `embed` 보다 먼저라야 캡션이 videos 임베딩 `[장면]` 블록에 합류). 관리자 일괄 버튼은 **각 단계를 별도 서브프로세스**(`cli <stage>`)로 띄운다(단계 사이 VRAM 해제). 거의 모든 단계가 **증분·멱등**(완료분 skip)이고 SQLite 는 **WAL + 배치 단위 commit** → 중단/강제종료해도 재실행 시 이어진다. 임베딩 단계도 `embed_state(collection,opus,sig)` 시그니처로 증분(`--force` 로 전량). 가변 payload 는 `sync-payload` 가 따로 갱신. 상세: [indexing-pipeline.md](../docs/flay-ai/indexing-pipeline.md).
- **RAG 채팅** (`packages/rag`, 상세 지침 `packages/rag/CLAUDE.md`): **2차 LLM 답변 생성을 쓰지 않는다.** ① 1회 LLM tool-call(라우팅) → ② `router._extract_meta`(정규식 메타 필터) + `_extract_tags`(DB 태그명 복수 사전 매칭, AND) + `_extract_count_tags`(남녀 명수 → 카운트 태그 `M:N`, OR 그룹) 를 `search_videos` args 에 주입 → ③ `retriever.hybrid_search` = Qdrant bge-m3 의미검색 + SQLite FTS5(BM25) → RRF 결합 → ④ `ranker.rank` 가중치 정렬 → ⑤ 코드가 "건수+필터" 한 줄 요약. 결과는 SSE 스트리밍. 상세: [chat-and-rag.md](../docs/flay-ai/chat-and-rag.md).
- **관리자/모니터링** (`apps/api/routers/admin.py`·`admin_events.py` + `apps/web/src/app/admin/page.tsx`): 갱신은 **SSE push** — 프론트가 `GET /api/admin/events` 하나를 구독하면 서버 샘플러가 `monitor`(1초)·`services`(5초/작업중 2초) 이벤트를 push. 샘플러는 구독자 있을 때만 동작. enhance·stabilize·subtitle 도 같은 방식(공용 `apps/api/sse.py` 의 `poll_stream`). 파이프라인 일시정지/재개(`/jobs/{job}/pause|resume`) 지원. 상세: [admin.md](../docs/flay-ai/admin.md).

## 자주 쓰는 명령 (cwd = `flay-ai/`)

```powershell
.\.venv\Scripts\python.exe -m pytest -q                            # 전체 테스트
.\.venv\Scripts\python.exe -m pytest tests/test_rag_ranker.py -q   # 단일 파일
.\.venv\Scripts\python.exe -m pytest -k ranker -q                  # 이름 필터
.\.venv\Scripts\python.exe -m ruff check .                         # 파이썬 린트
.\.venv\Scripts\python.exe -m packages.indexer.cli <stage>         # 인덱서 단계 직접 실행
cd apps\web ; yarn build ; yarn lint                               # 프론트 빌드·린트
```

```cmd
..\bin\ai\prod.bat                          :: 운영 HTTPS 일괄 기동(앱과 독립 유지)
..\bin\ai\all.bat start | status | stop     :: 개발 일괄 제어(별도 창)
..\bin\ai\api.bat restart                   :: API 재시작(별도 콘솔 창)
..\bin\ai\reindex.bat <quick|sync|full|clean>
```

### 인앱 기동 명령·주의 (기동 범위·절차는 `bin/CLAUDE.md` "인앱 개발 모드 기동·중지")

```
.venv\Scripts\python.exe -m uvicorn apps.api.main:app --host ai.kamoru.jk --port 8000 --ssl-keyfile ../.cert/kamoru.jk.key --ssl-certfile ../.cert/kamoru.jk.pem
cd apps/web && yarn dev   # https://ai.kamoru.jk:3000 (hot-reload)
```

- 선행 의존성 qdrant(6333)·ollama(11434)는 먼저 떠 있어야 한다 — 없으면 `bin\ai\qdrant.bat start` / `bin\ai\ollama.bat start`.
- **API 재시작은 수동**: FastAPI 자동 reload 없음 → 코드 변경 시 8000 포트 PID 를 `taskkill /F` 후 다시 띄운다. **`uvicorn --reload` 금지** — torch 무거운 import 로 reload 가 멈추고 WatchFiles 가 편집을 놓치며 워커 고아 소켓으로 포트 정리가 꼬인다(검증됨). 백엔드 변경을 모아 재시작 1회로 최소화. `taskkill /F` 로 끝낸 백그라운드 작업은 'exit 1 실패'로 표시되지만 강제종료 흔적일 뿐이다.
- 포트 정리 시 `Get-NetTCPConnection -LocalPort 8000` 의 OwningProcess 가 죽은 PID 면 자식 워커가 소켓을 상속한 것 — `Win32_Process` 로 자식 python(PPID=그 PID)을 찾아 `taskkill /F`.
- 인앱 프로세스는 클로드 앱 종료/업데이트 시 함께 죽는다 → 독립 유지는 `bin\ai\prod.bat`.
- 프론트 변경의 실제 동작 확인은 브라우저 도구로 `https://ai.kamoru.jk:3000` 을 직접 띄워 확인해도 된다(자체 서명 경고 무시). 불가능할 때만 빌드/lint/HTTP 200 으로 대체하고 시각 확인이 안 됐음을 알린다.

## Python 규칙 (ruff: E,F,W,I,UP / ignore E501, line-length 100)

- 항상 `.\.venv\Scripts\python.exe` 로 실행. 설정은 `packages/settings.py` 의 `load_config()`(lru_cache) 로만 읽고 경로는 `repo_path()` 로 절대화(`REPO_ROOT` = `flay-ai/`). `config.yaml` 값을 코드에 하드코딩하지 말 것.
- `from typing import Iterable | AsyncGenerator` 금지 → `from collections.abc import ...` (UP035). 미사용 import 금지(F401). `.encode("utf-8")` → `.encode()` (UP012). `from __future__ import annotations` 가 있으면 어노테이션에 문자열 리터럴 금지(UP037) — 새 모듈도 이 import 를 둔다. async generator 반환 타입은 `AsyncGenerator[bytes, None]` 처럼 정확히. import 정렬 first-party 는 `apps`, `packages`.
- 타입 어노테이션 권장, `X | None` 표기. DB 접근은 `packages/indexer/db.py` 의 `connect()` (Row factory + WAL + busy_timeout) — 직접 `sqlite3.connect` 금지. 연결은 `try/finally` close.
- AI 관련 변경에는 "무엇을 / 왜 / 어떤 입출력" 을 docstring 또는 주석에 남긴다.

## 핵심 함정

- **GPU 빌드는 uv 설정으로 고정** (NVIDIA + CUDA 12.4 단일 PC 전제): `pyproject.toml [tool.uv]` 가 torch/torchvision 을 cu124 인덱스로, onnxruntime 은 CPU판 제외로 잡아 둠 → `uv sync` 안전. onnxruntime CPU/GPU 는 같은 모듈명이라 공존 불가 — 항상 `onnxruntime-gpu` 만 유지(CPU 가 덮어쓰면 InsightFace 가 CPU 로 떨어짐).
- **OCR** 은 `rapidocr-onnxruntime` (`packages/indexer/ocr.py`). PaddleOCR 계열은 제거됨.
- **Qdrant v1.18+**: `collection.search()` 삭제 → `client.query_points(collection_name, query=vec, limit=N, with_payload=True)`, 결과는 `resp.points`.
- **FTS5(trigram)**: 토큰을 `"phrase"` 로 감싸 `OR` 결합(`packages/rag/retriever.py._fts_query`). 생 키워드는 CJK/짧은 토큰에서 `syntax error near "?"`.
- **Qdrant 포인트 ID**: opus 의 SHA1 앞 8바이트(uint63) — 컬렉션 공통(`embed_text.opus_to_id`). 직접 만들지 말 것.
- **번역 모델**: `facebook/nllb-200-distilled-600M`, `src_lang=jpn_Jpan`, `forced_bos_token_id` → `kor_Hang`.
- **스튜디오 alias**: DB 에 `"S1"` 대신 `"sone"`, `"s1no1style"` 등으로 저장될 수 있음 → alias 없는 필터는 0건.
- **GPU 12GB**: LLM·CLIP·InsightFace 동시 로드 금지. 야간 스크립트가 단계 사이 unload 를 조정.
- 코드 변경 후 FastAPI 는 새 라우터/모듈을 자동 반영하지 않는다 → 재시작 필요. 변경 후 **어떤 프로세스를 재시작할지** 알려준다(`bin\ai\api.bat restart` 등).

## 문서

코드 변경이 문서에 영향을 주면 같은 폴더 README → 없으면 `docs/flay-ai/` 관련 파일을 갱신한다. 새 문서는 함부로 만들지 않는다.

## 반복 절차 스킬 (`.claude/skills/`)

재인덱싱 `ai-reindex` · 서비스 재시작 `ai-restart-services` · RAG 도구 추가 `ai-add-rag-tool` · API 엔드포인트 추가 `ai-add-api-endpoint` · 문서 동기화 점검 `ai-docs-sync-check`. 프론트 디자인 시스템은 `flayai-design`.
