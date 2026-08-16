# flay-web/frontend — 지침

Webpack 5 + TypeScript 멀티 엔트리 SPA. 프레임워크 없이 Web Components(Custom Elements) 사용. 빌드 결과(`dist/`)와 `public/`은 `flay-web/backend`가 `https://flay.kamoru.jk`에서 서빙한다.

## 기술 스택

- **언어**: TypeScript (strict, noUnusedLocals·noUnusedParameters)
- **컴포넌트**: Web Components (Custom HTML Elements)
- **스타일**: SCSS (컴포넌트별 동반 파일)
- **번들러**: Webpack 5
- **주요 라이브러리**: ECharts, Toast UI Editor, D3 Hierarchy

## 디렉토리 구조

```
src/
├── base/           # 베이스 클래스 (GroundFlay, GroundUI, GroundNav 등)
├── flay/           # Flay 도메인 컴포넌트
├── finance/        # 금융 노트 (기관·계좌·스냅샷·포트폴리오)
├── image/          # 이미지 갤러리
├── movie/          # 영상 재생
├── pension/        # 연금 플래너
├── ai/             # AI 연동 (flay-mcp 프록시)
├── nav/            # 네비게이션 (SideNavBar)
├── lib/
│   ├── common/     # 유틸리티 (DateUtils, NumberUtils, StringUtils...)
│   ├── components/ # 재사용 UI (ModalWindow, showAlert, showConfirm...)
│   ├── browser/    # 브라우저 API (SseConnector, PushNotification...)
│   ├── services/   # API 클라이언트 (FlayFetch, ApiClient)
│   └── storage/    # 저장소 (FlayStorage)
├── view/
│   ├── style/      # 글로벌 SCSS (테마, 레이아웃, 엘리먼트)
│   ├── page.*.html/ts  # 페이지 진입점
│   └── popup.*.html/ts # 팝업 진입점
└── types/          # 공유 타입 정의
```

## import 경로

- `src` 하위에서 import 시 `tsconfig.json`의 `paths` 별칭을 사용한다. 상대 경로(`../../base/...`)보다 별칭 우선.
  - `@ai/*`, `@attach/*`, `@base/*`, `@editor/*`, `@finance/*`, `@flay/*`, `@image/*`, `@lib/*`, `@movie/*`, `@nav/*`, `@spa/*`, `@svg/*`
  - `@domain/*` → `../backend/src/domain/*` (백엔드와 공유하는 타입)
  - 예: `import { showAlert } from '@lib/components/showAlert';`

## 스타일

- 스타일 작업 전 `src/view/style` 을 먼저 참조한다. 공통 변수·믹스인·테마·크기 값이 정의되어 있으므로 중복 선언 없이 재사용하고, 필요하면 기존 스타일을 확장·수정한다.
- TS 파일을 리팩토링할 때 같은 이름의 SCSS 파일이 있으면 스타일 리팩토링도 함께 한다.

## UI/UX 화면 기준

| 우선순위 | 모니터 | 방향 | 비고 |
| --- | --- | --- | --- |
| **1 (기본)** | 24인치 | 세로 | 기준 해상도로 설계 |
| 2 | 32인치 | 세로 | 1번 기준에서 확장 대응 |
| 3 | 32인치 | 가로 | 와이드 레이아웃 대응 |

- 레이아웃·간격·폰트 크기는 **24인치 세로**에서 최적으로 보여야 한다. 세로 모니터에서는 스크롤보다 수직 공간 활용을 우선한다.
- 가로 모니터 대응은 `@media` 또는 CSS Grid/Flex 의 자연스러운 흐름으로 처리하되, 별도 대응이 필요한 경우에만 breakpoint 를 추가한다.

## 컴포넌트 구현 패턴

새 Web Component 작성, 베이스 클래스 선택, import 별칭 활용 등 상세 가이드는 `.claude/skills/web-frontend-component/SKILL.md` 참조.

## 스크립트

```bash
yarn dev          # 개발 빌드 + 파일 감시
yarn build        # 프로덕션 빌드 (dist/)
yarn type-check   # TypeScript 타입 검사
yarn lint         # ESLint 자동 수정 (루트 .eslintrc.js)
yarn format       # Prettier 포맷
```

## Playwright 테스트 (`flay-web/playwright/`)

- 이전에 띄운 브라우저는 닫혀 있을 가능성이 높다 — 닫혀 있으면 새 브라우저를 열어 테스트한다.
- 웹팩 dev 서버(`yarn dev`)와 backend 가 실행 중인지 먼저 확인한다.
- URL 은 `https://flay.kamoru.jk/dist/` 를 베이스로 webpack 엔트리 html 로 접근한다 (예: `https://flay.kamoru.jk/dist/page.history-shot.html`).
- MCP Playwright 는 다크 테마(`<html theme="dark">`)로 실행된다 — 테마 관련 테스트 시 고려.
- 스크린샷 `filename` 은 항상 `.playwright-mcp/` 하위로 지정하고(`--output-dir` 설정은 스냅샷·로그에만 적용됨), 확장자와 `type` 파라미터를 일치시킨다(`type: "png"` ↔ `.png`). 불일치 시 API 400 오류.
