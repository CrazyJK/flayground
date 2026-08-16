# bin — 실행·운영 스크립트 지침

Windows 전용. 프로세스 제어, 빌드·기동, 인덱싱·백업 자동화. 실행 스크립트(`.bat`/`.ps1`/`.sh`)는 전부 이 폴더에 둔다(파이썬 개발용 진단 스크립트는 `flay-ai/scripts/` 에 남는다 — `packages` import 때문에 flay-ai cwd 전제).

```
bin/
├── flay.bat                 # 전체(web + mcp + ai) start|stop|status
├── web/FlayGroundStartup.bat|.sh   # flay-web 빌드(mcp → frontend → backend) 후 mcp·backend 백그라운드 기동
├── ai/                      # flay-ai: all/api/web/qdrant/ollama.bat <start|stop|restart>, prod.bat [--skip-build], reindex.bat <quick|sync|full|clean> [apply],
│                            #          bootstrap.ps1(첫 셋업), nightly_index.ps1, nightly_subtitle.ps1, overnight.ps1, README.md
└── backup/                  # flay-backup.ps1(flay-web 주간), backup-tier1.ps1(flay-ai 일일)·backup-tier2.ps1(flay-ai Qdrant 주간)·sqlite_backup.py,
                             # flayai-backup.ps1(SQLite VACUUM + Qdrant snapshot), register-schedule.ps1(작업 스케줄러 등록)
```

## 절대 규칙 — 인코딩

- **`.bat`·`.cmd` 파일에는 비ASCII 문자 금지**(주석 포함 영어). Windows CP949 콘솔에서 한글이 파싱 오류를 일으킨다. 줄 끝은 **CRLF**. UTF-8 출력이 필요하면 상단에 `chcp 65001 >nul`.
- `.ps1` 은 LF. 새로 쓰는 `.ps1` 도 ASCII 로 작성한다(기존 한국어 주석 파일은 그대로 둔다).
- PowerShell 은 **5.1** — `??`, 삼항, `&&` 미지원.

## 경로 계산

- 스크립트는 어디서 실행하든 자기 위치 기준으로 대상 폴더를 찾는다. 저장소 루트는 `%~dp0..\..`(bat, `bin/<그룹>/` 기준) / `Split-Path -Parent (Split-Path -Parent $PSScriptRoot)`(ps1).
  - `bin/ai/*` 와 `bin/backup/backup-tier*` 는 `<루트>\flay-ai` 를 작업 디렉토리로 `pushd`/`Set-Location` 한다.
  - `bin/web/*` 는 `<루트>\flay-web\{frontend,backend}`, `<루트>\flay-mcp` 로 이동한다.
- Python 호출은 항상 `<루트>\flay-ai\.venv\Scripts\python.exe` (PATH 의 `python`/`uv run` 금지). 인증서는 `<루트>\.cert\` (flay-ai cwd 기준 `..\.cert\`).
- PowerShell 에서 `python -c "(name)..."` 는 `(name)` 을 cmdlet 으로 파싱 → single-quote 또는 `.py` 파일로.

## bin/ai 프로세스 제어

| 파일 | 대상 | 사용 |
| --- | --- | --- |
| `api.bat` / `web.bat` / `qdrant.bat` / `ollama.bat` | 개별 프로세스 | `<start\|stop\|restart>` |
| `all.bat` | 4개 일괄 (qdrant→ollama→api→web, 종료 역순) | `<start\|stop\|restart\|status>` |
| `prod.bat` | 운영 HTTPS 일괄 (next build→start, uvicorn no-reload) | `[--skip-build]` |
| `reindex.bat` | 인덱싱 묶음 | `<quick\|sync\|full\|clean> [apply]` |

- `start`: `start "<제목>" cmd /k ...` 로 새 콘솔창. `stop`: 포트 LISTEN PID → `taskkill /F /PID`(web 은 `/T`). qdrant 만 `docker compose stop/restart`.
- reindex 모드: `quick` = load→scan→history→fts→sync-payload(AI 없음) · `sync` = quick + translate + embed · `full` = sync + embed-clip + extract-faces + cluster-faces + ocr-posters · `clean` = cleanup dry-run(`apply` 시 실제 삭제).

## 백업 (Windows 작업 스케줄러)

| 작업명 | 스크립트 | 주기 |
| --- | --- | --- |
| `Flay-Weekly-Backup` | `bin\backup\flay-backup.ps1` | 주 1회 |
| `flayAI Backup Tier1` | `bin\backup\backup-tier1.ps1` | 매일 |
| `flayAI Backup Tier2` | `bin\backup\backup-tier2.ps1` | 주 1회 (일요일 04:00) |

등록·갱신은 `bin\backup\register-schedule.ps1`. 스크립트를 옮기거나 이름을 바꾸면 스케줄러 등록도 함께 갱신한다.

## 코드 수정 후

코드를 바꾸면 어떤 프로세스를 재시작해야 하는지 사용자에게 알려준다(예: flay-ai API 변경 → `bin\ai\api.bat restart`, flay-ai 프론트 운영 빌드 → `bin\ai\prod.bat`, flay-web → `bin\web\FlayGroundStartup.bat`).
