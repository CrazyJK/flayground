import { Request, Response, Router } from 'express';
import fs from 'fs';
import path from 'path';
import * as flayService from '../services/flay.service';

const router = Router();

/**
 * 영상 파일을 Range 요청 기반으로 스트리밍한다.
 * Java MovieStreamHandler.streamFile() 대응
 */
function streamFile(req: Request, res: Response, filePath: string): void {
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ message: `파일을 찾을 수 없습니다: ${filePath}` });
    return;
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const ext = path.extname(filePath).substring(1).toLowerCase();
  const range = req.headers.range;

  if (range) {
    // Range 요청 처리
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    const stream = fs.createReadStream(filePath, { start, end });
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': getContentType(ext),
    });
    stream.pipe(res);
  } else {
    // 전체 파일 전송
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': getContentType(ext),
    });
    fs.createReadStream(filePath).pipe(res);
  }
}

/**
 * 확장자로 Content-Type을 결정한다.
 */
function getContentType(ext: string): string {
  const types: Record<string, string> = {
    mp4: 'video/mp4',
    mkv: 'video/x-matroska',
    avi: 'video/x-msvideo',
    wmv: 'video/x-ms-wmv',
    mpg: 'video/mpeg',
    mov: 'video/quicktime',
    rmvb: 'application/vnd.rn-realmedia-vbr',
    m2ts: 'video/mp2t',
    smi: 'text/smi',
    srt: 'text/srt',
    ass: 'text/ass',
    smil: 'text/smil',
  };
  return types[ext] || 'application/octet-stream';
}

/**
 * @openapi
 * /flays/{opus}/stream/movie/{fileIndex}:
 *   get:
 *     tags: [Stream]
 *     summary: Flay 영상 스트리밍
 *     parameters:
 *       - in: path
 *         name: opus
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: fileIndex
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 영상 스트림
 *         content:
 *           video/*: {}
 *       206:
 *         description: Range 요청 응답
 *       404:
 *         description: 찾을 수 없음
 */
router.get('/flays/:opus/stream/movie/:fileIndex', (req, res) => {
  const { opus, fileIndex } = req.params;
  const idx = parseInt(fileIndex, 10);

  try {
    const flay = flayService.getFlay(opus);
    if (!flay.files.movie || idx >= flay.files.movie.length) {
      res.status(404).json({ message: '영상 파일을 찾을 수 없습니다' });
      return;
    }
    streamFile(req, res, flay.files.movie[idx]);
  } catch (err: any) {
    res.status(404).json({ message: err.message });
  }
});

/**
 * @openapi
 * /flays/{opus}/stream/subtitles/{fileIndex}:
 *   get:
 *     tags: [Stream]
 *     summary: Flay 자막 스트리밍
 *     parameters:
 *       - in: path
 *         name: opus
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: fileIndex
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 자막 내용
 *       404:
 *         description: 찾을 수 없음
 */
router.get('/flays/:opus/stream/subtitles/:fileIndex', (req, res) => {
  const { opus, fileIndex } = req.params;
  const idx = parseInt(fileIndex, 10);

  try {
    const flay = flayService.getFlay(opus);
    if (!flay.files.subtitles || idx >= flay.files.subtitles.length) {
      res.status(404).json({ message: '자막 파일을 찾을 수 없습니다' });
      return;
    }

    const filePath = flay.files.subtitles[idx];
    const ext = path.extname(filePath).substring(1).toLowerCase();
    const content = fs.readFileSync(filePath);

    res.setHeader('Content-Length', content.length);
    res.setHeader('Content-Type', `text/${ext}; charset=utf-8`);
    res.send(content);
  } catch (err: any) {
    res.status(404).json({ message: err.message });
  }
});

export default router;
