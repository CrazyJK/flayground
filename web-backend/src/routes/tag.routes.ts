import { Router } from 'express';
import { Tag } from '../domain/tag';
import * as flayService from '../services/flay.service';
import { sseSend } from '../services/sse-emitters';
import * as videoService from '../services/video-info.service';
import { tagInfoSource } from '../sources/info-sources';

const router = Router();

/**
 * @openapi
 * /info/tags:
 *   get:
 *     tags: [Tag]
 *     summary: 전체 Tag 목록
 *     parameters:
 *       - in: query
 *         name: include
 *         schema: { type: string, enum: [count] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Tag'
 */
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

/**
 * @openapi
 * /info/tags/{id}:
 *   get:
 *     tags: [Tag]
 *     summary: Tag 조회
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tag'
 */
router.get('/info/tags/:id', (req, res) => {
  res.json(tagInfoSource.get(parseInt(req.params.id, 10)));
});

/**
 * @openapi
 * /info/tags:
 *   post:
 *     tags: [Tag]
 *     summary: 신규 생성
 *     parameters:
 *       - in: query
 *         name: opus
 *         schema: { type: string }
 *         description: 지정 시 해당 opus에도 태그 추가
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Tag'
 *     responses:
 *       200:
 *         description: 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tag'
 */
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

/**
 * @openapi
 * /info/tags:
 *   patch:
 *     tags: [Tag]
 *     summary: 수정
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Tag'
 *     responses:
 *       204:
 *         description: 성공
 */
router.patch('/info/tags', (req, res) => {
  const tag: Tag = req.body;
  tagInfoSource.update(tag);
  sseSend(tag);
  res.sendStatus(204);
});

/**
 * @openapi
 * /info/tags:
 *   put:
 *     tags: [Tag]
 *     summary: id > 0 수정, else 신규
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Tag'
 *     responses:
 *       204:
 *         description: 성공
 */
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

/**
 * @openapi
 * /info/tags:
 *   delete:
 *     tags: [Tag]
 *     summary: 삭제
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Tag'
 *     responses:
 *       204:
 *         description: 성공
 */
router.delete('/info/tags', (req, res) => {
  const tag: Tag = req.body;
  // 모든 Video에서 해당 태그 제거
  videoService.removeTag(tag);
  tagInfoSource.delete(tag.id);
  sseSend(tag);
  res.sendStatus(204);
});

export default router;
