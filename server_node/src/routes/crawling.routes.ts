import { exec } from 'child_process';
import { Router } from 'express';
import { sseSend } from '../services/sse-emitters';

const router = Router();

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36';

/**
 * @openapi
 * /crawling/jsoup:
 *   get:
 *     tags: [Crawling]
 *     summary: URL의 HTML을 fetch하여 반환
 *     parameters:
 *       - in: query
 *         name: url
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: HTML 콘텐츠
 *         content:
 *           text/html: {}
 *       400:
 *         description: url 파라미터 누락
 */
router.get('/crawling/jsoup', async (req, res, next) => {
  const url = req.query.url as string;
  if (!url) {
    res.status(400).json({ error: 'url 파라미터가 필요합니다' });
    return;
  }

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
    });
    const html = await response.text();
    res.type('text/html').send(html);
  } catch (e: any) {
    next(e);
  }
});

/**
 * @openapi
 * /crawling/curl:
 *   get:
 *     tags: [Crawling]
 *     summary: curl로 URL 다운로드 (SSE로 결과 전달)
 *     parameters:
 *       - in: query
 *         name: url
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: 요청 수락
 *       400:
 *         description: url 파라미터 누락
 */
router.get('/crawling/curl', (req, res) => {
  const url = req.query.url as string;
  if (!url) {
    res.status(400).json({ error: 'url 파라미터가 필요합니다' });
    return;
  }

  console.log(`[Crawling] curl ${url}`);

  // 비동기로 curl 실행, 즉시 204 응답
  exec(`curl -s "${url}"`, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout) => {
    if (error) {
      console.error(`[Crawling] curl 오류: ${error.message}`);
      sseSend({ type: 'CURL', message: `curl error: ${error.message}` });
      return;
    }
    sseSend({ type: 'CURL', message: stdout });
  });

  res.status(204).end();
});

export default router;
