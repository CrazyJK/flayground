# Flay-Ground — Claude Code 지침

로컬 비디오 컬렉션(`K:\Crazy\*`)을 관리·스트리밍·검색하는 **완전 로컬 개인 프로젝트** 모노레포. 인터넷 노출 금지(LAN + 자체 서명 TLS). 이 파일은 저장소 전역 기본 지침이며, 각 컴포넌트 폴더의 `CLAUDE.md`가 상세 지침을 담는다.

## 저장소 구조

```
flayground/
├── flay-web/          # 영화 콘텐츠 웹 (Node.js) — frontend/(Webpack+TS Web Components) · backend/(Express) · playwright/(E2E)
├── flay-mcp/          # MCP AI 라우터 (Node.js) — Gemini / GitHub Models / 로컬 Ollama
├── flay-ai/           # 로컬 LLM + RAG 검색 (Python 3.11 + FastAPI + Next.js) — apps/{api,web} · packages/*
├── bin/               # 실행·운영 스크립트 전부(PowerShell) — flay.ps1(전체) · common.ps1 · web/ · ai/ · backup/
├── docs/              # 문서 전부 — plans/·design/(공용) · flay-web/ · flay-ai/ (컴포넌트별)
├── .claude/skills/    # 스킬 (web-frontend-component, flayai-design, ai-* 절차 스킬)
├── .cert/             # kamoru.jk.{key,pem} 자체 서명 인증서 (gitignore, 세 컴포넌트가 공유)
└── CLAUDE.md, README.md, LICENSE(MIT), .gitignore(단일), .editorconfig, .prettierrc, .eslintrc.js
```

| 컴포넌트 | 서비스 | 상세 지침 |
| --- | --- | --- |
| flay-web | `https://flay.kamoru.jk` (:443, backend 가 API + 정적 프론트 서빙) | `flay-web/frontend/CLAUDE.md`, `flay-web/backend/CLAUDE.md` |
| flay-mcp | HTTP :3002 / MCP stdio | `flay-mcp/CLAUDE.md` |
| flay-ai | API `https://ai.kamoru.jk:8000`, Web `:3000`, Qdrant `:6333`(Docker), Ollama `:11434` | `flay-ai/CLAUDE.md` (+ `packages/indexer`, `packages/rag`, `apps/web`) |
| bin | — | `bin/CLAUDE.md` |

세 컴포넌트는 같은 원본 데이터(`K:\Crazy\*`)와 같은 인증서를 쓰지만 **코드·의존성·실행은 독립**이다. 한 컴포넌트를 고칠 때 다른 컴포넌트를 건드리지 않는다.

## 대화·언어

- **모든 답변·주석·커밋 메시지는 한국어.** 사용자를 지칭하는 2인칭은 '당신'('님' 금지). 사무적이고 정중한 **존댓말**("~했습니다/~합니다"), 반말 금지.
- 소스 코드 주석은 한국어. 단 **`bin/` 의 `.ps1` 은 비ASCII 금지**(주석도 영어) — Windows CP949 콘솔 파싱 오류 방지. `.bat`/`.cmd` 는 만들지 않는다.
- 사용자는 JS/TS/Java 에 능숙하나 AI/ML 은 입문 단계 → AI/ML 개념(임베딩·벡터 DB·RAG·토크나이저 등)이 처음 등장하면 한 단락 이내로 정의를 덧붙인다. 일반 프로그래밍 개념은 부연 없이 코드·명령 중심으로 간결하게.

## 도구·환경

- **패키지 매니저는 yarn 1.x** — 모든 Node 프로젝트(`flay-web/frontend`, `flay-web/backend`, `flay-mcp`, `flay-ai/apps/web`, `flay-web/playwright`). npm 사용 금지. 각 프로젝트는 독립 `package.json`+`yarn.lock`(workspaces 미사용).
- **Python 은 `flay-ai/.venv/Scripts/python.exe`** (3.11, uv 로 관리). `python`/`uv run` 직접 호출 금지(PATH 부재·torch DLL 잠금). flay-ai 명령은 **`flay-ai/` 를 cwd 로** 실행한다.
- PowerShell 은 **Windows PowerShell 5.1** — `??`, 삼항 연산자, `&&` 미지원. `if/else` 로 작성.
- 인증서는 루트 `.cert/` 하나. 각 컴포넌트는 상대 경로(`../.cert`, `../../.cert` 등)로 참조한다.
- `git push`·서버 배포는 사용자가 직접 한다.
- 노골적·사적 콘텐츠(비속어·성적·개인 수위 프롬프트/문구)는 코드·문서·커밋 메시지에 직접 넣지 말고 **gitignore 된 오버라이드 파일**로 분리한다(커밋 코드엔 점잖은 기본값). 예: `flay-ai/diary_prompts.yaml`(ignore) ↔ `diary_prompts.example.yaml`(커밋).

## 실행·운영

- 실행 스크립트(PowerShell: `flay.ps1`, `common.ps1`, `web/`, `ai/`, `backup/`)와 운영 절차는 전부 `bin/` — 상세는 `bin/CLAUDE.md`. 각 Node 프로젝트는 `yarn dev` / `yarn build` / `yarn start`(상세는 폴더 CLAUDE.md).
- 사용자가 **"개발 모드 기동", "서버 기동/띄워줘/재시작", "기동 중지", "서버 내려/꺼줘"** 라고 하면 `bin/CLAUDE.md` 의 "인앱 개발 모드 기동·중지" 절차를 읽고 **확인 질문·중간 설명 없이 그대로 수행한 뒤 결과 표만 응답**한다.

## 문서 규칙

- 문서는 `docs/` 에만 둔다. 공용 계획·설계는 `docs/plans/`, `docs/design/`, 컴포넌트 전용은 `docs/<컴포넌트>/`.
- 코드 변경이 문서에 영향을 주면 갱신한다: 변경 파일과 같은 폴더의 `README.md` → 없으면 `docs/<컴포넌트>/` 의 관련 파일. 관련 파일이 없으면 새 문서를 만들지 않는다.
- 문서·지침은 **현재 상태만** 서술한다. 변경 이력("기존에는 …", "…에서 옮김")은 적지 않는다 — 이력은 git 이 보존한다.
- 모든 함수·클래스·인터페이스에 JSDoc(TS) / docstring(Python) 을 쓴다: 목적, 파라미터 타입, 반환 타입. 복잡한 로직만 인라인 주석으로 보충.

## 코딩 전 사고

**암묵적 가정을 하지 말 것. 혼란스러운 점이 있다면 명확히 밝힐 것. 트레이드오프를 표면화할 것.**

- 가정은 명시적으로 밝힌다. 불확실하면 질문한다.
- 요구사항이 불완전하거나 상충되면 진행 전에 명확화 질문을 한다.
- 여러 해석이 가능하면 선택지를 제시한다 — 조용히 하나를 고르지 않는다.
- 더 단순한 접근이 있으면 제안한다. 현재 접근이 더 적합하면 이유를 설명한다.
- 모델명·포트·경로·버전은 추정하지 말고 `config.yaml`·`package.json`·코드에서 확인한다.

## 코드 구조 원칙

**우선순위: 단순함 > 변경 범위 최소화 > 함수 응집도.** 규칙이 충돌하면 우선순위가 높은 쪽을 따른다.

- **함수 분리**: 한두 줄 로직을 함수로 빼지 않는다. 호출 깊이 3단계 이상은 신중히. 로직을 따라가려고 여러 함수를 오가게 만들지 않는다.
  - 분리하는 경우: 재사용 가능성 있는 로직, 50줄 이상 복잡 로직, 독립 테스트가 필요한 로직.
  - 분리하지 않는 경우: 한 곳에서만 쓰는 단순 계산·포맷팅, 5줄 이하 유틸리티, 단순 템플릿.
- **리팩토링**: 관련 로직은 한 함수에 응집시키고 주석으로 블록을 구분(데이터 로드·그룹화·집계·정렬 등). 타입 정의와 상수는 파일 상단에.
- **유틸리티**: 새로 만들기 전에 기존 유틸(`flay-web/frontend/src/lib/**Utils.ts`, `flay-ai/packages/*`)을 먼저 찾아 재사용한다. 시그니처를 바꾸면 모든 호출부를 함께 고치고 영향 파일 목록을 보고한다.

### 단순함 우선

**요청된 문제를 해결하는 최소한의 코드. 투기적 코드를 쓰지 않는다.**

- 요청하지 않은 기능·유연성·설정 가능성을 추가하지 않는다.
- 단일 사용 코드에 추상화 계층을 만들지 않는다.
- 발생 불가능한 시나리오에 대한 오류 처리를 넣지 않는다.
- 200줄로 쓴 코드가 50줄로 가능하다면 다시 쓴다. "시니어 엔지니어가 과도하게 복잡하다고 할까?" — 그렇다면 단순화한다.

### 변경 범위 최소화

**요청된 것만 수정한다. 자신이 만든 문제만 정리한다.**

- 인접 코드·주석·포맷을 임의로 "개선"하지 않는다. 깨지지 않은 것은 리팩토링하지 않는다. 기존 스타일을 따른다.
- 관련 없는 데드 코드를 발견하면 언급만 하고 삭제하지 않는다.
- 자신의 변경으로 불필요해진 import/변수/함수는 제거한다. 기존부터 있던 데드 코드는 요청 없이 제거하지 않는다.
- 기준: 변경된 모든 줄이 사용자의 요청과 직접 연결되어야 한다.

## 목표 지향 실행

작업을 검증 가능한 목표로 바꾼다: "버그 수정" → "재현 테스트 작성 후 통과", "리팩토링" → "전후 테스트 통과 확인". 다단계 작업은 시작 전에 계획을 제시한다:

```
1. [단계] → 검증: [확인 방법]
2. [단계] → 검증: [확인 방법]
```

- 변경 후 영향받는 테스트·빌드·린트를 먼저 실행한다(각 컴포넌트 명령은 폴더 CLAUDE.md).
- 코드를 바꾸면 **어떤 프로세스를 재시작해야 하는지** 알려준다(flay-ai API 는 자동 reload 없음).
- 완료 보고: 변경 요약 · 변경 파일 목록 · 동작 보존 근거 · 실행한 검증 명령과 결과 · 남은 리스크. HTML 마크업은 출력하지 않는다.
