---
name: ai-reindex
description: 'flay-ai 재인덱싱. Use when: 원본 데이터(K:\Crazy\* — video.json·포스터)가 바뀌어 SQLite + Qdrant 인덱스를 갱신해야 할 때, 재인덱싱 모드(quick/sync/full/clean) 선택이 필요할 때, 인덱서 단계를 직접 실행할 때'
---

# flay-ai 재인덱싱

원본 `K:\Crazy\*` 가 바뀌었을 때 SQLite + Qdrant 인덱스를 갱신한다. 모든 명령은 저장소 루트 기준(`bin\ai\...`) 또는 `flay-ai/` 를 cwd 로.

## 모드 선택

각 단계는 증분이라 이미 처리된 건 자동 skip. 상황을 확인하고 적절한 모드를 제안한다.

| 모드 | 명령 | 단계 | 용도 |
| --- | --- | --- | --- |
| quick | `bin\ai\reindex.bat quick` | load→scan→history→fts→sync-payload | 메타만, AI 없음, 빠름 |
| sync | `bin\ai\reindex.bat sync` | quick + translate + embed | 일상 텍스트 동기화 |
| full | `bin\ai\reindex.bat full` | sync + embed-clip + extract-faces + cluster-faces + ocr-posters | 야간/주말 풀 인덱싱 (이미지/얼굴/OCR, 수 시간) |
| clean | `bin\ai\reindex.bat clean` | 고아 dry-run (`clean apply` 로 실제 삭제) | 사라진 포스터/영상/Qdrant 고아 정리 |

단계별 직접 실행: `flay-ai/` 에서 `.\.venv\Scripts\python.exe -m packages.indexer.cli <load|scan|...>` (`-n N` 처음 N건, `--rebuild`/`--force` 강제, `-v` 상세).

## 절차

1. 무엇이 바뀌었는지 묻거나 추정 → 모드 추천.
2. 사전 조건 확인: Qdrant(Docker) · (AI 단계면) Ollama 기동 여부 — `bin\ai\all.bat status`. 없으면 `bin\ai\qdrant.bat start` / `bin\ai\ollama.bat start`.
3. 명령 제시 또는 실행(사용자 요청 시). 장시간 작업은 백그라운드로 띄우고 진행을 보고.
4. 진행 확인: `Get-Content flay-ai\data\state.json | ConvertFrom-Json`, `/admin` 대시보드, `flay-ai\logs\<job>.log`.

## 주의

- full 의 ocr-posters 는 CPU 라 20K 포스터에 수 시간 → 야간 권장.
- GPU 12GB: 인덱싱 중 LLM/CLIP/InsightFace 동시 로드 금지(스크립트가 unload 조정).
- 메타(kind/playable)만 바뀌면 벡터 재계산 없이 `sync-payload` 로 충분.
