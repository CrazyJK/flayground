import { exec } from 'child_process';
import { Router } from 'express';
import { sseSend } from '../services/sse-emitters';

const router = Router();

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36';

/**
 * GET /crawling/jsoup?url=... - URL의 HTML을 fetch하여 반환
 * Java CrawlingDocument.getDocumentByJsoup() 대응
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
 * GET /crawling/curl?url=... - curl로 URL을 다운로드하고 SSE로 HTML 전달
 * Java CrawlingDocument.getDocumentByCurl() + CurlResponser 대응
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
