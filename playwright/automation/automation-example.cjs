/**
 * Playwright를 자동화 스크립트로 사용하는 예제
 * 테스트 프레임워크 없이 순수 Playwright API 사용
 */

const { chromium } = require("playwright");

/**
 * 메인 자동화 함수
 */
async function main() {
  /**
   * 페이지 대기 및 캡처 함수
   */
  async function waitAndCapture() {
    await page.waitForTimeout(1000);
    await page
      .locator("flay-title")
      .textContent()
      .then((text) => console.log(`  ${screenshotCount}. 제목: ${text}`));
    await page.screenshot({
      path: `./screenshots/automation_${screenshotCount}.png`,
      fullPage: true,
    });
    screenshotCount++;
  }
  let screenshotCount = 1;

  // 브라우저 실행
  const browser = await chromium.launch({
    headless: false, // true: 백그라운드 실행, false: 브라우저 UI 표시
    slowMo: 100, // 각 액션 사이 지연 시간 (ms)
    devtools: true, // 개발자 도구 자동 열기
  });
  // 새 페이지 생성
  const context = await browser.newContext({
    viewport: { width: 1080, height: 1920 },
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  });
  const page = await context.newPage();

  try {
    console.log("✨ 페이지 접속 중...");
    await page.goto("https://flay.kamoru.jk/dist/page.flay-page.html");
    await waitAndCapture();

    console.log("✨ space로 페이지 변경");
    await page.keyboard.press("Space");
    await waitAndCapture();

    console.log("✨ rank 변경");
    await page.evaluate(() => document.querySelector("#rank5").click());
    await page.evaluate(() => document.querySelector("#rank0").click());
    await waitAndCapture();
  } catch (error) {
    console.error("자동화 실행 중 오류:", error);
    await page.screenshot({ path: "./screenshots/error.png" });
  } finally {
    // 브라우저 종료
    await browser.close();
    console.log("자동화 완료");
  }
}

// 스크립트 실행
main().catch(console.error);
