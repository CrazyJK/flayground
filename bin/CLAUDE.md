# bin — 실행·운영 지침

Windows 전용. 프로세스 제어, 빌드·기동, 인덱싱·백업 자동화, 그리고 클로드 앱 내부에서 서버를 띄우고 내리는 절차. 실행 스크립트(`.bat`/`.ps1`/`.sh`)는 전부 이 폴더에 둔다(파이썬 개발용 진단 스크립트는 `flay-ai/scripts/` 에 남는다 — `packages` import 때문에 flay-ai cwd 전제).

```cmd
bin\flay.bat <start|stop|status>        :: 전체(web + mcp + ai) 일괄 제어(별도 창)
bin\web\FlayGroundStartup.bat           :: flay-web 빌드 + flay-mcp/backend 기동
bin\ai\all.bat <start|stop|status>      :: flay-ai 개발 일괄 (qdrant → ollama → api → web)
bin\ai\prod.bat                         :: flay-ai 운영 HTTPS 일괄 기동
bin\ai\reindex.bat <quick|sync|full|clean>
```

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

## 인앱 개발 모드 기동·중지

사용자가 "개발 모드 기동", "서버 기동/띄워줘/재시작"이라고 하면 별도 지정이 없는 한 **web·mcp·ai 세 컴포넌트를 모두 개발 모드**로 띄운다. 방식은 별도 창(`bin\*.bat`)이 아니라 **클로드 앱 내부 백그라운드 프로세스**(Bash 도구 `run_in_background`, 로그 실시간 확인). 절차는 정해져 있으므로 **확인 질문·중간 설명 없이 아래를 그대로 수행하고 결과 표만 응답**한다. 인앱 프로세스는 클로드 앱 종료 시 함께 죽는다 → 독립 유지가 필요하면 `flay.bat` / `prod.bat`.

1. 포트 확인: `Get-NetTCPConnection -State Listen` 으로 443·3002·8000·3000·6333·11434 를 본다. 선행 Qdrant(6333)·Ollama(11434)는 떠 있는지 확인만(없으면 `bin\ai\qdrant.bat start` / `bin\ai\ollama.bat start`). 이미 LISTEN 중인 컴포넌트 포트는 건너뛴다.
2. 다섯 프로세스를 각각 백그라운드로 기동(cwd 는 각 프로젝트 폴더):
   - flay-web/frontend: `tail -f /dev/null | yarn dev` — webpack `watchOptions.stdin: true` 라 stdin 이 닫히면 watch 가 종료되므로 반드시 stdin 을 열어 둔 채 띄운다.
   - flay-web/backend: `yarn dev` (tsx watch, :443)
   - flay-mcp: `yarn dev` (tsx watch, :3002)
   - flay-ai: `./.venv/Scripts/python.exe -m uvicorn apps.api.main:app --host ai.kamoru.jk --port 8000 --ssl-keyfile ../.cert/kamoru.jk.key --ssl-certfile ../.cert/kamoru.jk.pem` (`--reload` 금지 — 이유는 `flay-ai/CLAUDE.md`)
   - flay-ai/apps/web: `yarn dev` (next dev, :3000)
3. 대기: `until curl -sk … ; do sleep 2; done` 형태의 백그라운드 명령으로 8000·3000·443 이 응답할 때까지 기다린다(포그라운드 `sleep` 금지).
4. 헬스 점검(HTTP 코드): `https://flay.kamoru.jk/`, `https://flay.kamoru.jk:3002/health`, `https://ai.kamoru.jk:8000/docs`, `https://ai.kamoru.jk:3000/`. 실패한 것만 해당 백그라운드 로그를 읽어 원인을 적는다.
5. 응답: 컴포넌트·포트·상태 표 한 개 + 이상 징후(로그의 오류·비활성 메시지)만 한두 줄. flay-ai API 는 자동 reload 가 없어 코드 변경 시 8000 프로세스를 종료 후 재기동해야 함을 필요할 때만 덧붙인다.

**중지**("기동 중지", "서버 내려/꺼줘"): 마찬가지로 확인 없이 수행하고 결과 표만 응답한다. ① 위에서 띄운 다섯 백그라운드 작업을 TaskStop 으로 중단 — 단 Windows 에선 자식 node/python 이 살아남으므로 ② `Get-NetTCPConnection -State Listen` 으로 443·3002·8000·3000 의 OwningProcess 를 `taskkill /F /T /PID` 로 종료(PID 가 이미 죽었으면 `Win32_Process` 에서 PPID 가 그 PID 인 python 자식을 종료), ③ 포트가 없는 webpack watch 는 `Win32_Process` 에서 `node.exe` + CommandLine `*webpack*` 로 찾아 종료, ④ 네 포트가 모두 닫혔는지 재확인. **Qdrant(6333)·Ollama(11434)는 중지하지 않는다.** `taskkill /F` 로 끝난 작업이 'exit 1 실패'로 표시되는 것은 정상.

## 코드 수정 후

코드를 바꾸면 어떤 프로세스를 재시작해야 하는지 사용자에게 알려준다(예: flay-ai API 변경 → `bin\ai\api.bat restart` 또는 인앱 8000 프로세스 재기동, flay-ai 프론트 운영 빌드 → `bin\ai\prod.bat`, flay-web → `bin\web\FlayGroundStartup.bat`).
