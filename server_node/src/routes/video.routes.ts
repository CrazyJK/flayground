import { Router } from 'express';
import { Video } from '../domain/video';
import * as videoService from '../services/video-info.service';
import { tagInfoSource } from '../sources/info-sources';

const router = Router();

/** GET /info/videos - 전체 Video 목록 (?search= 검색) */
router.get('/info/videos', (req, res) => {
  const { search } = req.query;
  if (search) {
    return res.json(videoService.find(search as string));
  }
  res.json(videoService.list());
});

/** GET /info/videos/:opus - Video 조회 */
router.get('/info/videos/:opus', (req, res) => {
  try {
    res.json(videoService.get(req.params.opus));
  } catch {
    res.status(404).json(null);
  }
});

/** POST /info/videos - 신규 생성 */
router.post('/info/videos', (req, res) => {
  const video: Video = req.body;
  res.json(videoService.create(video));
});

/** PUT /info/videos - 없으면 신규, 있으면 수정 */
router.put('/info/videos', (req, res) => {
  const video: Video = req.body;
  res.json(videoService.put(video));
});

/** PATCH /info/videos - 수정 */
router.patch('/info/videos', (req, res) => {
  const video: Video = req.body;
  videoService.update(video);
  res.sendStatus(204);
});

/** DELETE /info/videos - 삭제 */
router.delete('/info/videos', (req, res) => {
  const video: Video = req.body;
  videoService.deleteVideo(video);
  res.sendStatus(204);
});

/** PUT /info/videos/:opus/rank - rank 설정 (body: { rank }) */
router.put('/info/videos/:opus/rank', (req, res) => {
  const rank = req.body.rank ?? parseInt(req.body as string, 10);
  videoService.setRank(req.params.opus, rank);
  res.sendStatus(204);
});

/** PUT /info/videos/:opus/like - like 추가 */
router.put('/info/videos/:opus/like', (req, res) => {
  videoService.setLike(req.params.opus);
  res.sendStatus(204);
});

/** PUT /info/videos/:opus/tags/:tagId - 태그 토글 (body: { checked }) */
router.put('/info/videos/:opus/tags/:tagId', (req, res) => {
  const tag = tagInfoSource.get(parseInt(req.params.tagId, 10));
  const checked = req.body.checked === true || req.body.checked === 'true';
  videoService.toggleTag(req.params.opus, tag, checked);
  res.sendStatus(204);
});

/** PUT /info/videos/:opus/comment - 코멘트 설정 */
router.put('/info/videos/:opus/comment', (req, res) => {
  videoService.setComment(req.params.opus, req.body);
  res.sendStatus(204);
});

export default router;
