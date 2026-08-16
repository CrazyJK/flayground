# bin/ai — flay-ai 운영 프로세스 제어 스크립트

flayAI 프로세스별 **운영 모드** `.ps1` 1개씩. 공용 로직은 `bin/common.ps1`(컴포넌트 표·빌드·기동·중지·상태) 에 있고 각 스크립트는 이를 dot-source 한다. 어디서 실행해도 저장소 루트 기준으로 동작. 전체 일괄 기동은 `bin\flay.ps1`(web·mcp 포함). 개발 모드(uvicorn `--reload`, `next dev`)는 `.vscode/launch.json` 또는 클로드 인앱 절차로 띄우며 여기엔 없다.

## 구성

| 파일       | 대상                       | 포트   | 진입점                                         |
|------------|----------------------------|--------|------------------------------------------------|
| api.ps1    | FastAPI / uvicorn (no-reload) | 8000 | `apps.api.main:app` (Python, .venv)            |
| web.ps1    | Next.js 운영 서버          | 3000   | `apps/web`: `yarn install` → `yarn build` → `node server.js` |
| qdrant.ps1 | Qdrant 벡터 DB (Docker)    | 6333   | `docker compose up -d qdrant` (flayai-qdrant)  |
| ollama.ps1 | 로컬 LLM 서버              | 11434  | `ollama serve`                                 |
| reindex.ps1| 인덱싱 파이프라인 (CLI 묶음)| -      | `packages.indexer.cli` 의 load/scan/.../ocr-posters |
| ../backup/backup-tier1.ps1 | 데이터 백업 1단계 (일간) | -  | SQLite+일기자산+개인 오버라이드 → `J:\Backup\flayAI\tier1` |
| ../backup/backup-tier2.ps1 | 데이터 백업 2단계 (주간) | -  | Qdrant 풀 스냅샷(API) → `J:\Backup\flayAI\tier2` |

## 사용법

```powershell
bin\ai\api.ps1      <start|stop|restart|status>
bin\ai\web.ps1      <start|stop|restart|status> [-SkipBuild]
bin\ai\qdrant.ps1   <start|stop|restart|status>
bin\ai\ollama.ps1   <start|stop|restart|status>
bin\ai\reindex.ps1  <quick|sync|full|clean> [apply]
```

cmd.exe 에서는 `powershell -NoProfile -File bin\ai\api.ps1 start`.

예시:
```powershell
bin\ai\api.ps1 restart          # API 만 재시작
bin\ai\web.ps1 restart          # 프론트 재빌드 + 재기동 (-SkipBuild 로 빌드 생략)
bin\ai\api.ps1 status           # 포트 + 헬스 코드
bin\ai\reindex.ps1 quick        # K:\Crazy\* 변경 후 메타만 빠르게 반영
bin\ai\reindex.ps1 sync         # 일상 동기화 (텍스트 AI 포함)
bin\ai\reindex.ps1 full         # 야간 풀 인덱싱 (이미지/얼굴/OCR 포함)
bin\ai\reindex.ps1 clean        # 고아 dry-run (개수 확인)
bin\ai\reindex.ps1 clean apply  # 고아 실제 삭제
```

### reindex 모드

| 모드  | 단계                                                                            | 용도                |
|-------|---------------------------------------------------------------------------------|---------------------|
| quick | load → scan → history → fts → **sync-payload**                                  | 메타만, AI 없음     |
| sync  | quick + translate + embed → **sync-payload**                                    | 일상 텍스트 동기화  |
| full  | sync + embed-clip + extract-faces + cluster-faces + ocr-posters → **sync-payload** | 야간/주말 풀 인덱싱 |
| clean | cleanup (`apply` 인자 없으면 dry-run, 있으면 실제 삭제)                         | 고아 row/포인트 정리|

각 단계는 incremental 이라 이미 처리한 건 자동 skip. 단계별 소요 시간을 출력하고 첫 실패에서 중단한다.

- **sync-payload**: SQLite 의 `kind`(instance/archive) / `playable` 가 바뀌면
  벡터 재계산 없이 Qdrant 4 컬렉션 payload 만 갱신 (변경분만).
- **clean**: ① 파일이 사라진 포스터, ② `video.json` 원본에서 사라진 videos,
  ③ Qdrant 만 단독으로 남은 opus 를 탐지. 기본은 dry-run 으로 개수만 보고,
  `bin\ai\reindex.ps1 clean apply` 로 실제 삭제 (SQLite + Qdrant 모두).

## 백업 (backup-tier1/2.ps1)

작업 스케줄러에 등록되어 자동 실행된다(놓친 실행은 다음 부팅 후 보충, `StartWhenAvailable`).

| 작업 | 일정 | 대상 | 보관 |
|------|------|------|------|
| flayAI Backup Tier1 | 매일 03:30 | `flay.db`(VACUUM INTO 온라인 백업) + `data/diary_assets` + `state.json` + gitignore 개인 파일(.cert, diary_prompts.yaml, favicon 등) → zip | 최근 14개 |
| flayAI Backup Tier2 | 일요일 04:00 | Qdrant 풀 스냅샷 — POST `/snapshots` 후 다운로드 API 로 수신(도커 네임드 볼륨이라 파일 직접 접근 불가), 서버측 스냅샷은 삭제 | 최근 4개 |

- 로그: `J:\Backup\flayAI\backup.log`
- 수동 실행: `powershell -NoProfile -File bin\backup\backup-tier1.ps1` (tier2 동일)
- Tier2 는 Qdrant(도커)가 떠 있어야 한다 — 내려가 있으면 실패로 기록되고 다음 주기에 재시도.
- 복원: Tier1 은 zip 을 풀어 원위치, Qdrant 는 `--storage-snapshot <파일>` 로 기동하거나 스냅샷 업로드 API 사용.

## 동작 규칙

- **start**: 포트가 이미 LISTEN 이면 skip. `web` 은 먼저 `yarn install` → `yarn build`(출력 `flay-ai\logs\build.log`, 실패 시 중단; `-SkipBuild` 면 기존 `.next` 사용). 그다음 새 창 없이 **현재 터미널의 백그라운드**로 띄우고 stdout 을 `flay-ai\logs\{ollama,api,web}.log` 에 쓴다. 포트가 열릴 때까지 `[....] waiting Ns` 로 대기하다 `[ OK ] built Ns, up in N.Ns pid P health 200` 을 찍는다.
- **stop**: 포트 LISTEN PID → `taskkill /F /T`. `qdrant` 만 `docker compose stop` (데이터 보존).
- **restart**: stop → 3초 대기 → start(빌드 포함).
- **status**: 컴포넌트별 `[ UP ] pid health` / `[DOWN]`, qdrant 는 docker 상태 병기.
- 전체 일괄(qdrant → ollama → api → web 순, 종료 역순)은 `bin\flay.ps1` 이 web·mcp 와 함께 처리한다.

## 주의

- **Docker Desktop** 실행 중이어야 qdrant 동작.
- **Node/yarn** PATH 필요 (web).
- **Ollama** 트레이 앱이 자동 재기동하는 경우 트레이 아이콘에서 Quit 필요.
- 백그라운드 프로세스는 이 스크립트를 실행한 터미널을 닫으면 함께 종료된다.
- 각 프로세스 로그는 자체 기록 (`flay-ai/logs/`).
