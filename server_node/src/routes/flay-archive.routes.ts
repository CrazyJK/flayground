import { Router } from 'express';
import * as archiveService from '../services/flay-archive.service';

const router = Router();

/** GET /archive - 전체 Archive 목록 */
router.get('/archive', (_req, res) => {
  res.json(archiveService.list());
});

/** GET /archive/list/opus - Archive opus 목록 */
router.get('/archive/list/opus', (_req, res) => {
  res.json(archiveService.listOpus());
});

/** GET /archive/find/:key/:value - 필드별 검색 */
router.get('/archive/find/:key/:value', (req, res) => {
  res.json(archiveService.findByField(req.params.key, req.params.value));
});

/** GET /archive/find/:query - query 검색 */
router.get('/archive/find/:query', (req, res) => {
  res.json(archiveService.find(req.params.query));
});

/** GET /archive/:opus - Archive Flay 조회 */
router.get('/archive/:opus', (req, res) => {
  res.json(archiveService.get(req.params.opus));
});

/** PATCH /archive/toInstance/:opus - Archive -> Instance 이동 */
router.patch('/archive/toInstance/:opus', (req, res) => {
  archiveService.toInstance(req.params.opus);
  res.sendStatus(204);
});

export default router;
