/**
 * 크론 작업이나 스케줄러에서 실행할 수 있는 자동화 스크립트 예제
 * 데이터 수집, 리포트 생성 등의 작업을 자동화
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;

/**
 * 데이터 수집 자동화
 */
async function collectData() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto('https://flay.kamoru.jk/dist/index.html');
    await page.waitForLoadState('networkidle');

    // 페이지에서 데이터 추출
    const data = await page.evaluate(() => {
      // 페이지의 데이터 추출 로직
      const items = [];
      document.querySelectorAll('.item').forEach((item) => {
        items.push({
          title: item.querySelector('.title')?.textContent,
          date: item.querySelector('.date')?.textContent,
        });
      });
      return items;
    });

    // 데이터를 파일로 저장
    await fs.writeFile('./data/collected-data.json', JSON.stringify(data, null, 2));
    console.log(`수집된 데이터 개수: ${data.length}`);

    return data;
  } finally {
    await browser.close();
  }
}

/**
 * 반복 작업 자동화 (여러 페이지 순회)
 */
async function processMultiplePages() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const results = [];

  try {
    const urls = ['https://flay.kamoru.jk/dist/page1.html', 'https://flay.kamoru.jk/dist/page2.html', 'https://flay.kamoru.jk/dist/page3.html'];

    for (const url of urls) {
      console.log(`처리 중: ${url}`);
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      const result = await page.evaluate(() => ({
        title: document.title,
        content: document.body.textContent.substring(0, 100),
      }));

      results.push({ url, ...result });
    }

    await fs.writeFile('./data/pages-result.json', JSON.stringify(results, null, 2));
    console.log('모든 페이지 처리 완료');

    return results;
  } finally {
    await browser.close();
  }
}

/**
 * 로그인이 필요한 작업 자동화
 */
async function automateWithLogin() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    // 쿠키나 로컬 스토리지 상태 저장/복원
    storageState: './playwright/auth-state.json',
  });
  const page = await context.newPage();

  try {
    // 로그인
    await page.goto('https://example.com/login');
    await page.fill('input[name="username"]', 'your-username');
    await page.fill('input[name="password"]', 'your-password');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // 로그인 상태 저장 (다음번에 재사용)
    await context.storageState({ path: './playwright/auth-state.json' });

    // 로그인 후 작업
    await page.goto('https://example.com/data');
    const data = await page.textContent('.data-container');
    console.log('데이터:', data);

    return data;
  } finally {
    await browser.close();
  }
}

/**
 * API 요청 모니터링 및 가로채기
 */
async function monitorApiCalls() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const apiCalls = [];

  // 모든 API 요청 기록
  page.on('request', (request) => {
    if (request.url().includes('/api/')) {
      console.log(`API 요청: ${request.method()} ${request.url()}`);
      apiCalls.push({
        method: request.method(),
        url: request.url(),
        timestamp: new Date().toISOString(),
      });
    }
  });

  // 응답 가로채기 및 수정
  await page.route('**/api/config', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ custom: 'data' }),
    });
  });

  try {
    await page.goto('https://flay.kamoru.jk/dist/index.html');
    await page.waitForLoadState('networkidle');

    await fs.writeFile('./data/api-calls.json', JSON.stringify(apiCalls, null, 2));
    console.log(`기록된 API 호출: ${apiCalls.length}개`);

    return apiCalls;
  } finally {
    await browser.close();
  }
}

// 실행 방법 선택
const action = process.argv[2] || 'collect';

switch (action) {
  case 'collect':
    collectData().catch(console.error);
    break;
  case 'process':
    processMultiplePages().catch(console.error);
    break;
  case 'login':
    automateWithLogin().catch(console.error);
    break;
  case 'monitor':
    monitorApiCalls().catch(console.error);
    break;
  default:
    console.log('사용법: node automation-advanced.cjs [collect|process|login|monitor]');
}
