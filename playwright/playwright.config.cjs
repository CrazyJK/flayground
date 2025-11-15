/**
 * Playwright 설정 파일
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = {
  // 테스트 결과 저장 위치
  outputDir: "./test-results",

  use: {
    // 브라우저 헤드리스 모드
    headless: true,

    // 스크린샷 설정
    screenshot: "only-on-failure",

    // 비디오 녹화 설정
    video: "retain-on-failure",
  },
};
