import { Router } from 'express';
import { TagGroup } from '../domain/tag-group';
import { tagGroupInfoSource } from '../sources/info-sources';

const router = Router();

/** GET /info/tagGroup - 전체 TagGroup 목록 */
router.get('/info/tagGroup', (_req, res) => {
  res.json(tagGroupInfoSource.getList());
});

/** GET /info/tagGroup/:id - TagGroup 조회 */
router.get('/info/tagGroup/:id', (req, res) => {
  res.json(tagGroupInfoSource.get(req.params.id));
});

/** POST /info/tagGroup - 신규 생성 */
router.post('/info/tagGroup', (req, res) => {
  const tagGroup: TagGroup = req.body;
  const created = tagGroupInfoSource.create(tagGroup);
  res.json(created);
});

/** PATCH /info/tagGroup - 수정 */
router.patch('/info/tagGroup', (req, res) => {
  const tagGroup: TagGroup = req.body;
  tagGroupInfoSource.update(tagGroup);
  res.sendStatus(204);
});

/** DELETE /info/tagGroup - 삭제 */
router.delete('/info/tagGroup', (req, res) => {
  const tagGroup: TagGroup = req.body;
  tagGroupInfoSource.delete(tagGroup.id);
  res.sendStatus(204);
});

export default router;
