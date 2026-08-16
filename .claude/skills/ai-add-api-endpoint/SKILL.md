---
name: ai-add-api-endpoint
description: 'flay-ai FastAPI 엔드포인트 추가. Use when: flay-ai/apps/api 에 새 REST 엔드포인트나 라우터를 추가할 때'
---

# flay-ai API 엔드포인트 추가

`flay-ai/apps/api/` 에 새 엔드포인트를 추가하는 절차. 진입점 `apps/api/main.py`, 라우터 `apps/api/routers/*.py`.

## 체크리스트

1. **위치 결정**
   - 채팅/검색/번역/상세 등 핵심 흐름 → `main.py` 의 `create_app()` 내부.
   - 이미지/얼굴/OCR/관리/잡 등 도메인 묶음 → `apps/api/routers/` 의 `APIRouter` (또는 새 라우터 파일 → `main.create_app()` 에서 `include_router`).
2. **요청/응답 모델** — pydantic `BaseModel` (`main.py` 의 `ChatRequest`/`SearchVideosRequest` 패턴). 응답 영상은 표준 `hit` dict.
3. **DB/검색 재사용** — `packages/indexer/db.connect()`, `packages/rag/*` 의 기존 함수. 새로 만들지 말 것.
4. **보안**
   - 메서드는 GET/POST 만(CORS `allow_methods`).
   - 관리/쓰기 계열은 `_localhost_only(request)` 또는 client IP 검증(127.0.0.1/localhost/::1/ai.kamoru.jk) 추가.
   - 업로드는 `config.yaml.server.upload_max_bytes` + `upload_allowed_extensions` 화이트리스트 준수.
   - LLM 경유 도구는 read-only — 쓰기는 명시적 라우트로 분리.
5. **SSE** — 잡 진행·모니터링은 `apps/api/sse.py` 의 `poll_stream` 패턴(변화 시만 push). SSE 이벤트 타입을 바꾸면 `apps/web` 파서도 함께.
6. **문서/계약** — 변경이 `docs/flay-ai/api-reference.md` 에 영향을 주면 갱신.
7. **테스트 + 재시작** — `flay-ai/tests/` (httpx TestClient), 그 후 API 재시작(스킬 `ai-restart-services`).

## 인증/보안 메모

CORS 화이트리스트 외 origin 차단, 인증은 없음(로컬/`ai.kamoru.jk` HTTPS 전제). 공용 인터넷 노출 금지.
