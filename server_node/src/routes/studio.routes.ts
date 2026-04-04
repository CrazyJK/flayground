import { Router } from 'express';
import { Studio } from '../domain/studio';
import { sseSend } from '../services/sse-emitters';
import { getInstanceFlayList } from '../sources/flay-source';
import { studioInfoSource } from '../sources/info-sources';

const router = Router();

/** GET /info/studios - 전체 Studio 목록 (?search=, ?opus=) */
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

/** GET /info/studios/:name - 이름으로 Studio 조회 */
router.get('/info/studios/:name', (req, res) => {
  const studio = studioInfoSource.get(req.params.name);
  if (!studio) {
    res.status(404).json({ message: `Studio not found: ${req.params.name}` });
    return;
  }
  res.json(studio);
});

/** POST /info/studios - 신규 생성 */
router.post('/info/studios', (req, res) => {
  const studio: Studio = req.body;
  const created = studioInfoSource.create(studio);
  sseSend(created);
  res.json(created);
});

/** PATCH /info/studios - 수정 */
router.patch('/info/studios', (req, res) => {
  const studio: Studio = req.body;
  studioInfoSource.update(studio);
  sseSend(studio);
  res.sendStatus(204);
});

/** DELETE /info/studios - 삭제 */
router.delete('/info/studios', (req, res) => {
  const studio: Studio = req.body;
  studioInfoSource.delete(studio.name);
  sseSend(studio);
  res.sendStatus(204);
});

export default router;
