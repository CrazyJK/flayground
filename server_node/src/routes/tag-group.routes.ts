import { Router } from 'express';
import { TagGroup } from '../domain/tag-group';
import { tagGroupInfoSource } from '../sources/info-sources';

const router = Router();

/**
 * @openapi
 * /info/tag-groups:
 *   get:
 *     tags: [TagGroup]
 *     summary: 전체 TagGroup 목록
 *     responses:
 *       200:
 *         description: 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TagGroup'
 */
router.get('/info/tag-groups', (_req, res) => {
  res.json(tagGroupInfoSource.getList());
});

/**
 * @openapi
 * /info/tag-groups/{id}:
 *   get:
 *     tags: [TagGroup]
 *     summary: TagGroup 조회
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TagGroup'
 */
router.get('/info/tag-groups/:id', (req, res) => {
  res.json(tagGroupInfoSource.get(req.params.id));
});

/**
 * @openapi
 * /info/tag-groups:
 *   post:
 *     tags: [TagGroup]
 *     summary: 신규 생성
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TagGroup'
 *     responses:
 *       200:
 *         description: 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TagGroup'
 */
router.post('/info/tag-groups', (req, res) => {
  const tagGroup: TagGroup = req.body;
  const created = tagGroupInfoSource.create(tagGroup);
  res.json(created);
});

/**
 * @openapi
 * /info/tag-groups:
 *   patch:
 *     tags: [TagGroup]
 *     summary: 수정
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TagGroup'
 *     responses:
  const tagGroup: TagGroup = req.body;
  tagGroupInfoSource.update(tagGroup);
  res.sendStatus(204);
});

/**
 * @openapi
 * /info/tag-groups:
 *   delete:
 *     tags: [TagGroup]
 *     summary: 삭제
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TagGroup'
 *     responses:
 *       204:
 *         description: 성공
 */
router.delete('/info/tag-groups', (req, res) => {
  const tagGroup: TagGroup = req.body;
  tagGroupInfoSource.delete(tagGroup.id);
  res.sendStatus(204);
});

export default router;
