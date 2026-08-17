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

- **`yarn dev`(watch) 가 떠 있는 동안 `yarn build` 를 돌리지 말 것.** 둘 다 같은 `dist/` 를 쓰는데, 프로덕션 빌드가 `dist/` 를 비우고 해시 이름 산출물을 쓰면 이후 개발 watch 의 증분 빌드는 JS/CSS 를 "cached" 로 보고 다시 쓰지 않아 페이지가 `runtime.js` 등 404 로 깨진다. 코드 변경 검증은 `yarn type-check` 로 하고, 프로덕션 빌드가 꼭 필요하면 빌드 후 watch 를 재기동한다(인앱 개발 모드면 frontend 백그라운드 작업 중지 → 다시 `tail -f /dev/null | yarn dev`).

## 화면 확인·E2E (`flay-web/playwright/`)

- 화면 동작 확인은 클로드의 브라우저 도구(크롬)로 페이지를 직접 열어서 한다(자체 서명 인증서 경고 무시). E2E 테스트는 `flay-web/playwright/`.
- 웹팩 dev 서버(`yarn dev`)와 backend 가 실행 중인지 먼저 확인한다.
- URL 은 `https://flay.kamoru.jk/dist/` 를 베이스로 webpack 엔트리 html 로 접근한다 (예: `https://flay.kamoru.jk/dist/page.history-shot.html`).
