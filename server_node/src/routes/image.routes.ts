import { Router } from 'express';
import { imageUpload } from '../middleware/upload';
import { paint } from '../services/flay-action-handler';
import { downloadPageImages } from '../services/page-image-downloader';
import { imageSource } from '../sources/image-source';

const router = Router();

/** GET /image - 전체 이미지 목록 */
router.get('/image', (_req, res) => {
  res.json(imageSource.list());
});

/** GET /image/size - 이미지 개수 */
router.get('/image/size', (_req, res) => {
  res.json(imageSource.size());
});

/** GET /image/random - 랜덤 이미지 */
router.get('/image/random', (_req, res) => {
  const list = imageSource.list();
  if (list.length === 0) {
    res.status(404).json({ message: '이미지가 없습니다' });
    return;
  }
  const idx = Math.floor(Math.random() * list.length);
  res.json(list[idx]);
});

/** GET /image/:idx - 인덱스로 이미지 조회 */
router.get('/image/:idx', (req, res) => {
  const idx = parseInt(req.params.idx, 10);
  try {
    res.json(imageSource.get(idx));
  } catch (err: any) {
    res.status(404).json({ message: err.message });
  }
});

/** DELETE /image/:idx - 이미지 삭제 */
router.delete('/image/:idx', (req, res) => {
  const idx = parseInt(req.params.idx, 10);
  try {
    imageSource.deleteByIdx(idx);
    res.status(204).end();
  } catch (err: any) {
    res.status(404).json({ message: err.message });
  }
});

/** PATCH /image/paint/:idx - 이미지 그림판에서 열기 */
router.patch('/image/paint/:idx', (req, res) => {
  const idx = parseInt(req.params.idx, 10);
  try {
    const image = imageSource.get(idx);
    paint(image.file);
    res.status(204).end();
  } catch (err: any) {
    res.status(404).json({ message: err.message });
  }
});

/** POST /image/upload - 이미지 업로드 (multer) */
router.post('/image/upload', imageUpload.array('file'), (req, res) => {
  const files = req.files as Express.Multer.File[] | undefined;
  if (!files || files.length === 0) {
    res.status(400).json({ message: '파일이 없습니다' });
    return;
  }

  const images = files.map((file, i) => ({
    idx: i,
    name: file.originalname,
    path: file.destination,
    length: file.size,
    modified: Date.now(),
    file: file.path,
  }));

  // 이미지 소스 리로드 마킹
  imageSource.markChanged();
  res.json(images);
});

/** GET /image/pageImageDownload - 페이지 이미지 다운로드 */
router.get('/image/pageImageDownload', async (req, res) => {
  const { pageUrl, downloadDir, folderName, titlePrefix, titleCssQuery, minimumKbSize } = req.query;
  if (!pageUrl || !downloadDir || !folderName) {
    res.status(400).json({ message: 'pageUrl, downloadDir, folderName은 필수입니다' });
    return;
  }
  try {
    const result = await downloadPageImages(pageUrl as string, downloadDir as string, folderName as string, (titlePrefix as string) || '', (titleCssQuery as string) || '', parseInt((minimumKbSize as string) || '0', 10));
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
