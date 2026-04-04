import { Router } from 'express';
import { Tag } from '../domain/tag';
import * as flayService from '../services/flay.service';
import { sseSend } from '../services/sse-emitters';
import * as videoService from '../services/video-info.service';
import { tagInfoSource } from '../sources/info-sources';

const router = Router();

/** GET /info/tags - 전체 Tag 목록 (?include=count, ?search=) */
router.get('/info/tags', (req, res) => {
  const { include, search } = req.query;

  if (include === 'count') {
    const result = tagInfoSource.getList().map((tag) => ({
      id: tag.id,
      name: tag.name,
      group: tag.group,
      description: tag.description,
      count: flayService.findByField('tag', String(tag.id)).length,
    }));
    return res.json(result);
  }
  if (search) {
    return res.json(tagInfoSource.getList().filter((t) => JSON.stringify(t).includes(search as string)));
  }
  res.json(tagInfoSource.getList());
});

/** GET /info/tags/:id - Tag 조회 */
router.get('/info/tags/:id', (req, res) => {
  res.json(tagInfoSource.get(parseInt(req.params.id, 10)));
});

/** POST /info/tags - 신규 생성 (?opus= 지정 시 해당 opus에도 추가) */
router.post('/info/tags', (req, res) => {
  const tag: Tag = req.body;
  // 새 ID 할당
  const maxId = tagInfoSource.getList().reduce((max, t) => Math.max(max, t.id), 0);
  tag.id = maxId + 1;
  const created = tagInfoSource.create(tag);

  // opus 쿼리 파라미터가 있으면 해당 flay의 video에 태그 추가
  const opus = req.query.opus as string | undefined;
  if (opus) {
    const flay = flayService.get(opus);
    if (!flay.video.tags.some((t) => t.id === created.id)) {
      flay.video.tags.push(created);
    }
  }

  sseSend(created);
  res.json(created);
});

/** PATCH /info/tags - 수정 */
router.patch('/info/tags', (req, res) => {
  const tag: Tag = req.body;
  tagInfoSource.update(tag);
  sseSend(tag);
  res.sendStatus(204);
});

/** PUT /info/tags - id > 0 수정, else 신규 */
router.put('/info/tags', (req, res) => {
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

/** DELETE /info/tags - 삭제 */
router.delete('/info/tags', (req, res) => {
  const tag: Tag = req.body;
  // 모든 Video에서 해당 태그 제거
  videoService.removeTag(tag);
  tagInfoSource.delete(tag.id);
  sseSend(tag);
  res.sendStatus(204);
});

export default router;
