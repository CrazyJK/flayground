import { Router } from 'express';
import { Tag } from '../domain/tag';
import * as flayService from '../services/flay.service';
import { sseSend } from '../services/sse-emitters';
import * as videoService from '../services/video-info.service';
import { tagInfoSource } from '../sources/info-sources';

const router = Router();

/** GET /info/tag - 전체 Tag 목록 */
router.get('/info/tag', (_req, res) => {
  res.json(tagInfoSource.getList());
});

/** GET /info/tag/withCount - Tag 목록 (count 포함) */
router.get('/info/tag/withCount', (_req, res) => {
  const result = tagInfoSource.getList().map((tag) => ({
    id: tag.id,
    name: tag.name,
    group: tag.group,
    description: tag.description,
    count: flayService.findByField('tag', String(tag.id)).length,
  }));
  res.json(result);
});

/** GET /info/tag/find/:query - 검색 */
router.get('/info/tag/find/:query', (req, res) => {
  const query = req.params.query;
  res.json(tagInfoSource.getList().filter((t) => JSON.stringify(t).includes(query)));
});

/** GET /info/tag/:id - Tag 조회 */
router.get('/info/tag/:id', (req, res) => {
  res.json(tagInfoSource.get(parseInt(req.params.id, 10)));
});

/** POST /info/tag - 신규 생성 */
router.post('/info/tag', (req, res) => {
  const tag: Tag = req.body;
  // 새 ID 할당
  const maxId = tagInfoSource.getList().reduce((max, t) => Math.max(max, t.id), 0);
  tag.id = maxId + 1;
  const created = tagInfoSource.create(tag);
  sseSend(created);
  res.json(created);
});

/** POST /info/tag/:opus - 신규 생성 후 opus에 추가 */
router.post('/info/tag/:opus', (req, res) => {
  const tag: Tag = req.body;
  const maxId = tagInfoSource.getList().reduce((max, t) => Math.max(max, t.id), 0);
  tag.id = maxId + 1;
  const created = tagInfoSource.create(tag);
  // opus의 video에 태그 추가
  const flay = flayService.get(req.params.opus);
  if (!flay.video.tags.some((t) => t.id === created.id)) {
    flay.video.tags.push(created);
  }
  sseSend(created);
  res.json(created);
});

/** PATCH /info/tag - 수정 */
router.patch('/info/tag', (req, res) => {
  const tag: Tag = req.body;
  tagInfoSource.update(tag);
  sseSend(tag);
  res.sendStatus(204);
});

/** PUT /info/tag - id > 0 수정, else 신규 */
router.put('/info/tag', (req, res) => {
  const tag: Tag = req.body;
  if (tag.id > 0) {
    tagInfoSource.update(tag);
  } else {
    const maxId = tagInfoSource.getList().reduce((max, t) => Math.max(max, t.id), 0);
    tag.id = maxId + 1;
    tagInfoSource.create(tag);
  }
  sseSend(tag);
  res.sendStatus(204);
});

/** DELETE /info/tag - 삭제 */
router.delete('/info/tag', (req, res) => {
  const tag: Tag = req.body;
  // 모든 Video에서 해당 태그 제거
  videoService.removeTag(tag);
  tagInfoSource.delete(tag.id);
  sseSend(tag);
  res.sendStatus(204);
});

export default router;
