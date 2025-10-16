# FlayPIP - Document Picture-in-Picture 모듈

Document Picture-in-Picture API를 사용하여 PIP(Picture-in-Picture) 기능을 제공하는 TypeScript 모듈입니다.

## 주요 기능

- **PIP 창 관리**: 외부에서 호출하면 PIP 화면을 켜고 관리
- **콘텐츠 설정**: PIP에 들어갈 내용을 설정할 수 있는 함수 제공
- **크기 조절**: PIP 창의 크기를 동적으로 조절
- **위치 조정**: PIP 창의 위치를 원하는 곳으로 이동
- **스타일 복사**: 메인 페이지의 CSS 스타일을 PIP 창으로 자동 복사

## 브라우저 지원

Document Picture-in-Picture API는 다음 브라우저에서 지원됩니다:

- Chrome 116+ (2023년 8월부터)
- Edge 116+
- Safari: 지원 예정
- Firefox: 지원 예정

## 설치 및 사용법

### 기본 사용법

```typescript
import { flayPIP, openPIP, closePIP, isPIPSupported } from './ui/FlayPIP';

// PIP 지원 여부 확인
if (isPIPSupported()) {
  // 표시할 콘텐츠 생성
  const contentElement = document.createElement('div');
  contentElement.innerHTML = '<h1>Hello PIP!</h1>';
  
  // PIP 창 열기
  await openPIP(contentElement, {
    width: 400,
    height: 300,
    x: 100,
    y: 100
  });
}

// PIP 창 닫기
closePIP();
```

### 클래스 인스턴스 사용법

```typescript
import { flayPIP } from './ui/FlayPIP';

// PIP 창 열기
const element = document.getElementById('my-content');
await flayPIP.openPIP(element, {
  width: 500,
  height: 400
});

// 콘텐츠 업데이트
const newElement = document.createElement('div');
newElement.textContent = '업데이트된 콘텐츠';
flayPIP.setContent(newElement);

// 크기 조절
flayPIP.resizePIP(600, 450);

// 위치 이동
flayPIP.setPosition(200, 150);

// 설정 확인
const config = flayPIP.getConfig();
console.log('현재 PIP 설정:', config);

// PIP 창 닫기
flayPIP.closePIP();
```

## API 레퍼런스

### FlayPIP 클래스

#### 메서드

##### `isSupported(): boolean`

- PIP 기능 지원 여부를 확인합니다.
- **반환값**: `true`면 지원, `false`면 미지원

##### `isOpen(): boolean`

- 현재 PIP 창이 열려있는지 확인합니다.
- **반환값**: `true`면 열림, `false`면 닫힘

##### `openPIP(element: HTMLElement, config?: Partial<PIPConfig>): Promise<boolean>`

- PIP 창을 열고 콘텐츠를 설정합니다.
- **매개변수**:
  - `element`: 표시할 HTML 요소
  - `config`: PIP 설정 옵션 (선택사항)
- **반환값**: 성공 시 `true`, 실패 시 `false`

##### `closePIP(): void`

- PIP 창을 닫습니다.

##### `setContent(element: HTMLElement): void`

- PIP 창에 표시할 콘텐츠를 설정합니다.
- **매개변수**: `element` - 표시할 HTML 요소

##### `setHTMLContent(html: string): void`

- PIP 창에 HTML 문자열을 직접 설정합니다.
- **매개변수**: `html` - HTML 문자열

##### `resizePIP(width: number, height: number): void`

- PIP 창의 크기를 조절합니다.
- **매개변수**:
  - `width`: 새 너비 (픽셀)
  - `height`: 새 높이 (픽셀)

##### `setPosition(x: number, y: number): void`

- PIP 창의 위치를 조정합니다.
- **매개변수**:
  - `x`: X 좌표 (픽셀)
  - `y`: Y 좌표 (픽셀)

##### `togglePIP(element: HTMLElement, config?: Partial<PIPConfig>): Promise<boolean>`

- PIP 창을 토글합니다 (열려있으면 닫고, 닫혀있으면 엽니다).
- **매개변수**:
  - `element`: 표시할 HTML 요소
  - `config`: PIP 설정 옵션 (선택사항)
- **반환값**: 열린 경우 `true`, 닫힌 경우 `false`

##### `getConfig(): Required<PIPConfig>`

- 현재 PIP 설정을 반환합니다.
- **반환값**: 현재 PIP 설정 객체

##### `updateConfig(config: Partial<PIPConfig>): void`

- PIP 설정을 업데이트합니다.
- **매개변수**: `config` - 업데이트할 설정

##### `getPIPDocument(): Document | null`

- PIP 창의 Document 객체를 반환합니다.
- **반환값**: PIP Document 또는 `null`

### PIPConfig 인터페이스

```typescript
interface PIPConfig {
  width?: number;        // PIP 창 너비 (기본값: 400)
  height?: number;       // PIP 창 높이 (기본값: 300)
  x?: number;           // PIP 창 X 위치 (기본값: 화면 우측)
  y?: number;           // PIP 창 Y 위치 (기본값: 50)
  alwaysOnTop?: boolean; // 항상 위에 표시 (기본값: true)
}
```

### 편의 함수들

```typescript
// PIP 창 열기
openPIP(element: HTMLElement, config?: Partial<PIPConfig>): Promise<boolean>

// PIP 창 닫기
closePIP(): void

// PIP 창 토글
togglePIP(element: HTMLElement, config?: Partial<PIPConfig>): Promise<boolean>

// PIP 지원 여부 확인
isPIPSupported(): boolean

// PIP 열림 상태 확인
isPIPOpen(): boolean
```

## 사용 예제

### 1. 기본 예제

```typescript
import { openPIP, isPIPSupported } from './ui/FlayPIP';

async function showBasicPIP() {
  if (!isPIPSupported()) {
    alert('PIP를 지원하지 않는 브라우저입니다.');
    return;
  }

  const content = document.createElement('div');
  content.innerHTML = `
    <h3>Picture-in-Picture 데모</h3>
    <p>현재 시간: ${new Date().toLocaleTimeString()}</p>
  `;

  await openPIP(content, {
    width: 400,
    height: 200,
    x: 100,
    y: 100
  });
}
```

### 2. 실시간 업데이트 예제

```typescript
import { flayPIP } from './ui/FlayPIP';

async function showLiveClock() {
  const clockElement = document.createElement('div');
  clockElement.style.cssText = `
    padding: 20px;
    text-align: center;
    font-size: 24px;
    background: #333;
    color: white;
  `;

  await flayPIP.openPIP(clockElement, {
    width: 300,
    height: 100
  });

  // 1초마다 시간 업데이트
  const updateClock = () => {
    if (flayPIP.isOpen()) {
      clockElement.textContent = new Date().toLocaleTimeString();
      setTimeout(updateClock, 1000);
    }
  };
  
  updateClock();
}
```

### 3. 동적 크기 조절 예제

```typescript
import { flayPIP } from './ui/FlayPIP';

async function showResizablePIP() {
  const container = document.createElement('div');
  container.innerHTML = `
    <div style="padding: 20px;">
      <h3>크기 조절 가능한 PIP</h3>
      <button onclick="resizeSmall()">작게</button>
      <button onclick="resizeMedium()">중간</button>
      <button onclick="resizeLarge()">크게</button>
    </div>
  `;

  await flayPIP.openPIP(container);

  // 전역 함수로 등록
  (window as any).resizeSmall = () => flayPIP.resizePIP(300, 200);
  (window as any).resizeMedium = () => flayPIP.resizePIP(500, 350);
  (window as any).resizeLarge = () => flayPIP.resizePIP(700, 500);
}
```

### 4. 비디오 플레이어 PIP 예제

```typescript
async function showVideoPlayerPIP() {
  const videoContainer = document.createElement('div');
  videoContainer.innerHTML = `
    <div style="background: #000; padding: 10px;">
      <video width="100%" height="200" controls>
        <source src="sample-video.mp4" type="video/mp4">
      </video>
      <div style="text-align: center; margin-top: 10px;">
        <button>⏸️</button>
        <button>⏭️</button>
        <button>🔊</button>
      </div>
    </div>
  `;

  await flayPIP.openPIP(videoContainer, {
    width: 400,
    height: 280,
    x: window.screen.width - 450,
    y: 100
  });
}
```

## 주의사항

1. **브라우저 지원**: Document Picture-in-Picture API는 최신 브라우저에서만 지원됩니다.
2. **사용자 상호작용**: PIP 창은 사용자 제스처(클릭, 키보드 입력 등) 후에만 열 수 있습니다.
3. **단일 창**: 한 번에 하나의 PIP 창만 열 수 있습니다.
4. **스타일 복사**: 메인 페이지의 CSS가 PIP 창으로 복사되지만, 일부 스타일은 제대로 적용되지 않을 수 있습니다.
5. **이벤트 처리**: PIP 창의 DOM 요소에 이벤트를 추가할 때는 PIP 창이 완전히 로드된 후에 추가해야 합니다.

## 개발자 정보

- **작성자**: CrazyJK
- **작성일**: 2025-10-16
- **라이선스**: MIT License

## 기여하기

이 모듈은 Flay Ground 프로젝트의 일부입니다. 개선사항이나 버그 리포트는 GitHub Issues를 통해 제출해 주세요.
