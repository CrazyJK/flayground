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

### 비동기 액션 완료 대기 방법

클릭 등의 액션 후 비동기 처리가 완료될 때까지 대기하는 방법:

#### 1. 네트워크 응답 대기 (가장 정확)

```js
// 클릭 후 특정 API 응답 대기
const [response] = await Promise.all([
  page.waitForResponse((resp) => resp.url().includes('/api/update') && resp.status() === 200),
  page.click('#rank5'),
]);

console.log('응답 상태:', response.status());
const data = await response.json();
console.log('응답 데이터:', data);
```

#### 2. 요소 상태 변경 대기

```js
// 클릭 후 특정 요소가 나타날 때까지
await page.click('#rank5');
await page.waitForSelector('.success-message', { state: 'visible' });

// 로딩 인디케이터가 사라질 때까지
await page.click('#rank5');
await page.waitForSelector('.loading-spinner', { state: 'hidden' });

// 요소의 텍스트가 변경될 때까지
await page.click('#rank5');
await page.waitForFunction(
  () => document.querySelector('.status').textContent === '완료',
  { timeout: 10000 }
);
```

#### 3. DOM 변경 대기

```js
// 특정 속성이 변경될 때까지
await page.click('#rank5');
await page.waitForFunction(
  () => document.querySelector('#rank5').checked === true,
  { timeout: 5000 }
);

// 클래스가 추가/제거될 때까지
await page.click('#rank5');
await page.waitForFunction(
  () => document.querySelector('#rank5').classList.contains('active'),
  { timeout: 5000 }
);

// 요소 개수가 변경될 때까지
const initialCount = await page.locator('.item').count();
await page.click('#load-more');
await page.waitForFunction(
  (count) => document.querySelectorAll('.item').length > count,
  initialCount
);
```

#### 4. 네트워크 idle 상태 대기

```js
// 모든 네트워크 요청이 완료될 때까지
await page.click('#rank5');
await page.waitForLoadState('networkidle');

// 또는 Promise.all 사용
await Promise.all([page.waitForLoadState('networkidle'), page.click('#rank5')]);
```

#### 5. 페이지 전역 변수/플래그 확인

```js
// 페이지가 설정하는 전역 변수 체크
await page.click('#rank5');
await page.waitForFunction(() => window.ajaxComplete === true, { timeout: 10000 });

// jQuery가 있는 경우
await page.click('#rank5');
await page.waitForFunction(() => jQuery.active === 0);

// 진행 중인 fetch 개수 체크
await page.click('#rank5');
await page.waitForFunction(() => window.pendingRequests === 0);
```

#### 6. URL 변경 대기

```js
// URL이 변경될 때까지
await Promise.all([page.waitForURL('**/success'), page.click('#submit')]);

// 특정 URL 패턴으로 변경될 때까지
await Promise.all([page.waitForURL(/\/dashboard\?.*updated/), page.click('#save')]);
```

#### 7. 이벤트 리스너 활용

```js
// 커스텀 이벤트 대기
await page.click('#rank5');
await page.evaluate(() => {
  return new Promise((resolve) => {
    window.addEventListener('dataUpdated', resolve, { once: true });
  });
});

// 애니메이션 완료 대기
await page.click('#rank5');
await page.waitForFunction(() => {
  const el = document.querySelector('#rank5');
  return window.getComputedStyle(el).animationName === 'none';
});
```

#### 8. 요청 추적 및 대기

```js
// 모든 진행 중인 요청 추적
const pendingRequests = new Set();

page.on('request', (request) => {
  if (request.url().includes('/api/')) {
    pendingRequests.add(request);
  }
});

page.on('requestfinished', (request) => {
  pendingRequests.delete(request);
});

page.on('requestfailed', (request) => {
  pendingRequests.delete(request);
});

await page.click('#rank5');

// 모든 요청이 완료될 때까지 폴링
await page.waitForFunction(() => pendingRequests.size === 0, { timeout: 10000 });
```

#### 9. 복합 조건 대기

```js
// 여러 조건을 모두 만족할 때까지
await page.click('#rank5');
await page.waitForFunction(() => {
  const loading = document.querySelector('.loading');
  const data = document.querySelector('.data-container');
  const checkbox = document.querySelector('#rank5');

  return (
    (!loading || loading.style.display === 'none') && // 로딩 숨김
    data && data.children.length > 0 && // 데이터 존재
    checkbox.checked === true // 체크박스 체크됨
  );
}, { timeout: 15000 });
```

#### 10. 타임아웃과 재시도

```js
// 타임아웃 설정
try {
  await page.click('#rank5');
  await page.waitForSelector('.result', { state: 'visible', timeout: 5000 });
} catch (error) {
  console.log('타임아웃 발생, 재시도...');
  await page.click('#rank5', { force: true });
  await page.waitForSelector('.result', { state: 'visible', timeout: 10000 });
}

// 또는 폴링으로 대기
async function waitForCondition(page, condition, timeout = 10000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const result = await page.evaluate(condition);
    if (result) return true;
    await page.waitForTimeout(100);
  }
  throw new Error('조건 충족 타임아웃');
}

await page.click('#rank5');
await waitForCondition(page, () => document.querySelector('#rank5').checked);
```

#### 실전 예제

```js
// 체크박스 클릭 후 데이터 업데이트 완료까지 대기
async function clickAndWaitForUpdate(page, selector) {
  // 1. API 응답 대기
  const responsePromise = page.waitForResponse(
    (resp) => resp.url().includes('/api/update') && resp.status() === 200,
    { timeout: 10000 }
  );

  // 2. 클릭
  await page.click(selector, { force: true });

  // 3. 응답 완료 대기
  const response = await responsePromise;

  // 4. UI 업데이트 대기 (추가 안전장치)
  await page.waitForFunction(
    (sel) => document.querySelector(sel).classList.contains('updated'),
    selector,
    { timeout: 2000 }
  );

  console.log('업데이트 완료:', await response.json());
}

await clickAndWaitForUpdate(page, '#rank5');
```

**권장 순서:**

1. 네트워크 응답 대기 (가장 정확)
2. 요소 상태 변경 대기
3. 페이지 전역 변수 체크
4. 네트워크 idle 대기 (SSE가 없을 때)
5. 고정 타임아웃 (최후의 수단)

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

자동화 스크립트에서 개발자 도구 열기:

```js
const browser = await chromium.launch({
  headless: false,
  devtools: true, // 개발자 도구 자동 열기
  slowMo: 100, // 느린 실행으로 동작 확인
});

// 또는 코드에서 브레이크포인트
await page.pause(); // Playwright Inspector 실행
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
node automation/automation-example.cjs

# 인자와 함께 실행
node automation/automation-advanced.cjs collect
node automation/automation-advanced.cjs process
node automation/automation-advanced.cjs login
node automation/automation-advanced.cjs monitor

# 크론 작업 (Linux/WSL)
0 */6 * * * cd /path/to/project && node automation/automation-example.cjs

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

예제 파일: `automation/automation-example.cjs`, `automation/automation-advanced.cjs` 참고

## 웹 크롤링 (Web Scraping)

Playwright를 사용한 웹 크롤링 예제:

### 기본 크롤링

```js
const { chromium } = require('playwright');
const fs = require('fs').promises;

async function crawlWebsite() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto('https://example.com/products');
    await page.waitForLoadState('networkidle');

    // 데이터 추출
    const products = await page.$$eval('.product-item', (items) =>
      items.map((item) => ({
        name: item.querySelector('.product-name')?.textContent.trim(),
        price: item.querySelector('.product-price')?.textContent.trim(),
        image: item.querySelector('img')?.src,
        link: item.querySelector('a')?.href,
      }))
    );

    console.log(`크롤링된 제품 수: ${products.length}`);
    await fs.writeFile('products.json', JSON.stringify(products, null, 2));

    return products;
  } finally {
    await browser.close();
  }
}

crawlWebsite().catch(console.error);
```

### 페이지네이션 크롤링

```js
async function crawlWithPagination() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const allData = [];

  try {
    let currentPage = 1;
    const maxPages = 10;

    while (currentPage <= maxPages) {
      console.log(`크롤링 중: 페이지 ${currentPage}`);
      await page.goto(`https://example.com/list?page=${currentPage}`);
      await page.waitForLoadState('networkidle');

      // 데이터 추출
      const items = await page.$$eval('.item', (elements) =>
        elements.map((el) => ({
          title: el.querySelector('.title')?.textContent,
          content: el.querySelector('.content')?.textContent,
        }))
      );

      if (items.length === 0) break; // 더 이상 데이터가 없으면 중단

      allData.push(...items);

      // 다음 페이지 버튼 확인
      const hasNextPage = await page.$('.next-page:not([disabled])');
      if (!hasNextPage) break;

      currentPage++;
    }

    console.log(`총 크롤링된 항목: ${allData.length}`);
    await fs.writeFile('crawled-data.json', JSON.stringify(allData, null, 2));

    return allData;
  } finally {
    await browser.close();
  }
}
```

### 무한 스크롤 크롤링

```js
async function crawlInfiniteScroll() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto('https://example.com/infinite-scroll');

    let previousHeight = 0;
    const allItems = [];

    while (true) {
      // 스크롤 전 높이
      previousHeight = await page.evaluate(() => document.body.scrollHeight);

      // 페이지 끝까지 스크롤
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

      // 새 콘텐츠 로드 대기
      await page.waitForTimeout(2000);

      // 새로운 높이
      const newHeight = await page.evaluate(() => document.body.scrollHeight);

      // 데이터 추출
      const items = await page.$$eval('.item', (elements) =>
        elements.map((el) => el.textContent.trim())
      );

      allItems.push(...items);

      // 더 이상 스크롤할 수 없으면 종료
      if (newHeight === previousHeight) break;
    }

    // 중복 제거
    const uniqueItems = [...new Set(allItems)];
    console.log(`크롤링된 항목: ${uniqueItems.length}`);

    return uniqueItems;
  } finally {
    await browser.close();
  }
}
```

### 동적 콘텐츠 크롤링 (AJAX/Fetch)

```js
async function crawlDynamicContent() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto('https://example.com');

    // 버튼 클릭 후 동적 로딩 대기
    await page.click('#load-more-button');

    // AJAX 요청 완료 대기
    await page.waitForResponse(
      (response) => response.url().includes('/api/data') && response.status() === 200,
      { timeout: 10000 }
    );

    // 또는 특정 요소가 나타날 때까지 대기
    await page.waitForSelector('.dynamic-content', { state: 'visible' });

    // 데이터 추출
    const data = await page.$$eval('.dynamic-content .item', (items) =>
      items.map((item) => ({
        text: item.textContent.trim(),
        href: item.querySelector('a')?.href,
      }))
    );

    return data;
  } finally {
    await browser.close();
  }
}
```

### 여러 URL 동시 크롤링

```js
async function crawlMultipleUrls() {
  const browser = await chromium.launch({ headless: true });
  const urls = [
    'https://example.com/page1',
    'https://example.com/page2',
    'https://example.com/page3',
  ];

  try {
    // 여러 페이지를 동시에 크롤링
    const results = await Promise.all(
      urls.map(async (url) => {
        const page = await browser.newPage();
        try {
          await page.goto(url);
          await page.waitForLoadState('networkidle');

          const data = await page.evaluate(() => ({
            title: document.title,
            content: document.querySelector('.content')?.textContent,
          }));

          return { url, ...data };
        } finally {
          await page.close();
        }
      })
    );

    console.log(`크롤링 완료: ${results.length}개 페이지`);
    return results;
  } finally {
    await browser.close();
  }
}
```

### 크롤링 시 주의사항

```js
async function crawlWithBestPractices() {
  const browser = await chromium.launch({
    headless: true,
    // User-Agent 설정
    args: ['--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) ...'],
  });

  const context = await browser.newContext({
    // 타임아웃 설정
    timeout: 30000,

    // User-Agent 설정
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',

    // 뷰포트 설정
    viewport: { width: 1920, height: 1080 },
  });

  const page = await context.newPage();

  try {
    // 요청 간 딜레이 추가 (서버 부하 방지)
    await page.waitForTimeout(1000);

    // 이미지 차단으로 속도 향상
    await page.route('**/*.{png,jpg,jpeg,gif,svg,webp}', (route) => route.abort());

    // 불필요한 리소스 차단
    await page.route('**/*.{css,woff,woff2}', (route) => route.abort());

    await page.goto('https://example.com', { waitUntil: 'domcontentloaded' });

    // 크롤링 로직...
  } catch (error) {
    console.error('크롤링 오류:', error);

    // 오류 스크린샷
    await page.screenshot({ path: 'error.png' });
  } finally {
    await browser.close();
  }
}
```

### robots.txt 확인

```js
async function checkRobotsTxt(baseUrl) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    const robotsUrl = `${baseUrl}/robots.txt`;
    const response = await page.goto(robotsUrl);

    if (response.status() === 200) {
      const content = await page.textContent('body');
      console.log('robots.txt 내용:');
      console.log(content);

      // User-agent와 Disallow 규칙 확인
      if (content.includes('Disallow: /')) {
        console.warn('⚠️  크롤링이 제한될 수 있습니다.');
      }
    }
  } finally {
    await browser.close();
  }
}
```

**크롤링 윤리 지침:**

1. `robots.txt` 확인 및 준수
2. 요청 간 적절한 딜레이 설정 (서버 부하 방지)
3. User-Agent 명시
4. 사이트 이용약관 확인
5. 과도한 요청 지양
6. 개인정보 수집 금지

예제 파일: `automation/crawler-example.cjs` 참고

## 고급 기능

### 1. 모바일 디바이스 에뮬레이션

```js
const { devices } = require('playwright');

// iPhone 13 Pro 에뮬레이션
const iPhone13 = devices['iPhone 13 Pro'];
const context = await browser.newContext({
  ...iPhone13,
});

// 다양한 디바이스
const iPad = devices['iPad Pro'];
const pixel5 = devices['Pixel 5'];
const galaxyS9 = devices['Galaxy S9+'];

// 커스텀 디바이스
const context = await browser.newContext({
  userAgent: 'Custom User Agent',
  viewport: { width: 375, height: 667 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
```

### 2. 지오로케이션 (GPS)

```js
// 위치 권한 부여 및 좌표 설정
const context = await browser.newContext({
  geolocation: { longitude: 126.9780, latitude: 37.5665 }, // 서울
  permissions: ['geolocation'],
});

const page = await context.newPage();
await page.goto('https://maps.google.com');

// 위치 변경
await context.setGeolocation({ longitude: 127.0276, latitude: 37.4979 }); // 강남
```

### 3. 파일 다운로드

```js
// 다운로드 대기
const [download] = await Promise.all([
  page.waitForEvent('download'),
  page.click('a#download-link'),
]);

// 다운로드 정보
console.log(download.suggestedFilename());

// 파일 저장
await download.saveAs('./downloads/' + download.suggestedFilename());

// 다운로드 스트림 읽기
const stream = await download.createReadStream();
```

### 4. 파일 업로드

```js
// 단일 파일 업로드
await page.setInputFiles('input[type="file"]', './path/to/file.pdf');

// 여러 파일 업로드
await page.setInputFiles('input[type="file"]', [
  './file1.jpg',
  './file2.jpg',
  './file3.jpg',
]);

// 파일 선택 해제
await page.setInputFiles('input[type="file"]', []);

// Buffer로 파일 업로드
await page.setInputFiles('input[type="file"]', {
  name: 'test.txt',
  mimeType: 'text/plain',
  buffer: Buffer.from('file content'),
});
```

### 5. 다이얼로그 처리 (alert, confirm, prompt)

```js
// 다이얼로그 이벤트 리스너
page.on('dialog', async (dialog) => {
  console.log(`다이얼로그 타입: ${dialog.type()}`);
  console.log(`메시지: ${dialog.message()}`);

  // alert, confirm 수락
  await dialog.accept();

  // confirm 거부
  // await dialog.dismiss();

  // prompt 입력
  // await dialog.accept('사용자 입력값');
});

// 다이얼로그를 발생시키는 액션
await page.click('button#show-alert');
```

### 6. 여러 탭/창 관리

```js
// 새 탭 열기
const [newPage] = await Promise.all([
  context.waitForEvent('page'),
  page.click('a[target="_blank"]'), // 새 탭으로 여는 링크
]);

await newPage.waitForLoadState();
console.log(await newPage.title());

// 모든 페이지 가져오기
const pages = context.pages();
console.log(`열린 탭 수: ${pages.length}`);

// 특정 페이지로 전환
await pages[1].bringToFront();

// 팝업 처리
page.on('popup', async (popup) => {
  await popup.waitForLoadState();
  console.log(await popup.title());
  await popup.close();
});
```

### 7. iframe 작업

```js
// iframe 선택
const frame = page.frameLocator('iframe#my-frame');
await frame.locator('button').click();

// 또는
const frameElement = await page.frame({ name: 'frame-name' });
await frameElement.click('button');

// 모든 프레임 가져오기
const frames = page.frames();
console.log(`프레임 수: ${frames.length}`);

// 특정 프레임 찾기
const specificFrame = page.frames().find((f) => f.name() === 'my-frame');
await specificFrame.fill('input', 'text');
```

### 8. 쿠키 관리

```js
// 쿠키 설정
await context.addCookies([
  {
    name: 'session',
    value: 'abc123',
    domain: 'example.com',
    path: '/',
    expires: Date.now() / 1000 + 86400, // 1일 후
    httpOnly: true,
    secure: true,
  },
]);

// 쿠키 가져오기
const cookies = await context.cookies();
console.log(cookies);

// 특정 URL의 쿠키
const urlCookies = await context.cookies('https://example.com');

// 쿠키 삭제
await context.clearCookies();
```

### 9. 로컬 스토리지 / 세션 스토리지

```js
// 로컬 스토리지 설정
await page.evaluate(() => {
  localStorage.setItem('token', 'abc123');
  sessionStorage.setItem('user', JSON.stringify({ id: 1, name: 'User' }));
});

// 로컬 스토리지 읽기
const token = await page.evaluate(() => localStorage.getItem('token'));

// 상태 저장
const state = await context.storageState();
await fs.writeFile('auth-state.json', JSON.stringify(state));

// 상태 복원
const context = await browser.newContext({
  storageState: 'auth-state.json',
});
```

### 10. 네트워크 조작 (Mock, Intercept)

```js
// API 응답 모킹
await page.route('**/api/users', (route) => {
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([
      { id: 1, name: 'User 1' },
      { id: 2, name: 'User 2' },
    ]),
  });
});

// 요청 수정
await page.route('**/api/data', (route) => {
  const request = route.request();
  route.continue({
    headers: {
      ...request.headers(),
      'X-Custom-Header': 'custom-value',
    },
  });
});

// 응답 수정
await page.route('**/api/config', async (route) => {
  const response = await route.fetch();
  const json = await response.json();
  json.modified = true;

  route.fulfill({
    response,
    json: json,
  });
});

// 특정 요청 차단
await page.route('**/ads/**', (route) => route.abort());
```

### 11. HAR (HTTP Archive) 기록

```js
// HAR 기록 시작
const context = await browser.newContext({
  recordHar: { path: './network.har' },
});

// 페이지 작업 수행
const page = await context.newPage();
await page.goto('https://example.com');

// HAR 기록 종료 및 저장
await context.close();
```

### 12. 성능 메트릭 수집

```js
// Performance API 사용
const metrics = await page.evaluate(() => {
  const nav = performance.getEntriesByType('navigation')[0];
  return {
    domContentLoaded: nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart,
    loadComplete: nav.loadEventEnd - nav.loadEventStart,
    domInteractive: nav.domInteractive,
    transferSize: nav.transferSize,
  };
});

console.log('성능 메트릭:', metrics);

// Lighthouse 스타일 메트릭
const performanceTiming = await page.evaluate(() => JSON.stringify(window.performance.timing));
const timing = JSON.parse(performanceTiming);

const pageLoadTime = timing.loadEventEnd - timing.navigationStart;
console.log(`페이지 로드 시간: ${pageLoadTime}ms`);
```

### 13. 접근성 (Accessibility) 테스트

```js
// 접근성 스냅샷
const snapshot = await page.accessibility.snapshot();
console.log(JSON.stringify(snapshot, null, 2));

// 특정 요소의 접근성 정보
const button = page.locator('button');
const accessibilitySnapshot = await page.accessibility.snapshot({
  root: await button.elementHandle(),
});
```

### 14. 코드 커버리지 (Coverage)

```js
// JavaScript 커버리지 시작
await page.coverage.startJSCoverage();

// CSS 커버리지 시작
await page.coverage.startCSSCoverage();

// 페이지 탐색
await page.goto('https://example.com');

// 커버리지 수집
const jsCoverage = await page.coverage.stopJSCoverage();
const cssCoverage = await page.coverage.stopCSSCoverage();

// 사용되지 않은 바이트 계산
let totalBytes = 0;
let usedBytes = 0;
for (const entry of jsCoverage) {
  totalBytes += entry.text.length;
  for (const range of entry.ranges) {
    usedBytes += range.end - range.start;
  }
}
console.log(`JS 사용률: ${((usedBytes / totalBytes) * 100).toFixed(2)}%`);
```

### 15. 비디오 녹화

```js
// 설정에서 비디오 녹화
const context = await browser.newContext({
  recordVideo: {
    dir: './videos/',
    size: { width: 1280, height: 720 },
  },
});

const page = await context.newPage();
await page.goto('https://example.com');

// 비디오 경로 가져오기
const videoPath = await page.video().path();
console.log(`비디오 저장됨: ${videoPath}`);

await context.close();
```

### 16. 타임존 변경

```js
// 특정 타임존으로 설정
const context = await browser.newContext({
  timezoneId: 'America/New_York',
});

// 또는
const context = await browser.newContext({
  timezoneId: 'Asia/Seoul',
});

// 페이지에서 확인
const timezone = await page.evaluate(() => Intl.DateTimeFormat().resolvedOptions().timeZone);
console.log(`현재 타임존: ${timezone}`);
```

### 17. 권한 관리

```js
// 특정 권한 부여
const context = await browser.newContext({
  permissions: ['geolocation', 'notifications', 'camera', 'microphone'],
});

// 런타임에 권한 부여
await context.grantPermissions(['clipboard-read', 'clipboard-write']);

// 특정 origin에만 권한 부여
await context.grantPermissions(['camera'], { origin: 'https://example.com' });

// 권한 취소
await context.clearPermissions();
```

### 18. 요청 인터셉트 및 속도 제한

```js
// 느린 네트워크 시뮬레이션
const context = await browser.newContext({
  offline: false,
  // 네트워크 속도 제한은 Chrome DevTools Protocol을 통해
});

// 오프라인 모드
await context.setOffline(true);

// 다시 온라인
await context.setOffline(false);
```

### 19. 클립보드 작업

```js
// 클립보드에 복사
await page.evaluate(() => navigator.clipboard.writeText('복사할 텍스트'));

// 클립보드 읽기
const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
console.log(`클립보드 내용: ${clipboardText}`);
```

### 20. 웹소켓 모니터링

```js
// 웹소켓 연결 감지
page.on('websocket', (ws) => {
  console.log(`웹소켓 연결: ${ws.url()}`);

  ws.on('framesent', (event) => console.log('전송:', event.payload));
  ws.on('framereceived', (event) => console.log('수신:', event.payload));
  ws.on('close', () => console.log('웹소켓 종료'));
});
```

### 21. 서비스 워커 (Service Worker)

```js
// 서비스 워커 감지
context.on('serviceworker', (worker) => {
  console.log(`서비스 워커 등록: ${worker.url()}`);
});

// 모든 서비스 워커 가져오기
const workers = context.serviceWorkers();
```

### 22. 브라우저 컨텍스트 격리

```js
// 각 테스트마다 독립적인 환경
const context1 = await browser.newContext();
const context2 = await browser.newContext();

// 쿠키, 로컬스토리지 등이 완전히 분리됨
const page1 = await context1.newPage();
const page2 = await context2.newPage();

await context1.close();
await context2.close();
```

### 23. Trace 기록 (디버깅)

```js
// Trace 시작
await context.tracing.start({
  screenshots: true,
  snapshots: true,
});

// 페이지 작업
await page.goto('https://example.com');
await page.click('button');

// Trace 저장
await context.tracing.stop({ path: 'trace.zip' });

// trace.zip을 Playwright Trace Viewer로 확인
// yarn playwright show-trace trace.zip
```

**주요 활용 사례:**

- 📱 모바일 앱 웹뷰 테스트
- 🌍 다국어/타임존 테스트
- 🔒 인증/권한 테스트
- 📊 성능 모니터링
- ♿ 접근성 검증
- 🎥 사용자 행동 녹화
- 🧪 A/B 테스트 자동화
- 📡 실시간 통신 (WebSocket, SSE) 모니터링
- 🔄 Progressive Web App (PWA) 테스트

## 참고 자료

- [Playwright 공식 문서](https://playwright.dev)
- [API 레퍼런스](https://playwright.dev/docs/api/class-playwright)
- [Best Practices](https://playwright.dev/docs/best-practices)
