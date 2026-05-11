# web-frontend — Claude 지침

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

## Import 별칭 (tsconfig.json paths)

상대 경로(`../../base/...`) 대신 반드시 별칭을 사용한다:

| 별칭 | 경로 |
|------|------|
| `@ai/*` | `src/ai/*` |
| `@attach/*` | `src/attach/*` |
| `@base/*` | `src/base/*` |
| `@diary/*` | `src/diary/*` |
| `@editor/*` | `src/editor/*` |
| `@finance/*` | `src/finance/*` |
| `@flay/*` | `src/flay/*` |
| `@image/*` | `src/image/*` |
| `@lib/*` | `src/lib/*` |
| `@movie/*` | `src/movie/*` |
| `@nav/*` | `src/nav/*` |
| `@spa/*` | `src/spa/*` |
| `@svg/*` | `src/svg/*` |
| `@domain/*` | `../web-backend/src/domain/*` |

```typescript
// 올바른 예
import GroundFlay from '@base/GroundFlay';
import DateUtils from '@lib/common/DateUtils';
import { showAlert } from '@lib/components/showAlert';
import ApiClient from '@lib/services/ApiClient';
```

## 스타일 작업

- 스타일 수정 전 `src/view/style/` 를 먼저 참조 (공통 변수·믹스인·테마)
- 자주 쓰는 변수: `--size-*`, `--color-*`, `--border-radius-*` (`1.theme.scss`)
- 중복 선언보다 기존 스타일 확장·수정 우선
- TS 파일 리팩토링 시 동반 SCSS 파일이 있으면 함께 수정

## 베이스 클래스 선택

| 상황 | 베이스 클래스 |
|------|--------------|
| Flay 도메인 컴포넌트 | `GroundFlay` |
| 일반 UI 컴포넌트 | `GroundUI` 또는 `HTMLElement` |
| 네비게이션 | `GroundNav` |

## 컴포넌트 구현 패턴

```typescript
import './MyComponent.scss';
import GroundFlay from '@base/GroundFlay';
import FlayFetch from '@lib/services/FlayFetch';
import { Flay } from '@domain/flay';

/**
 * MyComponent - [컴포넌트 설명]
 */
export default class MyComponent extends GroundFlay {
  #data: Flay | null = null;
  #titleEl: HTMLElement;

  constructor() {
    super();
    this.classList.add('my-component');
    this.innerHTML = `<div class="title"></div>`;
    this.#titleEl = this.querySelector('.title')!;
  }

  connectedCallback() {
    this.addEventListener('click', this.#handleClick);
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.#handleClick);  // 반드시 해제
  }

  async load(opus: string): Promise<void> {
    const flay = await FlayFetch.get(opus);
    this.#data = flay;
    this.#render();
  }

  #render(): void {
    if (!this.#data) return;
    this.#titleEl.textContent = this.#data.title;
  }

  #handleClick = (e: MouseEvent): void => {
    // 화살표 함수로 this 바인딩 유지
  };
}

customElements.define('my-component', MyComponent);
```

## 유틸리티 함수 규칙

1. `src/lib/common/` 하위 유틸리티(`*Utils.ts`)를 먼저 탐색하고 재사용
2. 기존으로 불충분할 때만 신규 추가 또는 기존 파일 확장
3. 유틸리티 시그니처·동작 수정 시 기존 참조(호출부) 모두 파악하고 함께 수정

## UI/UX 화면 기준

| 우선순위 | 모니터 | 방향 |
|---------|--------|------|
| **1 (기본)** | 24인치 | 세로 |
| 2 | 32인치 | 세로 |
| 3 | 32인치 | 가로 |

- 레이아웃·간격·폰트는 24인치 세로 기준으로 최적화
- 세로 모니터: 스크롤보다 수직 공간 활용 우선

## 스크립트

```bash
yarn dev          # 개발 빌드 + 파일 감시
yarn build        # 프로덕션 빌드 (public/)
yarn type-check   # TypeScript 타입 검사
yarn lint         # ESLint 자동 수정
yarn format       # Prettier 포맷
```
