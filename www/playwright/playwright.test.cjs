const { test, expect } = require('@playwright/test');

// playwright 를 이용해서, https://flay.kamoru.jk/ 에 접속한 후, HTML 제목을 출력하는 예제입니다.
test('get title from flay.kamoru.jk', async ({ page }) => {
  await page.goto('https://flay.kamoru.jk/dist/index.html');
  const title = await page.title();
  console.log(`Page title: ${title}`);
  expect(title).toBeDefined();
});

// https://flay.kamoru.jk/dist/page.flay-page.html 에 접속한 후, 키보드 space 키 입력 후 변경된 화면의 flay-title 요소의 내용을 출력하는 예제입니다.
test('interact with flay.kamoru.jk page', async ({ page }) => {
  // 화면 크기 설정
  await page.setViewportSize({ width: 1080, height: 1780 });

  await page.goto('https://flay.kamoru.jk/dist/page.flay-page.html');

  // SSE를 사용하는 경우 대기 방법:

  // 방법 1: 특정 요소가 나타나거나 변경될 때까지 대기
  await page.waitForSelector('flay-title', { state: 'visible' });

  // 방법 2: 페이지의 전역 변수나 상태 체크
  // await page.waitForFunction(() => {
  //   return window.dataLoaded === true; // 또는 window.flayDataReady 등
  // });

  // 방법 3: 특정 속성이나 텍스트가 나타날 때까지 대기
  // await page.locator('flay-title').waitFor({ state: 'attached' });
  // await expect(page.locator('flay-title')).not.toBeEmpty({ timeout: 10000 });

  // 방법 4: DOM이 특정 상태가 될 때까지 대기
  // await page.waitForFunction(() => {
  //   const element = document.querySelector('flay-title');
  //   return element && element.textContent.trim().length > 0;
  // });

  const flayTitle = await page.locator('flay-title');
  const titleText = await flayTitle.textContent();
  console.log(`Flay Title after space key: ${titleText}`);

  // 화면 캡처
  await page.screenshot({ path: 'flay-page-after-space.png', fullPage: true });

  expect(titleText).toBeDefined();
});
