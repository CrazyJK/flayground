import { Router } from 'express';
import { TagGroup } from '../domain/tag-group';
import { tagGroupInfoSource } from '../sources/info-sources';

const router = Router();

/** GET /info/tag-groups - 전체 TagGroup 목록 */
router.get('/info/tag-groups', (_req, res) => {
  res.json(tagGroupInfoSource.getList());
});

/** GET /info/tag-groups/:id - TagGroup 조회 */
router.get('/info/tag-groups/:id', (req, res) => {
  res.json(tagGroupInfoSource.get(req.params.id));
});

/** POST /info/tag-groups - 신규 생성 */
router.post('/info/tag-groups', (req, res) => {
  const tagGroup: TagGroup = req.body;
  const created = tagGroupInfoSource.create(tagGroup);
  res.json(created);
});

/** PATCH /info/tag-groups - 수정 */
router.patch('/info/tag-groups', (req, res) => {
  const tagGroup: TagGroup = req.body;
  tagGroupInfoSource.update(tagGroup);
  res.sendStatus(204);
});

/** DELETE /info/tag-groups - 삭제 */
router.delete('/info/tag-groups', (req, res) => {
  const tagGroup: TagGroup = req.body;
  tagGroupInfoSource.delete(tagGroup.id);
  res.sendStatus(204);
});

export default router;
