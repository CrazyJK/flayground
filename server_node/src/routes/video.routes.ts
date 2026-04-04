import { Router } from 'express';
import { Video } from '../domain/video';
import * as videoService from '../services/video-info.service';
import { tagInfoSource } from '../sources/info-sources';

const router = Router();

/** GET /info/video - 전체 Video 목록 */
router.get('/info/video', (_req, res) => {
  res.json(videoService.list());
});

/** GET /info/video/find/:query - 검색 */
router.get('/info/video/find/:query', (req, res) => {
  res.json(videoService.find(req.params.query));
});

/** GET /info/video/:opus - Video 조회 */
router.get('/info/video/:opus', (req, res) => {
  res.json(videoService.get(req.params.opus));
});

/** POST /info/video - 신규 생성 */
router.post('/info/video', (req, res) => {
  const video: Video = req.body;
  res.json(videoService.create(video));
});

/** PUT /info/video - 없으면 신규, 있으면 수정 */
router.put('/info/video', (req, res) => {
  const video: Video = req.body;
  res.json(videoService.put(video));
});

/** PATCH /info/video - 수정 */
router.patch('/info/video', (req, res) => {
  const video: Video = req.body;
  videoService.update(video);
  res.sendStatus(204);
});

/** DELETE /info/video - 삭제 */
router.delete('/info/video', (req, res) => {
  const video: Video = req.body;
  videoService.deleteVideo(video);
  res.sendStatus(204);
});

/** PUT /info/video/rank/:opus/:rank - rank 설정 */
router.put('/info/video/rank/:opus/:rank', (req, res) => {
  videoService.setRank(req.params.opus, parseInt(req.params.rank, 10));
  res.sendStatus(204);
});

/** PUT /info/video/like/:opus - like 추가 */
router.put('/info/video/like/:opus', (req, res) => {
  videoService.setLike(req.params.opus);
  res.sendStatus(204);
});

/** PUT /info/video/tag/:opus/:tagId/:checked - 태그 토글 */
router.put('/info/video/tag/:opus/:tagId/:checked', (req, res) => {
  const tag = tagInfoSource.get(parseInt(req.params.tagId, 10));
  const checked = req.params.checked === 'true';
  videoService.toggleTag(req.params.opus, tag, checked);
  res.sendStatus(204);
});

/** PUT /info/video/comment/:opus - 코멘트 설정 */
router.put('/info/video/comment/:opus', (req, res) => {
  videoService.setComment(req.params.opus, req.body);
  res.sendStatus(204);
});

export default router;
