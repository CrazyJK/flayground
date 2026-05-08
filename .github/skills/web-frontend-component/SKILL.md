---
name: web-frontend-component
description: 'web-frontend 컴포넌트 구현 패턴. Use when: 새 컴포넌트 생성, Web Component 구현, HTMLElement 상속 패턴, TypeScript 커스텀 엘리먼트, SCSS 스타일 작성, import 별칭(@lib, @flay, @base 등) 사용, 공통 유틸리티 활용, SPA 컴포넌트, 도메인 컴포넌트(flay, diary, finance, image, movie)'
argument-hint: '구현할 컴포넌트명 또는 도메인 (예: FlayCard, KamoruDiary, finance)'
---

# web-frontend 컴포넌트 구현 패턴

## 기술 스택

- **언어**: TypeScript (Vanilla) — 프레임워크 없음
- **컴포넌트**: Web Components (Custom HTML Elements)
- **스타일**: SCSS (컴포넌트별 동반 파일)
- **번들러**: Webpack

---

## 디렉토리 구조

```
web-frontend/src/
├── base/           # 베이스 클래스 (GroundFlay, GroundUI, GroundNav 등)
├── flay/           # Flay 도메인 컴포넌트
│   ├── domain/     # 단일 카드/아이템 수준
│   │   └── part/   # 서브 컴포넌트
│   └── panel/      # 복합 패널
├── diary/          # 다이어리 모듈
├── finance/        # 금융 모듈
├── image/          # 이미지 컴포넌트
├── movie/          # 영화 모듈
├── lib/
│   ├── common/     # 유틸리티 (DateUtils, NumberUtils, StringUtils...)
│   ├── components/ # 재사용 UI (ModalWindow, showAlert, GridControl...)
│   ├── browser/    # 브라우저 API (SseConnector, PushNotification...)
│   ├── services/   # API 클라이언트 (FlayFetch, ApiClient, FlaySearch)
│   └── storage/    # 저장소 (FlayStorage)
├── nav/            # 네비게이션 (SideNavBar)
├── view/
│   ├── style/      # 글로벌 SCSS (테마, 레이아웃, 엘리먼트)
│   ├── page.*.html/ts  # 페이지 진입점
│   └── popup.*.html/ts # 팝업 진입점
└── types/          # 공유 타입 정의
```

---

## Import 별칭 (tsconfig.json paths)

상대 경로 대신 반드시 아래 별칭을 사용한다:

```typescript
import GroundFlay from '@base/GroundFlay';
import { FlayCard } from '@flay/domain/FlayCard';
import DateUtils from '@lib/common/DateUtils';
import { showConfirm } from '@lib/components/showConfirm';
import ApiClient from '@lib/services/ApiClient';
import FlayFetch from '@lib/services/FlayFetch';
import { FlayStorage } from '@lib/storage/FlayStorage';
import { Flay } from '@domain/flay'; // 백엔드 도메인 타입 공유
```

| 별칭         | 경로                          |
| ------------ | ----------------------------- |
| `@ai/*`      | `src/ai/*`                    |
| `@attach/*`  | `src/attach/*`                |
| `@base/*`    | `src/base/*`                  |
| `@diary/*`   | `src/diary/*`                 |
| `@editor/*`  | `src/editor/*`                |
| `@finance/*` | `src/finance/*`               |
| `@flay/*`    | `src/flay/*`                  |
| `@image/*`   | `src/image/*`                 |
| `@lib/*`     | `src/lib/*`                   |
| `@movie/*`   | `src/movie/*`                 |
| `@nav/*`     | `src/nav/*`                   |
| `@spa/*`     | `src/spa/*`                   |
| `@svg/*`     | `src/svg/*`                   |
| `@domain/*`  | `../web-backend/src/domain/*` |

---

## 베이스 클래스 선택

| 상황                 | 베이스 클래스                 |
| -------------------- | ----------------------------- |
| Flay 도메인 컴포넌트 | `GroundFlay`                  |
| 일반 UI 컴포넌트     | `GroundUI` 또는 `HTMLElement` |
| 네비게이션           | `GroundNav`                   |
| Flay 목록 페이지     | `FlayListComponent`           |
| Flay 상세 페이지     | `FlayDetailComponent`         |

---

## 컴포넌트 구현 절차

### 1단계: 베이스 클래스 결정

도메인 또는 역할에 따라 위 표에서 베이스 클래스를 선택한다.

### 2단계: TypeScript 파일 생성

```typescript
import './MyComponent.scss';
import GroundFlay from '@base/GroundFlay';
import FlayFetch from '@lib/services/FlayFetch';
import { Flay } from '@domain/flay';

/**
 * MyComponent - [컴포넌트 설명]
 *
 * @example
 * const comp = new MyComponent();
 * document.body.appendChild(comp);
 * await comp.load(opus);
 */
export default class MyComponent extends GroundFlay {
  // 프라이빗 필드는 # 접두어 사용
  #data: Flay | null = null;

  // 서브 컴포넌트 참조는 인스턴스 필드로 선언
  #titleEl: HTMLElement;
  #bodyEl: HTMLElement;

  constructor() {
    super();
    this.classList.add('my-component');

    // 간단한 구조는 innerHTML 템플릿 사용
    this.innerHTML = `
      <div class="title"></div>
      <div class="body"></div>
    `;

    this.#titleEl = this.querySelector('.title')!;
    this.#bodyEl = this.querySelector('.body')!;
  }

  connectedCallback() {
    // 이벤트 리스너는 connectedCallback에서 등록
    this.addEventListener('click', this.#handleClick);
  }

  disconnectedCallback() {
    // 반드시 해제
    this.removeEventListener('click', this.#handleClick);
  }

  /**
   * 데이터 로드 및 렌더링
   */
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

// Web Component 등록
customElements.define('my-component', MyComponent);
```

### 3단계: SCSS 파일 생성 (동반 파일)

```scss
// src/view/style/ 의 변수/믹스인을 우선 활용
// 새 색상/크기 값은 theme 변수에서 가져옴

my-component {
  display: block;

  .title {
    font-size: var(--size-large);
    color: var(--color-dark);
  }

  .body {
    padding: var(--size-normal);
    border-radius: var(--border-radius-large);
  }
}
```

**SCSS 변수 우선 참조**: `src/view/style/1.theme.scss`  
자주 쓰는 변수: `--size-*`, `--color-*`, `--border-radius-*`

### 4단계: 커스텀 엘리먼트 등록 확인

```typescript
// 파일 하단에 등록
customElements.define('tag-name', MyComponent);
```

```html
<!-- HTML에서 사용 -->
<my-component></my-component>
```

또는 JS에서 직접 생성: html보다 JS에서 직접 생성하는 경우가 많고, 권장한다.

```typescript
const comp = new MyComponent();
container.appendChild(comp);
```

---

## 공통 라이브러리 활용

### 유틸리티 (`@lib/common/`)

```typescript
import DateUtils from '@lib/common/DateUtils';
import NumberUtils from '@lib/common/NumberUtils';
import StringUtils from '@lib/common/StringUtils';
```

### 다이얼로그 (`@lib/components/`)

```typescript
import { showAlert } from '@lib/components/showAlert';
import { showConfirm } from '@lib/components/showConfirm';
import { showDialog } from '@lib/components/showDialog';

await showConfirm('삭제하시겠습니까?');
```

### API 호출 (`@lib/services/`)

```typescript
import FlayFetch from '@lib/services/FlayFetch'; // Flay 전용 API
import ApiClient from '@lib/services/ApiClient'; // 범용 HTTP
```

### 로컬 스토리지 (`@lib/storage/`)

```typescript
import { FlayStorage } from '@lib/storage/FlayStorage';
FlayStorage.set('key', value);
const val = FlayStorage.get<MyType>('key');
```

---

## 검증 체크리스트

- [ ] 베이스 클래스가 도메인/역할에 맞게 선택됨
- [ ] import는 모두 별칭(`@lib/`, `@base/` 등) 사용 (상대 경로 금지)
- [ ] SCSS 파일이 동반 생성되어 TS에서 import됨
- [ ] SCSS에서 글로벌 변수(`--size-*`, `--color-*`) 활용
- [ ] 이벤트 리스너는 `connectedCallback`에서 등록, `disconnectedCallback`에서 해제
- [ ] 프라이빗 메서드/필드는 `#` 접두어 사용
- [ ] `customElements.define()` 등록 완료
- [ ] 새 유틸리티 로직은 `@lib/common/`에 이미 있는지 먼저 확인
