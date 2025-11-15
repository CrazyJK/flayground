# playwright 사용 정리

## 설치

```sh
yarn add -D @playwright/test
yarn playwright install

# 특정 브라우저만 설치
yarn playwright install chromium
yarn playwright install firefox
yarn playwright install webkit
```

## 설정

playwright.config.cjs

```js
module.exports = {
  // 테스트 결과 저장 위치
  outputDir: './playwright/playwright-test-results',

  // 테스트 파일 패턴
  testMatch: '**/*.test.cjs',

  // 타임아웃 설정 (기본 30초)
  timeout: 30000,

  // 재시도 횟수
  retries: 2,

  // 병렬 실행 워커 수
  workers: 4,

  use: {
    // 브라우저 헤드리스 모드
    headless: true,

    // 기본 URL (상대 경로 사용 가능)
    baseURL: 'https://flay.kamoru.jk',

    // 뷰포트(화면) 크기 설정
    viewport: { width: 1920, height: 1080 },

    // 스크린샷 설정
    screenshot: 'only-on-failure',

    // 비디오 녹화 설정
    video: 'retain-on-failure',

    // 네비게이션 타임아웃
    navigationTimeout: 30000,

    // 액션 타임아웃
    actionTimeout: 10000,
  },

  // 프로젝트별 브라우저 설정
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
    {
      name: 'firefox',
      use: { browserName: 'firefox' },
    },
    {
      name: 'webkit',
      use: { browserName: 'webkit' },
    },
  ],
};
```

## 실행

```sh
# 모든 테스트 실행
www> yarn playwright test

# 특정 파일 실행
www> yarn playwright test ./playwright/playwright.test.cjs

# 특정 테스트만 실행 (-g 옵션으로 테스트 이름 패턴 지정)
www> yarn playwright test -g "interact with flay.kamoru.jk page"
www> yarn playwright test ./playwright/playwright.test.cjs -g "interact"
www> yarn playwright test -g "interact.*page"

# 특정 브라우저로 실행
www> yarn playwright test --project=chromium

# UI 모드로 실행
www> yarn playwright test --ui

# 디버그 모드
www> yarn playwright test --debug

# 헤드 모드 (브라우저 UI 표시)
www> yarn playwright test --headed

# 리포트 보기
www> yarn playwright show-report
```

### 테스트 필터링

테스트 코드에서 `.only`나 `.skip` 사용:

```js
// 이 테스트만 실행
test.only('specific test', async ({ page }) => {
  // ...
});

// 이 테스트는 건너뛰기
test.skip('skip this test', async ({ page }) => {
  // ...
});

// 조건부 스킵
test('conditional skip', async ({ page, browserName }) => {
  test.skip(browserName === 'firefox', 'This test is not for Firefox');
  // ...
});
```

## 주요 API

### 페이지 네비게이션

```js
// 페이지 이동
await page.goto('https://example.com');

// 뒤로가기/앞으로가기
await page.goBack();
await page.goForward();

// 새로고침
await page.reload();
```

### 요소 선택 및 액션

```js
// 클릭
await page.click('button');
await page.click('text=Submit');

// 더블 클릭, 우클릭
await page.dblclick('button');
await page.click('button', { button: 'right' });

// 입력
await page.fill('input[name="email"]', 'test@example.com');
await page.type('input', 'Hello', { delay: 100 });

// 선택
await page.selectOption('select#colors', 'blue');

// 체크박스/라디오
await page.check('input[type="checkbox"]');
await page.uncheck('input[type="checkbox"]');

// 호버
await page.hover('.menu-item');

// 포커스
await page.focus('input');

// 키보드 입력
await page.keyboard.press('Enter');
await page.keyboard.press('Space');
await page.keyboard.type('Hello World');
await page.keyboard.down('Shift');
await page.keyboard.up('Shift');
```

### 화면 크기 설정

```js
// 테스트 내에서 뷰포트 크기 설정
await page.setViewportSize({ width: 1920, height: 1080 });

// 일반적인 해상도들
await page.setViewportSize({ width: 1920, height: 1080 }); // Full HD
await page.setViewportSize({ width: 1280, height: 720 }); // HD
await page.setViewportSize({ width: 1366, height: 768 }); // 노트북
await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
await page.setViewportSize({ width: 414, height: 896 }); // iPhone 11

// 특정 테스트에만 적용
test.use({ viewport: { width: 1920, height: 1080 } });
```

### 대기

```js
// 요소 대기
await page.waitForSelector('.loading', { state: 'hidden' });
await page.waitForSelector('button', { state: 'visible' });

// 네비게이션 대기
await page.waitForNavigation();
await page.waitForURL('**/dashboard');

// 로드 상태 대기
await page.waitForLoadState('networkidle'); // 모든 네트워크 요청 완료
await page.waitForLoadState('domcontentloaded'); // DOM 로드 완료
await page.waitForLoadState('load'); // load 이벤트 발생

// 시간 대기
await page.waitForTimeout(1000);

// 함수 대기 (커스텀 조건)
await page.waitForFunction(() => window.innerWidth < 1000);
await page.waitForFunction(() => window.dataLoaded === true);

// 특정 응답 대기
await page.waitForResponse((response) => response.url().includes('/api/') && response.status() === 200);

// 특정 요청 대기
await page.waitForRequest((request) => request.url().includes('/api/data'));
```

#### SSE(Server-Sent Events) 사용 시 대기 방법

SSE는 지속적인 연결이라 `networkidle`로는 감지 불가능:

```js
// 방법 1: 특정 요소가 나타날 때까지 대기
await page.waitForSelector('flay-title', { state: 'visible' });

// 방법 2: 페이지의 전역 변수나 상태 체크
await page.waitForFunction(() => {
  return window.dataLoaded === true; // 또는 window.flayDataReady 등
});

// 방법 3: 요소의 내용이 채워질 때까지 대기
await page.waitForFunction(() => {
  const element = document.querySelector('flay-title');
  return element && element.textContent.trim().length > 0;
});

// 방법 4: locator로 대기
await page.locator('flay-title').waitFor({ state: 'attached' });
await expect(page.locator('flay-title')).not.toBeEmpty({ timeout: 10000 });
```

### 데이터 추출

```js
// 텍스트 추출
const text = await page.textContent('.title');
const innerText = await page.innerText('.content');

// 속성 추출
const href = await page.getAttribute('a', 'href');

// 여러 요소 추출
const items = await page.$$eval('li', (elements) => elements.map((el) => el.textContent));

// 평가 실행
const result = await page.evaluate(() => {
  return document.title;
});
```

### 스크린샷 및 PDF

```js
// 전체 페이지 스크린샷
await page.screenshot({ path: 'screenshot.png', fullPage: true });

// 특정 요소 스크린샷
await page.locator('.card').screenshot({ path: 'card.png' });

// PDF 생성
await page.pdf({ path: 'page.pdf', format: 'A4' });
```

### 네트워크 제어

```js
// 요청 차단
await page.route('**/*.{png,jpg,jpeg}', (route) => route.abort());

// 응답 모킹
await page.route('**/api/data', (route) => {
  route.fulfill({
    status: 200,
    body: JSON.stringify({ data: 'mocked' }),
  });
});

// 요청 감시
page.on('request', (request) => console.log(request.url()));
page.on('response', (response) => console.log(response.status()));
```

## 검증 (Assertions)

```js
const { expect } = require('@playwright/test');

// 페이지 검증
await expect(page).toHaveTitle(/Pattern/);
await expect(page).toHaveURL('https://example.com');

// 요소 검증
await expect(page.locator('.success')).toBeVisible();
await expect(page.locator('button')).toBeEnabled();
await expect(page.locator('.error')).toBeHidden();
await expect(page.locator('input')).toHaveValue('test');
await expect(page.locator('.count')).toHaveText('5');
await expect(page.locator('a')).toHaveAttribute('href', '/home');

// 개수 검증
await expect(page.locator('li')).toHaveCount(10);

// 스크린샷 비교
await expect(page).toHaveScreenshot();
```

## Locator 전략

```js
// CSS 선택자
page.locator('.class');
page.locator('#id');
page.locator('button');

// 텍스트로 찾기
page.locator('text=Submit');
page.getByText('Submit');

// Role로 찾기
page.getByRole('button', { name: 'Submit' });
page.getByRole('link', { name: 'Home' });

// Label로 찾기
page.getByLabel('Email');

// Placeholder로 찾기
page.getByPlaceholder('Enter email');

// Test ID로 찾기
page.getByTestId('submit-button');

// 조합
page.locator('.container').locator('button').first();
page.locator('li').nth(2);
page.locator('div').filter({ hasText: 'Hello' });
```

## 디버깅 팁

```sh
# Playwright Inspector 사용
www> yarn playwright test --debug

# 특정 테스트만 디버그
www> yarn playwright test --debug -g "test name"

# Trace 수집
www> yarn playwright test --trace on
```

테스트 코드에서:

```js
// 브레이크포인트
await page.pause();

// 느린 실행
test.use({ slowMo: 1000 });

// 상세 로그
DEBUG=pw:api yarn playwright test
```

## 유용한 패턴

### Page Object Model

```js
class LoginPage {
  constructor(page) {
    this.page = page;
    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.loginButton = page.getByRole('button', { name: 'Login' });
  }

  async login(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
```

### 재사용 가능한 Fixture

```js
const { test: base } = require('@playwright/test');

const test = base.extend({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },
});
```

## 참고 자료

- [Playwright 공식 문서](https://playwright.dev)
- [API 레퍼런스](https://playwright.dev/docs/api/class-playwright)
- [Best Practices](https://playwright.dev/docs/best-practices)

## 자동화 스크립트로 사용하기

테스트가 아닌 자동화 작업(데이터 수집, 반복 작업 등)을 위해 사용:

### 기본 자동화 스크립트

```js
const { chromium } = require('playwright');

async function main() {
  // 브라우저 실행
  const browser = await chromium.launch({
    headless: true, // 백그라운드 실행
    slowMo: 100, // 각 액션 사이 지연
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  try {
    await page.goto('https://example.com');

    // 작업 수행
    const data = await page.evaluate(() => {
      return document.title;
    });

    console.log('결과:', data);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
```

### 실행 방법

```sh
# 일반 Node.js 스크립트로 실행
node automation-example.cjs

# 인자와 함께 실행
node automation-advanced.cjs collect

# 크론 작업 (Linux/WSL)
0 */6 * * * cd /path/to/project && node automation.cjs

# 윈도우 작업 스케줄러
schtasks /create /tn "Playwright Automation" /tr "node C:\path\to\automation.cjs" /sc daily /st 09:00
```

### 주요 차이점

| 구분          | 테스트 (`@playwright/test`) | 자동화 (순수 Playwright) |
| ------------- | --------------------------- | ------------------------ |
| 실행          | `yarn playwright test`      | `node script.cjs`        |
| 프레임워크    | test, expect 등 포함        | 순수 API만 사용          |
| 리포터        | HTML 리포트, 스크린샷 자동  | 직접 구현 필요           |
| 용도          | E2E 테스트, UI 테스트       | 데이터 수집, 자동화 작업 |
| 브라우저 시작 | 자동                        | 직접 `launch()` 호출     |

### 고급 자동화 예제

**데이터 수집:**

```js
const data = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('.item')).map((el) => ({
    title: el.querySelector('.title').textContent,
    date: el.querySelector('.date').textContent,
  }));
});

await fs.writeFile('data.json', JSON.stringify(data, null, 2));
```

**로그인 상태 저장/복원:**

```js
// 저장
await context.storageState({ path: 'auth.json' });

// 복원
const context = await browser.newContext({
  storageState: 'auth.json',
});
```

**API 모니터링:**

```js
page.on('request', (req) => {
  if (req.url().includes('/api/')) {
    console.log(`${req.method()} ${req.url()}`);
  }
});
```

예제 파일: `automation-example.cjs`, `automation-advanced.cjs` 참고
