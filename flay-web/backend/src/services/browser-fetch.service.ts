import path from 'path';
import { fileURLToPath } from 'url';
import { BrowserContext, chromium, Page } from 'playwright-core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * 실제 크롬(설치된 Chrome, 비-headless)으로 페이지를 열어 HTML·파일을 가져온다.
 *
 * curl 은 Cloudflare 봇 챌린지("Just a moment...")에 막히지만, 실제 크롬은 통과한다.
 * 전용 프로필(data/chrome-profile)을 영구 컨텍스트로 쓰므로 한 번 통과한 챌린지 쿠키
 * (cf_clearance)가 프로필에 남아 다음 요청은 바로 본문이 내려온다. 첫 요청(또는 쿠키 만료 후)에는
 * 크롬 창이 뜨고 챌린지 체크가 필요할 수 있다 — 창에서 확인을 누르면 이어서 진행된다.
 */

const PROFILE_DIR = path.resolve(__dirname, '../../data/chrome-profile');
/** 챌린지 통과 대기 상한(ms) — 사용자가 체크박스를 눌러야 하는 경우를 감안 */
const CHALLENGE_WAIT_MS = 60_000;
const POLL_MS = 500;

let context: BrowserContext | null = null;
let launching: Promise<BrowserContext> | null = null;

/**
 * 응답 HTML 이 Cloudflare 챌린지 페이지인지 판별한다.
 * @param html 응답 본문
 * @returns 챌린지(차단) 페이지면 true
 */
export function isChallengePage(html: string): boolean {
  const head = html.slice(0, 20_000);
  return /<title>\s*Just a moment\.\.\.\s*<\/title>/i.test(head) || /__cf_chl|cf-chl-|challenge-platform/i.test(head);
}

/**
 * 영구 컨텍스트를 하나만 띄워 재사용한다(동시 호출은 같은 기동을 공유).
 * @returns 열린 브라우저 컨텍스트
 */
async function getContext(): Promise<BrowserContext> {
  if (context) return context;
  if (!launching) {
    launching = chromium
      .launchPersistentContext(PROFILE_DIR, {
        channel: 'chrome', // 설치된 크롬 사용 — 헤드리스 UA 가 아니어야 챌린지 쿠키가 유효
        headless: false,
        viewport: null,
        args: ['--window-size=1200,900', '--disable-blink-features=AutomationControlled'],
      })
      .then((ctx) => {
        ctx.on('close', () => {
          context = null;
        });
        context = ctx;
        return ctx;
      })
      .finally(() => {
        launching = null;
      });
  }
  return launching;
}

/**
 * 현재 페이지가 챌린지를 끝내고 실제 문서를 보일 때까지 기다린 뒤 HTML 을 돌려준다.
 * 챌린지 통과 시 페이지가 스스로 다시 이동하므로, 이동 중에는 content() 가 예외를 던진다 → 재시도.
 * @param page 대상 페이지(이미 goto 완료)
 * @returns 챌린지가 아닌 문서의 HTML
 */
async function waitPastChallenge(page: Page): Promise<string> {
  const deadline = Date.now() + CHALLENGE_WAIT_MS;
  const read = async (): Promise<string | null> => page.content().catch(() => null);
  let html = await read();
  while (html === null || isChallengePage(html)) {
    if (Date.now() > deadline) throw new Error('Cloudflare 챌린지를 통과하지 못했습니다(크롬 창에서 확인 필요)');
    await page.waitForLoadState('domcontentloaded', { timeout: POLL_MS * 4 }).catch(() => {});
    await page.waitForTimeout(POLL_MS);
    html = await read();
  }
  return html;
}

/**
 * 크롬으로 URL 을 열어 챌린지가 끝난 뒤의 HTML 을 반환한다.
 * @param url 대상 URL
 * @returns 페이지 HTML. 대기 상한 안에 챌린지를 못 넘기면 오류
 */
export async function fetchHtmlWithBrowser(url: string): Promise<string> {
  const ctx = await getContext();
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    return await waitPastChallenge(page);
  } finally {
    await page.close().catch(() => {});
  }
}
