import { Router } from 'express';
import multer from 'multer';

const router = Router();
const upload = multer();

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
      res.status(response.status).json({ error: `다운로드 실패: HTTP ${response.status}` });
      return;
    }

    // 파일명 추출: Content-Disposition 또는 URL 경로에서
    let fileName = 'downloaded_file';
    const disposition = response.headers.get('content-disposition');
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename[^;=\n]*=["']?([^"';\n]+)/);
      if (match) fileName = match[1];
    } else {
      const urlPath = new URL(url).pathname;
      const lastSegment = urlPath.substring(urlPath.lastIndexOf('/') + 1);
      if (lastSegment) fileName = lastSegment;
    }

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
