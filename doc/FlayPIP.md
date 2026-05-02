# FlayPIP 클래스 문서

FlayPIP는 Document Picture-in-Picture API를 이용해 별도 PIP 문서 창을 열고, 해당 창의 콘텐츠와 스타일을 관리하는 클래스입니다.

## 대상 소스

- web-frontend/src/lib/components/FlayPIP.ts

## 핵심 동작 요약

- 브라우저가 Document Picture-in-Picture를 지원하는지 확인한다.
- PIP 창이 없으면 새 창을 요청하고, 있으면 기존 창을 재사용한다.
- 전달된 콘텐츠(문자열 또는 HTMLElement)를 PIP body에 반영한다.
- 메인 문서의 theme 및 스타일(link/style)을 PIP 문서로 복사한다.
- PIP 창이 닫히면 내부 참조(pipWindow, pipDocument)를 정리한다.

## 공개 API

### `FlayPIP.isSupported(): boolean`

- 현재 브라우저에서 Document Picture-in-Picture API 지원 여부를 반환한다.

### `isOpen(): boolean`

- 현재 인스턴스의 PIP 창이 열려 있는지 반환한다.
- 내부적으로 `pipWindow` 존재 여부와 `closed` 상태를 함께 확인한다.

### `open(element: string | HTMLElement, options?: Partial<PIPOptions>): Promise<boolean>`

- PIP 창을 열고 콘텐츠를 반영한다.
- 이미 창이 열려 있으면 새 창을 만들지 않고 콘텐츠만 갱신한다.
- 성공 시 `true`, 실패 시 `false`를 반환한다.

#### options

- `width: number` (기본값: `400`)
- `height: number` (기본값: `300`)
- `append: boolean` (기본값: `false`)
- `clone: boolean` (기본값: `false`)

#### 옵션 의미

- `append = false`: 기존 body 내용을 비우고 새 콘텐츠로 교체
- `append = true`: 기존 body 끝에 콘텐츠 누적 추가
- `clone = true`: HTMLElement 전달 시 `cloneNode(true)` 후 붙임
- `clone = false`: 전달된 원본 노드를 그대로 이동/추가

### `closePIP(): void`

- PIP 창이 열려 있으면 닫고 내부 상태를 정리한다.

## 내부 처리 포인트

### 콘텐츠 반영 (`setContent`)

- 문자열은 `insertAdjacentHTML('beforeend', html)`로 추가한다.
- HTMLElement는 `appendChild`로 추가한다.

### 스타일 반영 (`copyStyles`)

- `applyTheme`를 통해 테마를 먼저 반영한다.
- `flay-pip-body` 클래스를 body에 추가한다.
- 메인 문서의 `link[rel="stylesheet"]`와 `style` 태그를 순회해 PIP 문서 head로 복사한다.

### 창 종료 처리 (`handlePIPClose`)

- `beforeunload` 이벤트 시 내부 참조를 `null`로 초기화한다.

## 사용 예시

```typescript
import { FlayPIP } from '../lib/components/FlayPIP';

const pip = new FlayPIP();

async function openClockPIP(): Promise<void> {
  if (!FlayPIP.isSupported()) {
    console.warn('이 브라우저는 Document Picture-in-Picture를 지원하지 않습니다.');
    return;
  }

  const container = document.createElement('div');
  container.innerHTML = '<h3>Clock</h3><p id="clock"></p>';

  const opened = await pip.open(container, {
    width: 360,
    height: 220,
    append: false,
    clone: true,
  });

  if (!opened) {
    return;
  }

  const timer = window.setInterval(() => {
    if (!pip.isOpen()) {
      window.clearInterval(timer);
      return;
    }

    const clock = container.querySelector('#clock');
    if (clock) {
      clock.textContent = new Date().toLocaleTimeString();
    }
  }, 1000);
}
```

## 현재 제약 사항

- Document Picture-in-Picture를 지원하는 브라우저에서만 동작한다.
- `string` 콘텐츠는 HTML로 바로 주입되므로 입력 신뢰성(XSS) 검증이 필요하다.
- 스타일 복사는 열릴 시점의 스냅샷 성격이며, 이후 동적 스타일 변경은 자동 동기화되지 않는다.
- API 특성상 창 위치 직접 지정, 강제 항상-위(on-top) 제어 등은 지원 범위가 제한된다.

## 추후 확장 가능한 기능

### 1) 생명주기 이벤트 훅 추가

- `onOpen`, `onClose`, `onContentUpdated`, `onError` 콜백을 옵션으로 제공.
- 외부 모듈에서 상태 동기화 및 로깅을 쉽게 연결 가능.

### 2) 안전한 HTML 렌더링 옵션

- `sanitizeHtml` 옵션을 추가해 문자열 입력 시 sanitizer를 거치도록 확장.
- 기본값은 비활성, 보안이 중요한 화면에서 선택적으로 활성화.

### 3) 스타일 실시간 동기화

- `MutationObserver`로 메인 문서의 `style/link` 변경을 감지해 PIP 문서에 반영.
- 테마 토글, 런타임 스타일 주입 환경에서 시각 일관성 향상.

### 4) 다중 레이아웃/템플릿 지원

- 콘텐츠를 단순 append가 아니라 슬롯(`header`, `body`, `footer`) 기반으로 구성.
- 공통 PIP UI(제목바, 액션 버튼, 상태 표시)를 재사용 가능한 구조로 제공.

### 5) 인스턴스 정책 확장

- 현재는 인스턴스별 단일 창 관리 중심 구조이므로,
- 필요 시 전역 단일 창 정책(싱글턴) 또는 논리 탭 기반 멀티 콘텐츠 정책 추가 가능.

### 6) 디버그/진단 유틸리티

- 현재 상태(`isOpen`, 마지막 옵션, 창 생성 시각) 조회 API 제공.
- 문제 상황 재현 및 운영 로그 수집을 쉽게 만드는 진단 도구로 활용 가능.
