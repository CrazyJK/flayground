import { Router } from 'express';
import { Studio } from '../domain/studio';
import { sseSend } from '../services/sse-emitters';
import { getInstanceFlayList } from '../sources/flay-source';
import { studioInfoSource } from '../sources/info-sources';

const router = Router();

/** GET /info/studio - 전체 Studio 목록 */
router.get('/info/studio', (_req, res) => {
  res.json(studioInfoSource.getList());
});

/** GET /info/studio/find/:query - 검색 */
router.get('/info/studio/find/:query', (req, res) => {
  const query = req.params.query;
  res.json(studioInfoSource.getList().filter((s) => JSON.stringify(s).includes(query)));
});

/** GET /info/studio/findOneByOpus/:opus - opus로 Studio 찾기
 * Java StudioInfoService.findOneByOpus() 대응
 */
router.get('/info/studio/findOneByOpus/:opus', (req, res) => {
  const opus = req.params.opus;
  const query = opus.substring(0, opus.lastIndexOf('-'));

  if (!query) {
    res.json({ name: '', homepage: '', lastModified: -1 });
    return;
  }

  const matched = getInstanceFlayList()
    .filter((f) => f.opus.includes(query))
    .sort((a, b) => b.lastModified - a.lastModified);

  if (matched.length > 0) {
    res.json(studioInfoSource.getOrNew(matched[0].studio));
  } else {
    res.json({ name: '', homepage: '', lastModified: -1 });
  }
});

/** GET /info/studio/:name - 이름으로 Studio 조회 */
router.get('/info/studio/:name', (req, res) => {
  const studio = studioInfoSource.get(req.params.name);
  if (!studio) {
    res.status(404).json({ message: `Studio not found: ${req.params.name}` });
    return;
  }
  res.json(studio);
});

/** POST /info/studio - 신규 생성 */
router.post('/info/studio', (req, res) => {
  const studio: Studio = req.body;
  const created = studioInfoSource.create(studio);
  sseSend(created);
  res.json(created);
});

/** PATCH /info/studio - 수정 */
router.patch('/info/studio', (req, res) => {
  const studio: Studio = req.body;
  studioInfoSource.update(studio);
  sseSend(studio);
  res.sendStatus(204);
});

/** DELETE /info/studio - 삭제 */
router.delete('/info/studio', (req, res) => {
  const studio: Studio = req.body;
  studioInfoSource.delete(studio.name);
  sseSend(studio);
  res.sendStatus(204);
});

export default router;
