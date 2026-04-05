import { Router } from 'express';
import { Video } from '../domain/video';
import * as videoService from '../services/video-info.service';
import { tagInfoSource } from '../sources/info-sources';

const router = Router();

/**
 * @openapi
 * /info/videos:
 *   get:
 *     tags: [Video]
 *     summary: 전체 Video 목록
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 성공
 */
router.get('/info/videos', (req, res) => {
  const { search } = req.query;
  if (search) {
    return res.json(videoService.find(search as string));
  }
  res.json(videoService.list());
});

/**
 * @openapi
 * /info/videos/{opus}:
 *   get:
 *     tags: [Video]
 *     summary: Video 조회
 *     parameters:
 *       - in: path
 *         name: opus
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 성공
 *       404:
 *         description: 찾을 수 없음
 */
router.get('/info/videos/:opus', (req, res) => {
  try {
    res.json(videoService.get(req.params.opus));
  } catch {
    res.status(404).json(null);
  }
});

/**
 * @openapi
 * /info/videos:
 *   post:
 *     tags: [Video]
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
router.post('/info/videos', (req, res) => {
  const video: Video = req.body;
  res.json(videoService.create(video));
});

/**
 * @openapi
 * /info/videos:
 *   put:
 *     tags: [Video]
 *     summary: 없으면 신규, 있으면 수정
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200:
 *         description: 성공
 */
router.put('/info/videos', (req, res) => {
  const video: Video = req.body;
  res.json(videoService.put(video));
});

/**
 * @openapi
 * /info/videos:
 *   patch:
 *     tags: [Video]
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
router.patch('/info/videos', (req, res) => {
  const video: Video = req.body;
  videoService.update(video);
  res.sendStatus(204);
});

/**
 * @openapi
 * /info/videos:
 *   delete:
 *     tags: [Video]
 *     summary: 삭제
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       204:
 *         description: 성공
 */
router.delete('/info/videos', (req, res) => {
  const video: Video = req.body;
  videoService.deleteVideo(video);
  res.sendStatus(204);
});

/**
 * @openapi
 * /info/videos/{opus}/rank:
 *   put:
 *     tags: [Video]
 *     summary: rank 설정
 *     parameters:
 *       - in: path
 *         name: opus
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rank: { type: integer }
 *     responses:
 *       204:
 *         description: 성공
 */
router.put('/info/videos/:opus/rank', (req, res) => {
  const rank = req.body.rank ?? parseInt(req.body as string, 10);
  videoService.setRank(req.params.opus, rank);
  res.sendStatus(204);
});

/**
 * @openapi
 * /info/videos/{opus}/like:
 *   put:
 *     tags: [Video]
 *     summary: like 추가
 *     parameters:
 *       - in: path
 *         name: opus
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: 성공
 */
router.put('/info/videos/:opus/like', (req, res) => {
  videoService.setLike(req.params.opus);
  res.sendStatus(204);
});

/**
 * @openapi
 * /info/videos/{opus}/tags/{tagId}:
 *   put:
 *     tags: [Video]
 *     summary: 태그 토글
 *     parameters:
 *       - in: path
 *         name: opus
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: tagId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               checked: { type: boolean }
 *     responses:
 *       204:
 *         description: 성공
 */
router.put('/info/videos/:opus/tags/:tagId', (req, res) => {
  const tag = tagInfoSource.get(parseInt(req.params.tagId, 10));
  const checked = req.body.checked === true || req.body.checked === 'true';
  videoService.toggleTag(req.params.opus, tag, checked);
  res.sendStatus(204);
});

/**
 * @openapi
 * /info/videos/{opus}/comment:
 *   put:
 *     tags: [Video]
 *     summary: 코멘트 설정
 *     parameters:
 *       - in: path
 *         name: opus
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       204:
 *         description: 성공
 */
router.put('/info/videos/:opus/comment', (req, res) => {
  videoService.setComment(req.params.opus, req.body);
  res.sendStatus(204);
});

export default router;
