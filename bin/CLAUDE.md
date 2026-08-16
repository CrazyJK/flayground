# bin — 실행·운영 지침

Windows 전용. **운영 모드** 프로세스 제어(빌드 → 기동·중지·상태), 인덱싱·백업 자동화, 그리고 클로드 앱 내부에서 서버를 띄우고 내리는 절차. 실행 스크립트(`.ps1`)는 전부 이 폴더에 둔다(파이썬 개발용 진단 스크립트는 `flay-ai/scripts/` 에 남는다 — `packages` import 때문에 flay-ai cwd 전제). **`.bat`/`.cmd` 는 쓰지 않는다.** **개발 모드 스크립트는 두지 않는다** — 개발 모드는 `.vscode/launch.json`(VS Code) 과 아래 "인앱 개발 모드 기동·중지"(클로드) 두 경로뿐이다.

```powershell
bin\flay.ps1 <start|stop|restart|status> [-SkipBuild]   # 전체 운영 기동: mcp → web → qdrant → ollama → api → ai-web
bin\web\mcp.ps1 | web.ps1 <start|stop|restart|status> [-SkipBuild]        # flay-mcp · flay-web 개별 (start = 빌드 → dist 기동)
bin\ai\api.ps1 | web.ps1 | qdrant.ps1 | ollama.ps1 <start|stop|restart|status> [-SkipBuild]   # flay-ai 개별 (web = next build → node server.js)
bin\ai\reindex.ps1 <quick|sync|full|clean> [apply]
```

cmd.exe 에서는 `powershell -NoProfile -File bin\flay.ps1 start` 처럼 호출한다(실행 정책 RemoteSigned, 로컬 파일이라 그대로 실행 가능).

```
bin/
├── common.ps1               # 공용 라이브러리 — 컴포넌트 표($Components: 포트·명령·빌드 단계·로그·헬스 URL) + Invoke-Flay/Start-Component/Stop-Component/Show-Status
├── flay.ps1                 # 전체 start|stop|restart|status
├── web/                     # mcp.ps1 · web.ps1(flay-web backend; start 시 frontend webpack + backend tsup 빌드)
├── ai/                      # api/web/qdrant/ollama.ps1, reindex.ps1,
│                            # bootstrap.ps1(첫 셋업), nightly_index.ps1, nightly_subtitle.ps1, overnight.ps1, README.md
└── backup/                  # flay-backup.ps1(flay-web 주간), backup-tier1.ps1(flay-ai 일일)·backup-tier2.ps1(flay-ai Qdrant 주간)·sqlite_backup.py,
                             # flayai-backup.ps1(SQLite VACUUM + Qdrant snapshot), register-schedule.ps1(작업 스케줄러 등록)
```

## 절대 규칙 — 인코딩

- `.ps1` 은 **ASCII 만**(주석도 영어), 줄 끝 **LF**(기존 한국어 주석 파일은 그대로 둔다). 화면 표현은 박스 문자 대신 `[ OK ]`·`[SKIP]`·`[FAIL]` + `Write-Host -ForegroundColor` 로 한다.
- PowerShell 은 **5.1** — `??`, 삼항, `&&` 미지원. `$pid` 는 자동 변수라 변수명으로 쓰지 않는다.

## 경로 계산

- 스크립트는 어디서 실행하든 자기 위치 기준으로 대상 폴더를 찾는다. 프로세스 제어 스크립트는 `common.ps1` 을 dot-source 하고 그 안의 `$Root`(저장소 루트 = `bin\` 의 부모)·`$FlayAi` 를 쓴다. 그 외 ps1 은 `Split-Path -Parent (Split-Path -Parent $PSScriptRoot)`.
  - `bin/ai/*` 와 `bin/backup/backup-tier*` 는 `<루트>\flay-ai` 를 작업 디렉토리로 한다.
  - `bin/web/*` 는 `<루트>\flay-web\{frontend,backend}`, `<루트>\flay-mcp` 를 대상으로 한다.
- Python 호출은 항상 `<루트>\flay-ai\.venv\Scripts\python.exe` (PATH 의 `python`/`uv run` 금지). 인증서는 `<루트>\.cert\` (flay-ai cwd 기준 `..\.cert\`).
- PowerShell 에서 `python -c "(name)..."` 는 `(name)` 을 cmdlet 으로 파싱 → single-quote 또는 `.py` 파일로.

## 프로세스 제어 (`common.ps1` 규칙)

- 컴포넌트 키: `mcp`(3002) · `web`(443, flay-web backend) · `qdrant`(6333, docker) · `ollama`(11434) · `api`(8000) · `aiweb`(3000, 표시명 `ai-web`). 명령·빌드 단계·로그·헬스 URL 은 `$Components` 한 곳에만 둔다(uvicorn 명령줄도 여기 하나뿐). 모두 **운영 모드** 명령이다: `mcp` `yarn start`(dist) · `web` `yarn start`(dist) · `api` uvicorn no-reload · `aiweb` `node server.js`(.next).
- `start`: 포트가 이미 LISTEN 이면 `[SKIP]`. `Build` 단계가 있는 컴포넌트는 먼저 순서대로 빌드 — `mcp` = `yarn install`·`yarn run build`(→ `dist/`) / `web` = frontend `yarn install`·`node madge.cjs`·`yarn run build`(webpack → `frontend/dist`, backend 가 `/dist` 로 서빙) + backend `yarn install`·`yarn build:schema`·`yarn build`(tsup → `dist/`) / `aiweb` = `yarn install`·`yarn build`(next → `.next`). 표시는 `[....] build i/n: <명령>`, 출력 → `<로그 폴더>\build.log`, 실패 시 `[FAIL]` 중단. `-SkipBuild` 면 기존 산출물(`dist/` 또는 `BuildOut`=`.next`)로 바로 기동, 없으면 거부. 그다음 `Start-Process cmd /c "<명령> > <로그> 2>&1" -NoNewWindow` 로 **현재 터미널의 백그라운드**(새 창 없음, 터미널을 닫으면 함께 종료)로 띄우고, 포트가 LISTEN 될 때까지 `[....] waiting Ns` 를 제자리 갱신 → `[ OK ] built Ns, up in N.Ns pid P health 200` / 타임아웃 시 `[FAIL]`. 로그: `flay-mcp\logs\mcp-nexus.log`, `flay-web\backend\logs\web-backend.log`, `flay-ai\logs\{ollama,api,web}.log`.
- `stop`: 포트 LISTEN PID 를 `taskkill /F /T`(PID 가 이미 죽었으면 `Win32_Process` 에서 그 PID 를 부모로 둔 자식을 종료), 포트 닫힘 확인 후 `[STOP]`. qdrant 만 `docker compose stop`. `flay.ps1 stop` 은 qdrant·ollama 도 내린다(Ollama 는 트레이가 자동 재기동).
- `status`: 컴포넌트별 `[ UP ] pid health` / `[DOWN]`, qdrant 는 docker 상태 병기.
- reindex 모드: `quick` = load→scan→history→fts→sync-payload(AI 없음) · `sync` = quick + translate + embed · `full` = sync + embed-clip + extract-faces + cluster-faces + ocr-posters · `clean` = cleanup dry-run(`apply` 시 실제 삭제). 단계별 소요 시간 출력, 첫 실패에서 중단.

## 백업 (Windows 작업 스케줄러)

| 작업명 | 스크립트 | 주기 |
| --- | --- | --- |
| `Flay-Weekly-Backup` | `bin\backup\flay-backup.ps1` | 주 1회 |
| `flayAI Backup Tier1` | `bin\backup\backup-tier1.ps1` | 매일 |
| `flayAI Backup Tier2` | `bin\backup\backup-tier2.ps1` | 주 1회 (일요일 04:00) |

등록·갱신은 `bin\backup\register-schedule.ps1`. 스크립트를 옮기거나 이름을 바꾸면 스케줄러 등록도 함께 갱신한다.

## 인앱 개발 모드 기동·중지

사용자가 "개발 모드 기동", "서버 기동/띄워줘/재시작"이라고 하면 별도 지정이 없는 한 **web·mcp·ai 세 컴포넌트를 모두 개발 모드**로 띄운다. 방식은 `bin\*.ps1`(운영·빌드 산출물 기동)이 아니라 **클로드 앱 내부 백그라운드 프로세스**(Bash 도구 `run_in_background`, 로그 실시간 확인). 절차는 정해져 있으므로 **확인 질문·중간 설명 없이 아래를 그대로 수행하고 결과 표만 응답**한다. 인앱 프로세스는 클로드 앱 종료 시 함께 죽는다 → 독립 유지가 필요하면 운영 모드 `bin\flay.ps1 start`.

1. 포트 확인: `Get-NetTCPConnection -State Listen` 으로 443·3002·8000·3000·6333·11434 를 본다. 선행 Qdrant(6333)·Ollama(11434)는 떠 있는지 확인만(없으면 `bin\ai\qdrant.ps1 start` / `bin\ai\ollama.ps1 start`). 이미 LISTEN 중인 컴포넌트 포트는 건너뛴다.
2. 다섯 프로세스를 각각 백그라운드로 기동(cwd 는 각 프로젝트 폴더):
   - flay-web/frontend: `tail -f /dev/null | yarn dev` — webpack `watchOptions.stdin: true` 라 stdin 이 닫히면 watch 가 종료되므로 반드시 stdin 을 열어 둔 채 띄운다.
   - flay-web/backend: `yarn dev` (tsx watch, :443)
   - flay-mcp: `yarn dev` (tsx watch, :3002)
   - flay-ai: `./.venv/Scripts/python.exe -m uvicorn apps.api.main:app --host ai.kamoru.jk --port 8000 --ssl-keyfile ../.cert/kamoru.jk.key --ssl-certfile ../.cert/kamoru.jk.pem` (`--reload` 금지 — 이유는 `flay-ai/CLAUDE.md`)
   - flay-ai/apps/web: `yarn dev` (next dev, :3000)
3. 대기: `until curl -sk … ; do sleep 2; done` 형태의 백그라운드 명령으로 8000·3000·443 이 응답할 때까지 기다린다(포그라운드 `sleep` 금지).
4. 헬스 점검(HTTP 코드): `https://flay.kamoru.jk/`, `https://flay.kamoru.jk:3002/health`, `https://ai.kamoru.jk:8000/healthz`, `https://ai.kamoru.jk:3000/`. 실패한 것만 해당 백그라운드 로그를 읽어 원인을 적는다.
5. 응답: 컴포넌트·포트·상태 표 한 개 + 이상 징후(로그의 오류·비활성 메시지)만 한두 줄. flay-ai API 는 자동 reload 가 없어 코드 변경 시 8000 프로세스를 종료 후 재기동해야 함을 필요할 때만 덧붙인다.

**중지**("기동 중지", "서버 내려/꺼줘"): 마찬가지로 확인 없이 수행하고 결과 표만 응답한다. ① 위에서 띄운 다섯 백그라운드 작업을 TaskStop 으로 중단 — 단 Windows 에선 자식 node/python 이 살아남으므로 ② `Get-NetTCPConnection -State Listen` 으로 443·3002·8000·3000 의 OwningProcess 를 `taskkill /F /T /PID` 로 종료(PID 가 이미 죽었으면 `Win32_Process` 에서 PPID 가 그 PID 인 python 자식을 종료), ③ 포트가 없는 webpack watch 는 `Win32_Process` 에서 `node.exe` + CommandLine `*webpack*` 로 찾아 종료, ④ 네 포트가 모두 닫혔는지 재확인. **Qdrant(6333)·Ollama(11434)는 중지하지 않는다.** `taskkill /F` 로 끝난 작업이 'exit 1 실패'로 표시되는 것은 정상.

## 코드 수정 후

코드를 바꾸면 어떤 프로세스를 재시작해야 하는지 사용자에게 알려준다(운영: flay-ai API → `bin\ai\api.ps1 restart`, flay-ai 프론트 → `bin\ai\web.ps1 restart`(next build 포함), flay-web/flay-mcp → `bin\web\web.ps1 restart` / `bin\web\mcp.ps1 restart`(빌드 포함), 전부 → `bin\flay.ps1 restart` / 인앱 개발 모드: 8000 프로세스 재기동 등).
