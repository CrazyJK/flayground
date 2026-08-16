---
name: ai-restart-services
description: 'flay-ai 서비스 재시작 판단. Use when: flay-ai 코드(apps/api, packages, config.yaml, apps/web)를 수정한 뒤 어떤 프로세스를 재시작해야 하는지 판단하고 명령을 제시하거나 실행할 때'
---

# flay-ai 서비스 재시작

FastAPI 는 `--reload` 를 쓰지 않으므로(torch 무거운 import·WatchFiles·워커 고아 소켓 문제) 수동 재시작이 필요하다.

## 무엇을 재시작할지

방금 변경한 파일 경로를 보고 판단한다:

| 변경 영역 | 재시작 |
| --- | --- |
| `flay-ai/apps/api/**`, `flay-ai/packages/**`, `flay-ai/config.yaml` | API — 별도 창: `bin\ai\api.bat restart` / 인앱: 8000 포트 PID `taskkill /F` 후 uvicorn 재기동 |
| `flay-ai/apps/web/**` (개발 모드) | dev 서버는 핫리로드 — 보통 불필요. `next.config`/의존성 변경 시 `bin\ai\web.bat restart` |
| `flay-ai/apps/web/**` (운영 빌드) | `bin\ai\prod.bat` (재빌드) |
| `flay-ai/docker-compose.yml` (Qdrant) | `bin\ai\qdrant.bat restart` |
| 전체 | `bin\ai\all.bat restart` |

## 절차

1. 변경 파일 목록 확인(`git status` / 방금 편집한 경로).
2. 위 표로 최소 범위의 재시작 대상 결정. 여러 백엔드 변경은 모아서 재시작 1회로.
3. 명령을 제시하거나(사용자 요청 시) 실행. 선행 프로세스(Qdrant/Ollama) 기동 여부도 함께 안내.
4. 확인: `bin\ai\all.bat status`, `Invoke-RestMethod https://ai.kamoru.jk:8000/healthz` (API 는 HTTPS).

인앱 uvicorn 재기동 명령(cwd `flay-ai/`):

```
.venv\Scripts\python.exe -m uvicorn apps.api.main:app --host ai.kamoru.jk --port 8000 --ssl-keyfile ../.cert/kamoru.jk.key --ssl-certfile ../.cert/kamoru.jk.pem
```
