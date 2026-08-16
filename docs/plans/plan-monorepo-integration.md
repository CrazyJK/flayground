# 계획: flayground + flayAI 모노레포 통합

> 작성일: 2026-08-16
> 목표: flayground(Node.js)와 flayAI(Python)를 **flayground 저장소 하나**로 합치고, 성격별 3개 컴포넌트 + 공용 `bin/`·`docs/` 로 재구성한다. 각 컴포넌트의 스택·실행 방식은 그대로 둔다.

## 결정 사항

| 항목            | 결정                                                                                     |
| --------------- | ---------------------------------------------------------------------------------------- |
| 저장소          | flayground 저장소(`master`)를 루트로 유지, flayAI 이력은 **subtree merge** 로 보존        |
| 컴포넌트 3분류  | `flay-web/` (frontend + backend), `flay-mcp/`, `flay-ai/`                                |
| web 내부 이름   | `flay-web/frontend/`, `flay-web/backend/`, `flay-web/playwright/`                        |
| 실행 스크립트   | 루트 `bin/` 에 전부 모음. 전체 통합 실행 `bin/flay.bat` 신규                              |
| 문서            | 루트 `docs/` 에 전부 모음. 컴포넌트 전용 문서는 `docs/<컴포넌트>/` 하위                   |
| AI 지침         | **Claude Code 전용, CLAUDE.md 만 사용** — 루트에 기본 지침, 각 컴포넌트 폴더에 상세 지침. Copilot·AGENTS.md 미사용 |
| `.gitignore`    | 루트 **하나**로 병합 (flay-ai 중첩 파일 삭제)                                            |
| 라이선스        | **MIT** 로 통일 (루트 `LICENSE` 하나)                                                    |
| 패키지 매니저   | **yarn 1.x** 로 통일 (`flay-ai/apps/web` 의 npm → yarn)                                  |
| 인증서          | 루트 `.cert/` 하나만 사용 (양쪽 파일이 동일)                                              |
| 커밋 정책       | 지침 파일에 적지 않음. 세션 메모리로 관리(자동 커밋 안 함)                                |
| 스코프 밖       | yarn workspaces 미도입(각 프로젝트 독립 `yarn.lock` 유지), 브랜치명 `master` 유지          |

## 대상 구조

```
flayground/
├── CLAUDE.md                 # 전역 기본 지침 (본문 직접 기재, 임포트 없음)
├── README.md                 # 전체 소개 + 컴포넌트별 요약 + 빠른 시작
├── LICENSE                   # MIT
├── .gitignore                # 저장소 유일한 gitignore
├── .editorconfig  .prettierrc  .eslintrc.js  .markdownlint.json  .cspell/
├── .cert/                    # kamoru.jk.{key,pem} (gitignore, 단일 소스)
├── .vscode/                  # launch/tasks/settings 병합
├── .claude/skills/           # web-frontend-component, flayai-design (+ flay-ai 반복 절차 스킬)
│
├── flay-web/                 # ── 컴포넌트 1: 영화 콘텐츠 웹 (Node.js)
│   ├── frontend/             # Webpack + TS (구조 변경 없음) + CLAUDE.md
│   ├── backend/              # Express + TS (구조 변경 없음) + CLAUDE.md
│   └── playwright/           # E2E
│
├── flay-mcp/                 # ── 컴포넌트 2: MCP AI 라우터 (Node.js, 내부 구조·package name 그대로) + CLAUDE.md
│
├── flay-ai/                  # ── 컴포넌트 3: 로컬 LLM + RAG (Python + Next.js) + CLAUDE.md
│   ├── pyproject.toml  uv.lock  config.yaml  .python-version
│   ├── apps/{api,web}  packages/  tests/  scripts/(파이썬 진단 스크립트)  eval/
│   ├── data/ logs/ .venv/ (gitignore)
│   └── packages/indexer/CLAUDE.md, packages/rag/CLAUDE.md, apps/web/CLAUDE.md
│
├── bin/                      # ── 실행·운영 스크립트 전부
│   ├── flay.bat              # 신규: web + mcp + ai 전체 기동/상태/종료
│   ├── CLAUDE.md             # 스크립트 규칙(ASCII 전용, PS 5.1)
│   ├── web/                  # FlayGroundStartup.bat/.sh (frontend 빌드 → mcp → backend 기동)
│   ├── ai/                   # all/api/web/prod/ollama/qdrant/reindex.bat, bootstrap/nightly_*/overnight.ps1, README.md
│   └── backup/               # flay-backup.ps1, backup-tier1/2.ps1, sqlite_backup.py, register-schedule.ps1
│
└── docs/                     # ── 문서 전부
    ├── README.md             # 색인
    ├── plans/                # 전체 계획 (monorepo-integration, desktop-shell)
    ├── design/  references.md  private-memo.md(gitignore)
    ├── flay-web/             # FlayPIP.md, TODO.md, plans/{codef,financial.note,web-push,dashboard,adaptiveBitrateStreaming}
    ├── flay-mcp/             # (필요 시 생성)
    └── flay-ai/              # flayAI 문서 전체 (README, TODO, indexing-pipeline, chat-and-rag, admin, api-reference, dev-guide, …)
```

**분류 기준**: 실행 스크립트(`.bat/.ps1/.sh`)는 `bin/`, 문서(`.md`)는 `docs/`. 단 `flay-ai/scripts/*.py` 는 `packages` 를 import 하는 개발용 진단 스크립트라 `flay-ai/` 안에 남긴다(파이썬 cwd 전제).

## AI 지침 (Claude Code 전용)

- **CLAUDE.md 만 사용, 본문 직접 기재.** 루트 `CLAUDE.md` 는 매 세션 로드, 하위 폴더 `CLAUDE.md` 는 해당 폴더 파일을 읽을 때 온디맨드 로드된다. `@임포트`·심볼릭 링크 없음.
- **배치**:
  - 루트 `CLAUDE.md`: 응답 언어(한국어·존댓말·2인칭 '당신')·yarn·JSDoc·단순함/변경 최소화 원칙·저장소 구조·`bin/`/`docs/` 규칙·문서 위치 규칙(가까운 README → `docs/<컴포넌트>/`)·`.bat/.ps1` 비ASCII 금지·PowerShell 5.1·인터넷 노출 금지·실행 명령 요약. 200줄 이내.
  - `flay-web/frontend/CLAUDE.md`, `flay-web/backend/CLAUDE.md`, `flay-mcp/CLAUDE.md`: 폴더별 세부 지침
  - `flay-ai/CLAUDE.md`(파이썬 전역·아키텍처·핵심 함정·개발 모드), `flay-ai/packages/indexer/`, `flay-ai/packages/rag/`, `flay-ai/apps/web/` 각 `CLAUDE.md`
  - `bin/CLAUDE.md`: 스크립트 규칙
- **`.github/` 전체 삭제**(양쪽): `copilot-instructions.md`·`instructions/`·`agents/`·`chatmodes/` 는 본문을 위 CLAUDE.md 로 흡수 후 제거. flayAI `prompts/` 5개(재인덱싱·서비스 재시작·RAG 도구 추가·API 엔드포인트 추가·문서 동기화)는 반복 절차이므로 `.claude/skills/` 스킬로 전환한다.
- 스킬은 `.claude/skills/` 하나로 모은다: `web-frontend-component`, `flayai-design`, 위 절차 스킬.
- 커밋 정책 문구는 어느 CLAUDE.md 에도 넣지 않는다.

## `.gitignore` 병합

루트 하나로 합친다. flayAI 쪽 규칙을 옮길 때:

- 슬래시가 포함된 경로 패턴(`data/qdrant/`, `apps/web/.next/`, `apps/web/src/app/favicon.ico`, `eval/results/` 등)은 `flay-ai/` 접두, `docs/_planbuild/*.png` 류는 `docs/flay-ai/_planbuild/` 로.
- Python 템플릿의 범용 디렉토리 패턴(`lib/`, `lib64/`, `build/`, `var/`, `parts/`, `downloads/`, `eggs/` …)은 루트에서 재귀 적용되어 `flay-web/frontend/src/lib/` 같은 소스를 무시하므로 **넣지 않는다.** 실제 필요한 것만: `__pycache__/`, `*.py[cod]`, `.venv/`, `.pytest_cache/`, `.ruff_cache/`, `.mypy_cache/`, `*.egg-info/`.
- 위치 무관 패턴(`*.db`, `yolo*.pt`, `*_prompts.yaml`, `logs/`, `.cert/`, `node_modules/`, `dist/`)은 그대로.
- 검증: 병합 후 `git status` 가 비어 있고, `git check-ignore -v` 로 private 파일(`flay-ai/diary_prompts.yaml`, `flay-ai/data/…`, `.cert/`)이 무시되며, `git ls-files flay-web/frontend/src/lib | wc -l` 이 0 이 아님.

## 이동에 따라 수정해야 하는 것 (조사 완료)

| 대상 | 내용 |
| --- | --- |
| `flay-web/backend/src/index.ts:73-74,138` | 정적 경로 `../../web-frontend/{dist,public}` → `../../frontend/…`; 인증서 `../../.cert` → `../../../.cert` |
| `flay-web/backend/src/middleware/error-handler.ts:9` | `../../../web-frontend/public/error` → `../../../frontend/public/error` |
| `flay-mcp/src/http-server.ts:328` | `../../.cert` 는 루트를 가리키므로 **변경 없음** |
| 루트 `.eslintrc.js` | `web-frontend`/`web-backend`/`mcp-nexus` 경로 → 신규 경로, `ignorePatterns` 에 `flay-ai/**` 추가 |
| 루트 `.vscode/launch.json`, `settings.json` | cwd·`resolvePluginsRelativeTo` 갱신 + flayAI `launch.json`/`tasks.json` 항목 병합 |
| `bin/web/FlayGroundStartup.bat/.sh` | HOME 탐지 조건 `web-backend\src` → `flay-web\backend\src`, 탐색 시작점 `%~dp0..\..`, 각 `cd` 경로 |
| `bin/ai/*.bat` (7) | `%~dp0..` → `%~dp0..\..\flay-ai` (all.bat 은 `BIN` 변수만) |
| `bin/ai/*.ps1` (4), `bin/backup/backup-tier1/2.ps1` | `$Root`/`$repo` 계산을 `bin/ai/` 기준으로 → `<루트>\flay-ai` |
| `bin/backup/flay-backup.ps1:25` | `ConfigPath` 기본값을 `$PSScriptRoot` 기준 상대경로로 (`..\..\flay-web\backend\config\default.json`) |
| `flay-web/backend/config/default.json:42` | `scriptPath` 는 `bin/backup/flay-backup.ps1` 로 위치 불변 → **변경 없음** |
| flay-ai 인증서 참조 (6) | `config.yaml` ssl 경로 → `../.cert/…`, `apps/web/package.json` dev → `../../../.cert`, `apps/web/server.js` 3단계 상위, `bin/ai/{api,prod}.bat`, `.vscode/launch.json` |
| flay-ai 문서 링크 | 코드·지침·스킬의 `docs/xxx.md` → `docs/flay-ai/xxx.md`; `docs/flay-ai/` 내부 상대 링크는 통째 이동이라 불변 |
| 절차 스킬 (prompts 5 → `.claude/skills/`) | `bin\reindex.bat` 등 → `bin\ai\…`, `docs/` → `docs/flay-ai/` |
| `flay-ai/apps/web` | `package-lock.json` 삭제 → `yarn.lock` 생성, `npm run` 표기 → `yarn` (bat·CLAUDE.md·docs) |
| Windows 작업 스케줄러 | `flayAI Backup Tier1/Tier2` 를 `bin\backup\backup-tier1/2.ps1` 로 재등록. `Flay-Weekly-Backup` 은 경로 불변 |
| `flay-ai/packages/settings.py` | `REPO_ROOT = Path(__file__).parent.parent` 파일 위치 기준 → **변경 없음** (`config.yaml`·`data/` 자동 추종) |
| `.gitignore` | 루트 하나로 병합 (위 절 참조), `flay-ai/.gitignore` 삭제 |

`git mv` 는 디렉토리를 OS rename 하므로 `node_modules/`·`dist/` 등 비추적 내용물도 함께 따라온다.

## 비추적 자산 (subtree merge 가 옮기지 않는 것)

| 자산 | 용량 | 처리 |
| --- | --- | --- |
| `data/` | 4,689 MB | `Move-Item` → `flay-ai/data/` (같은 드라이브 → 즉시) |
| `.venv/` | 5,968 MB | 이동 후 스모크 → 실패 시 `uv sync` |
| `apps/web/node_modules/` | 414 MB | yarn 전환 시 삭제 후 재설치 |
| `yolo11x-seg.pt`, `logs/`, `diary_prompts.yaml`, `.env` | ~150 MB | 이동 (private override 는 유실 시 복구 불가) |
| `.cert/` | ~0 | flayAI 쪽은 삭제(루트와 동일 파일) |
| `__pycache__/ .ruff_cache/ .pytest_cache/ apps/web/.next/ *.tsbuildinfo` | — | 옛 절대경로가 박힌 캐시 → 삭제 |

## 단계별 계획

```
1. 안전장치
   → 검증: 양쪽 git status 비어 있음, flayground 에 태그 pre-merge-flayground

2. flayground 재배치 (git mv)
   web-frontend→flay-web/frontend, web-backend→flay-web/backend, playwright→flay-web/playwright,
   mcp-nexus→flay-mcp, doc→docs(+ 컴포넌트 문서는 docs/flay-web/), bin/FlayGroundStartup.*→bin/web/
   + 위 표의 flayground 쪽 경로 수정
   → 검증: 세 프로젝트 yarn build·type-check 통과, backend 기동 후 HTTPS·정적 서빙·에러 페이지 200,
           flay-backup.ps1 -WhatIf 실행에서 설정 파일 인식

3. subtree merge: flayAI → flay-ai/
   git remote add flayai <경로> ; git fetch flayai ; git subtree add --prefix=flay-ai flayai main
   → 검증: git log --follow flay-ai/pyproject.toml 에 flayAI 커밋, git ls-files flay-ai | wc -l = 275

4. flay-ai 재배치 (git mv)
   docs→docs/flay-ai, bin/*.bat·scripts/*.ps1→bin/ai, backup-tier*→bin/backup,
   .claude/skills→루트, .markdownlint.json→루트, LICENSE·.editorconfig·.vscode·.gitignore·README 는 병합 후 삭제
   + 위 표의 flay-ai 쪽 경로 수정 (bat/ps1 루트 계산, 인증서, 문서 링크)
   → 검증: rg "git[\\/]flayAI" 가 docs/flay-ai/_planbuild 외 0건,
           마크다운 상대 링크 점검 스크립트(임시) 깨진 링크 0건

5. 비추적 자산 이동 + 캐시 삭제 + .cert 단일화 + .gitignore 병합
   → 검증: flay-ai/config.yaml·data/*.db 존재, git status 비어 있음,
           git check-ignore -v 로 private 파일 무시 확인, flay-web/frontend/src/lib 추적 유지

6. yarn 전환 (flay-ai/apps/web)
   → 검증: yarn install → yarn build → yarn lint 통과, bin/ai/web.bat 로 dev 기동

7. CLAUDE.md 통합 (루트 기본 + 폴더별 상세) + .github/ 삭제 + prompts→.claude/skills 전환
   → 검증: /context 에서 루트 CLAUDE.md 로드 확인, 지침 내 상대 링크·경로가 실제 파일과 일치,
           .github/ 잔존 0, 하위 폴더 파일을 읽을 때 해당 CLAUDE.md 로드

8. 루트 파일: README 재작성, LICENSE MIT, .editorconfig 병합(파이썬 4/TS 2 상위집합), .vscode 병합
   → 검증: README 의 구조도·명령이 실제 경로와 일치

9. bin/flay.bat 신규 + register-schedule.ps1 이 3개 백업 작업 모두 등록하도록 확장 + 스케줄러 재등록
   → 검증: bin\flay.bat status 로 web·mcp·ai 상태 표시, Get-ScheduledTask 경로가 bin\backup\, 수동 1회 실행 성공

10. 실행 검증 (전체)
    → 검증: flay-ai 에서 .venv\Scripts\python.exe -m pytest -q 통과, uvicorn 기동 후 GET /healthz 200,
            bin\flay.bat 한 번으로 web(:443)·mcp·ai(:8000/:3000) 모두 응답

11. 구 flayAI 저장소 보관 (삭제하지 않음)
    → 검증: 통합본 정상 운영 확인 후 사용자가 직접 정리
```

각 단계 종료 시점에 커밋할지는 세션에서 사용자가 결정한다.

## 리스크 / 미결

- **`.venv` 이동**: 진입점 shim 에 절대경로가 박혀 있으나 flayAI 는 전부 `.venv\Scripts\python.exe -m <모듈>` 호출이라 동작 가능성 높음. 실패 시 `uv sync` (torch cu124 캐시 미스면 수 GB 재다운로드).
- **npm→yarn**: Next.js 16 lock 재생성으로 의존성 트리가 달라질 수 있음. 빌드 실패 시 `flay-ai/apps/web` 만 npm 예외로 되돌리는 선택지 유지.
- **경로 길이**: `flay-web/frontend/node_modules/…` 깊이 증가. 260자 초과 시 `git config core.longpaths true` + `LongPathsEnabled`.
- **저장소 크기**: 병합 후 pack 약 166MB.
- **`docs/flay-ai/_planbuild/*`**: 다른 PC(`C:/Handyground/…`) 경로가 박힌 문서 생성 스크립트 — 범위 밖, 손대지 않음.
- **되돌리기**: `git reset --hard pre-merge-flayground` + 비추적 자산 원위치. 구 flayAI 저장소를 보관하는 이유.
