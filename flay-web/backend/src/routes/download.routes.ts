import { Router } from 'express';
import multer from 'multer';

const router = Router();
const upload = multer();

/**
 * 응답 헤더(Content-Disposition) 또는 URL 경로에서 파일명을 정한다.
 * @param url 원본 URL
 * @param disposition Content-Disposition 헤더 값(없으면 null)
 * @returns 파일명(정할 수 없으면 'downloaded_file')
 */
function resolveFileName(url: string, disposition: string | null): string {
  if (disposition && disposition.includes('filename=')) {
    const match = disposition.match(/filename[^;=\n]*=["']?([^"';\n]+)/);
    if (match) return match[1];
  }
  const urlPath = new URL(url).pathname;
  const lastSegment = urlPath.substring(urlPath.lastIndexOf('/') + 1);
  return lastSegment || 'downloaded_file';
}

/**
 * @openapi
 * /download:
 *   post:
 *     tags: [Download]
 *     summary: URL 프록시 다운로드
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               url: { type: string }
 *     responses:
 *       200:
 *         description: 파일 다운로드
 *       400:
 *         description: url 파라미터 누락
 */
router.post('/download', upload.none(), async (req, res, next) => {
  const url = req.body.url || req.query.url;
  if (!url) {
    res.status(400).json({ error: 'url 파라미터가 필요합니다' });
    return;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      // 403/503 은 대개 Cloudflare 봇 챌린지 — 서버(자동화 크롬 포함)로는 통과 불가라
      // 프런트가 사용자 브라우저에서 직접 열도록 상태 코드를 그대로 돌려준다.
      console.log(`[Download] HTTP ${response.status}: ${url}`);
      res.status(response.status).json({ error: `다운로드 실패: HTTP ${response.status}` });
      return;
    }

    const fileName = resolveFileName(url, response.headers.get('content-disposition'));
    console.log(`[Download] ${fileName} from ${url}`);

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    const buffer = Buffer.from(await response.arrayBuffer());
    res.send(buffer);
  } catch (e: any) {
    next(e);
  }
});

export default router;
