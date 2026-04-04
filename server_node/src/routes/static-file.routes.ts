import { Router } from 'express';
import fs from 'fs';
import mime from 'mime-types';
import { getArchiveFlay, getInstanceFlay } from '../sources/flay-source';
import { imageSource } from '../sources/image-source';

const router = Router();

/**
 * GET /static/cover/:opus - Flay 커버 이미지 바이너리 응답
 * Java ImageRequestHandler.getCover() 대응
 */
router.get('/static/cover/:opus', (req, res) => {
  const { opus } = req.params;

  let coverPath: string | undefined;
  try {
    const flay = getInstanceFlay(opus);
    coverPath = flay.files.cover?.[0];
  } catch {
    try {
      const flay = getArchiveFlay(opus);
      coverPath = flay.files.cover?.[0];
    } catch {
      // 둘 다 없음
    }
  }

  if (!coverPath || !fs.existsSync(coverPath)) {
    res.status(404).end();
    return;
  }

  const contentType = mime.lookup(coverPath) || 'application/octet-stream';
  res.setHeader('Content-Type', contentType);
  fs.createReadStream(coverPath).pipe(res);
});

/**
 * GET /static/image/:idx - 이미지 바이너리 응답
 * Java ImageRequestHandler.getImage() 대응
 */
router.get('/static/image/:idx', (req, res) => {
  const idx = parseInt(req.params.idx, 10);

  let image;
  try {
    image = imageSource.get(idx);
  } catch {
    res.status(404).end();
    return;
  }

  if (!fs.existsSync(image.file)) {
    res.status(404).end();
    return;
  }

  const contentType = mime.lookup(image.file) || 'application/octet-stream';
  res.setHeader('Content-Type', contentType);
  fs.createReadStream(image.file).pipe(res);
});

export default router;
