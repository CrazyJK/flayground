---
name: ai-docs-sync-check
description: 'flay-ai 문서 ↔ 구현 동기화 점검. Use when: docs/flay-ai/*.md · README · CLAUDE.md 가 실제 코드·설정과 어긋난 부분을 정적으로 찾아 보고할 때'
---

# flay-ai 문서 ↔ 구현 동기화 점검

`docs/flay-ai/*.md` / 루트 README / `flay-ai/**/CLAUDE.md` 가 실제 코드·설정과 어긋난 부분을 찾아 보고한다(코드 실행/설치 없이 정적 검토만).

## 점검 포인트

다음 "단일 진실 소스(SoT)" 와 문서를 대조한다(경로는 `flay-ai/` 기준):

| 항목 | SoT (코드/설정) | 문서에서 확인 |
| --- | --- | --- |
| LLM 모델 | `config.yaml.models.llm` | README, docs, 지침 — 7b/14b 혼동 주의 |
| Python 버전 | `.python-version`, `pyproject.toml requires-python` | README, dev-guide |
| 호스트/포트/HTTPS | `config.yaml.server`, `apps/api/main.py`, `apps/web/server.js`, `bin/common.ps1` | "localhost only" 표현 vs `ai.kamoru.jk`+TLS |
| OCR/임베딩/번역/캡션 모델 | `config.yaml.models`, `packages/indexer/*.py` import | architecture, indexing-pipeline |
| 의존성 | `pyproject.toml` / `uv.lock` vs 실제 import | 미선언/미사용 패키지 |
| CLI 커맨드 | `packages/indexer/cli.py`, admin `ALLOWED_JOBS` | indexing-pipeline, admin |
| RAG 도구 | `packages/rag/tools.py` `TOOL_DISPATCH` | chat-and-rag, overview |
| API 엔드포인트 | `apps/api/main.py` + routers | api-reference, admin |
| 스크립트 경로 | `bin/ai/*`, `bin/backup/*` 실제 파일 | dev-guide, README 의 명령 |
| 상대 링크 | 실제 파일 위치 | docs 내부 링크(`docs/flay-ai/` ↔ `flay-ai/` ↔ `bin/`) |
| 절대 경로 | 실제 repo 경로 | dev-guide 의 `cd ...` |

## 절차

1. 위 표의 SoT 를 읽어 사실을 확정.
2. 각 문서를 훑어 어긋난 진술을 모은다.
3. 결과를 보고: 항목 / 문서 위치 / 현재 표기 / 실제 값 / 권장 조치.
4. 코드·설정 변경이 필요한 항목은 `docs/flay-ai/TODO.md` 에 추가/갱신. 문서 문구만 고치면 되는 항목은 해당 문서 수정 제안.

## 원칙

- 사실 확인 없이 추정하지 말 것 — 반드시 SoT 파일을 연다.
- "계획 문서"(`docs/flay-ai/AI_PLAN.md`)는 의도적으로 구현과 다를 수 있음(예: FAISS→Qdrant, PaddleOCR→RapidOCR, opus-mt→NLLB). 차이를 오류로 단정하지 말고 "계획 대비 변경" 으로 구분해 보고.
