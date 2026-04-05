import { Router } from 'express';
import { Diary } from '../domain/diary';
import { diarySource } from '../sources/diary-source';

const router = Router();

/**
 * @openapi
 * /diaries:
 *   get:
 *     tags: [Diary]
 *     summary: 전체 Diary 목록
 *     responses:
 *       200:
 *         description: 성공
 */
router.get('/diaries', (_req, res) => {
  res.json(diarySource.list());
});

/**
 * @openapi
 * /diaries/dates:
 *   get:
 *     tags: [Diary]
 *     summary: 날짜 키 목록
 *     responses:
 *       200:
 *         description: 성공
 */
router.get('/diaries/dates', (_req, res) => {
  res.json(diarySource.dates());
});

/**
 * @openapi
 * /diaries/meta:
 *   get:
 *     tags: [Diary]
 *     summary: 메타 목록
 *     responses:
 *       200:
 *         description: 성공
 */
router.get('/diaries/meta', (_req, res) => {
  res.json(diarySource.metaList());
});

/**
 * @openapi
 * /diaries/{date}:
 *   get:
 *     tags: [Diary]
 *     summary: 날짜로 조회
 *     parameters:
 *       - in: path
 *         name: date
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 성공
 *       404:
 *         description: 찾을 수 없음
 */
router.get('/diaries/:date', (req, res) => {
  const diary = diarySource.find(req.params.date);
  if (!diary) {
    res.status(404).json({ message: `Diary not found: ${req.params.date}` });
    return;
  }
  res.json(diary);
});

/**
 * @openapi
 * /diaries:
 *   post:
 *     tags: [Diary]
 *     summary: 저장
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200:
 *         description: 성공
 */
router.post('/diaries', (req, res) => {
  const diary: Diary = req.body;
  const saved = diarySource.save(diary);
  res.json(saved);
});

export default router;
