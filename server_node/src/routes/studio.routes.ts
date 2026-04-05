import { Router } from 'express';
import { Studio } from '../domain/studio';
import { sseSend } from '../services/sse-emitters';
import { getInstanceFlayList } from '../sources/flay-source';
import { studioInfoSource } from '../sources/info-sources';

const router = Router();

/**
 * @openapi
 * /info/studios:
 *   get:
 *     tags: [Studio]
 *     summary: 전체 Studio 목록
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: opus
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 성공
 */
router.get('/info/studios', (req, res) => {
  const { search, opus } = req.query;

  if (search) {
    return res.json(studioInfoSource.getList().filter((s) => JSON.stringify(s).includes(search as string)));
  }

  if (opus) {
    // opus로 Studio 찾기 (Java StudioInfoService.findOneByOpus() 대응)
    const opusStr = opus as string;
    const query = opusStr.substring(0, opusStr.lastIndexOf('-'));
    if (!query) {
      return res.json({ name: '', homepage: '', lastModified: -1 });
    }
    const matched = getInstanceFlayList()
      .filter((f) => f.opus.includes(query))
      .sort((a, b) => b.lastModified - a.lastModified);
    if (matched.length > 0) {
      return res.json(studioInfoSource.getOrNew(matched[0].studio));
    }
    return res.json({ name: '', homepage: '', lastModified: -1 });
  }

  res.json(studioInfoSource.getList());
});

/**
 * @openapi
 * /info/studios/{name}:
 *   get:
 *     tags: [Studio]
 *     summary: Studio 조회
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 성공
 *       404:
 *         description: 찾을 수 없음
 */
router.get('/info/studios/:name', (req, res) => {
  const studio = studioInfoSource.get(req.params.name);
  if (!studio) {
    res.status(404).json({ message: `Studio not found: ${req.params.name}` });
    return;
  }
  res.json(studio);
});

/**
 * @openapi
 * /info/studios:
 *   post:
 *     tags: [Studio]
 *     summary: 신규 생성
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200:
 *         description: 성공
 */
router.post('/info/studios', (req, res) => {
  const studio: Studio = req.body;
  const created = studioInfoSource.create(studio);
  sseSend(created);
  res.json(created);
});

/**
 * @openapi
 * /info/studios:
 *   patch:
 *     tags: [Studio]
 *     summary: 수정
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       204:
 *         description: 성공
 */
router.patch('/info/studios', (req, res) => {
  const studio: Studio = req.body;
  studioInfoSource.update(studio);
  sseSend(studio);
  res.sendStatus(204);
});

/**
 * @openapi
 * /info/studios:
 *   delete:
 *     tags: [Studio]
 *     summary: 삭제
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       204:
 *         description: 성공
 */
router.delete('/info/studios', (req, res) => {
  const studio: Studio = req.body;
  studioInfoSource.delete(studio.name);
  sseSend(studio);
  res.sendStatus(204);
});

export default router;
