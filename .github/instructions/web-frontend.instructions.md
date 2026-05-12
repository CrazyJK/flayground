---
applyTo: 'web-frontend/**'
---

# web-frontend 작업 지침

Webpack 5 + TypeScript 멀티 엔트리 SPA. 프레임워크 없이 Web Components(Custom Elements) 사용.

## 기술 스택

- **언어**: TypeScript (strict 모드, noUnusedLocals·noUnusedParameters 활성화)
- **컴포넌트**: Web Components (Custom HTML Elements)
- **스타일**: SCSS (컴포넌트별 동반 파일)
- **번들러**: Webpack 5
- **주요 라이브러리**: ECharts, Toast UI Editor, D3 Hierarchy

## 디렉토리 구조

```
src/
├── base/           # 베이스 클래스 (GroundFlay, GroundUI, GroundNav 등)
├── flay/           # Flay 도메인 컴포넌트
├── diary/          # 다이어리 모듈
├── finance/        # 금융 노트 (기관·계좌·스냅샷·포트폴리오)
├── image/          # 이미지 갤러리
├── movie/          # 영상 재생
├── pension/        # 연금 플래너
├── ai/             # AI 연동
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

## UI/UX 화면 기준

UI/UX 작업 시 아래 순서로 화면을 고려한다.

| 우선순위     | 모니터 | 방향 | 비고                   |
| ------------ | ------ | ---- | ---------------------- |
| **1 (기본)** | 24인치 | 세로 | 기준 해상도로 설계     |
| 2            | 32인치 | 세로 | 1번 기준에서 확장 대응 |
| 3            | 32인치 | 가로 | 와이드 레이아웃 대응   |

- 레이아웃·간격·폰트 크기는 **24인치 세로**에서 최적으로 보여야 한다.
- 세로 모니터에서는 스크롤보다 수직 공간 활용을 우선한다.
- 가로 모니터 대응은 `@media` 또는 CSS Grid/Flex의 자연스러운 흐름으로 처리하되, 별도 대응이 필요한 경우에만 breakpoint를 추가한다.

## import 경로

- `web-frontend/src` 하위 소스에서 import 시 `web-frontend/tsconfig.json`의 `paths` 별칭을 사용한다.
  - `@ai/*`, `@attach/*`, `@base/*`, `@diary/*`, `@editor/*`, `@finance/*`, `@flay/*`
  - `@image/*`, `@lib/*`, `@movie/*`, `@nav/*`, `@spa/*`, `@svg/*`, `@domain/*`
  - 예: `import { showAlert } from '@lib/components/showAlert';`
  - 상대 경로(`../../base/...`) 대신 별칭 경로를 우선 사용한다.

## 스타일 참조

- `web-frontend/src` 하위 소스에서 스타일 작업 시 `web-frontend/src/view/style` 디렉토리를 먼저 참조할 것
  - 공통 변수, 믹스인, 테마, 크기 값 등이 정의되어 있으므로 중복 선언 없이 재사용
  - 새 스타일 추가 전 해당 디렉토리에 이미 정의된 것이 있는지 확인
  - 필요시 기존 스타일을 확장하거나 수정하여 사용

## 컴포넌트 구현 패턴

새 Web Component 작성, 베이스 클래스 선택, import 별칭 활용 등 상세 가이드는
`.github/skills/web-frontend-component/SKILL.md` 참조.

## 스크립트

```bash
yarn dev          # 개발 빌드 + 파일 감시
yarn build        # 프로덕션 빌드 (public/)
yarn type-check   # TypeScript 타입 검사
yarn lint         # ESLint 자동 수정
yarn format       # Prettier 포맷
```

## Playwright 테스트

이전 수행된 브라우저가 닫혀 있을 가능성이 높음.
브라우저가 닫혀 있을 때는 새 브라우저를 열어서 테스트를 수행해야 합니다.

웹팩 dev 서버(`yarn dev`)가 실행 중인지 먼저 확인해야 합니다.

### URL 접근

URL은 `https://flay.kamoru.jk/dist/`를 베이스로 webpack의 엔트리 포인트의 html로 접근해야 합니다.
(예: `https://flay.kamoru.jk/dist/page.history-shot.html`)

### 테마 설정

MCP Playwright는 다크 테마로 실행된다. `<html theme="dark">`이 적용된 상태로 테스트가 진행되므로,
테마 관련 테스트를 작성할 때는 이 점을 고려해야 합니다.

### 스크린샷 규칙

MCP playwright의 `--output-dir .playwright-mcp` 설정은 자동 생성되는 스냅샷(`.yml`)과 콘솔 로그(`.log`)에만 적용된다.
`mcp_playwright_browser_take_screenshot`의 `filename`은 이 설정과 무관하게 동작한다.

스크린샷 저장 시 반드시 지켜야 할 두 가지:

1. **저장 경로**: `filename`은 항상 `.playwright-mcp/` 하위로 지정한다.
   - 올바른 예: `filename: ".playwright-mcp/screenshot.png"`
   - 잘못된 예: `filename: "screenshot.png"` (워크스페이스 루트에 저장됨)

2. **확장자와 type 일치**: `filename` 확장자와 `type` 파라미터를 반드시 일치시킨다.
   - `type: "png"` → `filename: "...screenshot.png"`
   - `type: "jpeg"` → `filename: "...screenshot.jpeg"`
   - 불일치 시 Claude API가 `400 invalid_request_error` 오류를 반환함
