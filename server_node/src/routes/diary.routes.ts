import { Router } from 'express';
import { Diary } from '../domain/diary';
import { diarySource } from '../sources/diary-source';

const router = Router();

/** GET /diaries - 전체 Diary 목록 */
router.get('/diaries', (_req, res) => {
  res.json(diarySource.list());
});

/** GET /diaries/dates - 날짜 키 목록 */
router.get('/diaries/dates', (_req, res) => {
  res.json(diarySource.dates());
});

/** GET /diaries/meta - 메타 목록 */
router.get('/diaries/meta', (_req, res) => {
  res.json(diarySource.metaList());
});

/** GET /diaries/:date - 날짜로 조회 */
router.get('/diaries/:date', (req, res) => {
  const diary = diarySource.find(req.params.date);
  if (!diary) {
    res.status(404).json({ message: `Diary not found: ${req.params.date}` });
    return;
  }
  res.json(diary);
});

/** POST /diaries - 저장 */
router.post('/diaries', (req, res) => {
  const diary: Diary = req.body;
  const saved = diarySource.save(diary);
  res.json(saved);
});

export default router;
