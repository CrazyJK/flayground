import { Router } from 'express';
import { Diary } from '../domain/diary';
import { diarySource } from '../sources/diary-source';

const router = Router();

/** GET /diary - 전체 Diary 목록 */
router.get('/diary', (_req, res) => {
  res.json(diarySource.list());
});

/** GET /diary/dates - 날짜 키 목록 */
router.get('/diary/dates', (_req, res) => {
  res.json(diarySource.dates());
});

/** GET /diary/meta - 메타 목록 */
router.get('/diary/meta', (_req, res) => {
  res.json(diarySource.metaList());
});

/** GET /diary/date/:date - 날짜로 조회 */
router.get('/diary/date/:date', (req, res) => {
  const diary = diarySource.find(req.params.date);
  if (!diary) {
    res.status(404).json({ message: `Diary not found: ${req.params.date}` });
    return;
  }
  res.json(diary);
});

/** POST /diary - 저장 */
router.post('/diary', (req, res) => {
  const diary: Diary = req.body;
  const saved = diarySource.save(diary);
  res.json(saved);
});

export default router;
