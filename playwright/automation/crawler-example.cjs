/**
 * Playwright를 사용한 웹 크롤링 예제
 */

const { chromium } = require("playwright");
const fs = require("fs").promises;

/**
 * 기본 크롤링 - 단일 페이지에서 데이터 추출
 */
async function basicCrawl() {
  console.log("=== 기본 크롤링 시작 ===");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto("https://example.com/products");
    await page.waitForLoadState("networkidle");

    // 데이터 추출
    const products = await page.$$eval(".product-item", (items) =>
      items.map((item) => ({
        name: item.querySelector(".product-name")?.textContent.trim(),
        price: item.querySelector(".product-price")?.textContent.trim(),
        image: item.querySelector("img")?.src,
        link: item.querySelector("a")?.href,
      }))
    );

    console.log(`크롤링된 제품 수: ${products.length}`);
    await fs.writeFile(
      "./data/products.json",
      JSON.stringify(products, null, 2)
    );

    return products;
  } finally {
    await browser.close();
  }
}

/**
 * 페이지네이션 크롤링 - 여러 페이지 순회
 */
async function paginationCrawl() {
  console.log("=== 페이지네이션 크롤링 시작 ===");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const allData = [];

  try {
    let currentPage = 1;
    const maxPages = 5;

    while (currentPage <= maxPages) {
      console.log(`크롤링 중: 페이지 ${currentPage}/${maxPages}`);
      await page.goto(`https://example.com/list?page=${currentPage}`);
      await page.waitForLoadState("networkidle");

      // 데이터 추출
      const items = await page.$$eval(".item", (elements) =>
        elements.map((el) => ({
          title: el.querySelector(".title")?.textContent?.trim(),
          content: el.querySelector(".content")?.textContent?.trim(),
        }))
      );

      if (items.length === 0) {
        console.log("더 이상 데이터가 없습니다.");
        break;
      }

      allData.push(...items);

      // 다음 페이지 버튼 확인
      const hasNextPage = await page.$(".next-page:not([disabled])");
      if (!hasNextPage) {
        console.log("마지막 페이지입니다.");
        break;
      }

      currentPage++;

      // 요청 간 딜레이 (서버 부하 방지)
      await page.waitForTimeout(1000);
    }

    console.log(`총 크롤링된 항목: ${allData.length}`);
    await fs.writeFile(
      "./data/paginated-data.json",
      JSON.stringify(allData, null, 2)
    );

    return allData;
  } finally {
    await browser.close();
  }
}

/**
 * 무한 스크롤 크롤링
 */
async function infiniteScrollCrawl() {
  console.log("=== 무한 스크롤 크롤링 시작 ===");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto("https://example.com/infinite-scroll");
    await page.waitForLoadState("networkidle");

    let previousHeight = 0;
    let scrollAttempts = 0;
    const maxScrolls = 20;

    while (scrollAttempts < maxScrolls) {
      // 현재 높이
      previousHeight = await page.evaluate(() => document.body.scrollHeight);

      // 페이지 끝까지 스크롤
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

      // 새 콘텐츠 로드 대기
      await page.waitForTimeout(2000);

      // 새로운 높이
      const newHeight = await page.evaluate(() => document.body.scrollHeight);

      // 더 이상 스크롤할 수 없으면 종료
      if (newHeight === previousHeight) {
        console.log("더 이상 스크롤할 수 없습니다.");
        break;
      }

      scrollAttempts++;
      console.log(`스크롤 ${scrollAttempts}회 완료`);
    }

    // 모든 데이터 추출
    const items = await page.$$eval(".item", (elements) =>
      elements.map((el) => ({
        text: el.textContent.trim(),
        id: el.getAttribute("data-id"),
      }))
    );

    // 중복 제거
    const uniqueItems = Array.from(
      new Map(items.map((item) => [item.id, item])).values()
    );

    console.log(`크롤링된 고유 항목: ${uniqueItems.length}`);
    await fs.writeFile(
      "./data/scroll-data.json",
      JSON.stringify(uniqueItems, null, 2)
    );

    return uniqueItems;
  } finally {
    await browser.close();
  }
}

/**
 * 여러 URL 동시 크롤링
 */
async function parallelCrawl() {
  console.log("=== 병렬 크롤링 시작 ===");
  const browser = await chromium.launch({ headless: true });

  const urls = [
    "https://example.com/page1",
    "https://example.com/page2",
    "https://example.com/page3",
    "https://example.com/page4",
    "https://example.com/page5",
  ];

  try {
    // 여러 페이지를 동시에 크롤링
    const results = await Promise.all(
      urls.map(async (url, index) => {
        const page = await browser.newPage();
        try {
          console.log(`크롤링 시작: ${url}`);
          await page.goto(url);
          await page.waitForLoadState("networkidle");

          const data = await page.evaluate(() => ({
            title: document.title,
            description: document.querySelector('meta[name="description"]')
              ?.content,
            content: document
              .querySelector(".content")
              ?.textContent?.substring(0, 200),
          }));

          console.log(`크롤링 완료: ${url}`);
          return { url, ...data };
        } catch (error) {
          console.error(`크롤링 실패: ${url}`, error.message);
          return { url, error: error.message };
        } finally {
          await page.close();
        }
      })
    );

    console.log(`총 ${results.length}개 페이지 크롤링 완료`);
    await fs.writeFile(
      "./data/parallel-results.json",
      JSON.stringify(results, null, 2)
    );

    return results;
  } finally {
    await browser.close();
  }
}

/**
 * 최적화된 크롤링 (이미지/CSS 차단)
 */
async function optimizedCrawl() {
  console.log("=== 최적화된 크롤링 시작 ===");
  const browser = await chromium.launch({ headless: true });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
  });

  const page = await context.newPage();

  // 불필요한 리소스 차단
  await page.route("**/*.{png,jpg,jpeg,gif,svg,webp,css,woff,woff2}", (route) =>
    route.abort()
  );

  try {
    const startTime = Date.now();

    await page.goto("https://example.com", {
      waitUntil: "domcontentloaded", // networkidle 대신 domcontentloaded 사용
    });

    const data = await page.evaluate(() => ({
      title: document.title,
      links: Array.from(document.querySelectorAll("a")).map((a) => ({
        text: a.textContent.trim(),
        href: a.href,
      })),
    }));

    const endTime = Date.now();
    console.log(`크롤링 완료 (소요 시간: ${endTime - startTime}ms)`);

    return data;
  } finally {
    await browser.close();
  }
}

/**
 * robots.txt 확인
 */
async function checkRobotsTxt(baseUrl) {
  console.log(`=== ${baseUrl} robots.txt 확인 ===`);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    const robotsUrl = `${baseUrl}/robots.txt`;
    const response = await page.goto(robotsUrl);

    if (response.status() === 200) {
      const content = await page.textContent("body");
      console.log("robots.txt 내용:");
      console.log(content);

      // Disallow 규칙 확인
      if (content.includes("Disallow: /")) {
        console.warn("⚠️  일부 경로의 크롤링이 제한될 수 있습니다.");
      } else {
        console.log("✓ 크롤링 제한 없음");
      }

      return content;
    } else {
      console.log("robots.txt 파일이 없습니다.");
      return null;
    }
  } catch (error) {
    console.error("robots.txt 확인 실패:", error.message);
    return null;
  } finally {
    await browser.close();
  }
}

// 실행
async function main() {
  const action = process.argv[2] || "basic";

  // data 디렉토리 생성
  try {
    await fs.mkdir("./data", { recursive: true });
  } catch (error) {
    // 이미 존재하는 경우 무시
  }

  switch (action) {
    case "basic":
      await basicCrawl();
      break;
    case "pagination":
      await paginationCrawl();
      break;
    case "scroll":
      await infiniteScrollCrawl();
      break;
    case "parallel":
      await parallelCrawl();
      break;
    case "optimized":
      await optimizedCrawl();
      break;
    case "robots":
      const url = process.argv[3] || "https://example.com";
      await checkRobotsTxt(url);
      break;
    default:
      console.log(
        "사용법: node crawler-example.cjs [basic|pagination|scroll|parallel|optimized|robots]"
      );
      console.log(
        "robots.txt 확인: node crawler-example.cjs robots https://example.com"
      );
  }
}

main().catch(console.error);
