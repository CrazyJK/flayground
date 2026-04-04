import { Router } from 'express';
import * as archiveService from '../services/flay-archive.service';

const router = Router();

/** GET /archives - 전체 Archive 목록 (?fields=opus, ?search=, ?{key}={value}) */
router.get('/archives', (req, res) => {
  const { fields, search } = req.query;

  if (fields === 'opus') {
    return res.json(archiveService.listOpus());
  }
  if (search) {
    return res.json(archiveService.find(search as string));
  }

  // 필드별 검색: 예약어 제외한 쿼리 파라미터
  const reservedKeys = new Set(['fields', 'search']);
  const fieldEntry = Object.entries(req.query).find(([key]) => !reservedKeys.has(key));
  if (fieldEntry) {
    const [key, value] = fieldEntry;
    return res.json(archiveService.findByField(key, value as string));
  }

  res.json(archiveService.list());
});

/** GET /archives/:opus - Archive Flay 조회 */
router.get('/archives/:opus', (req, res) => {
  res.json(archiveService.get(req.params.opus));
});

/** POST /archives/:opus/to-instance - Archive -> Instance 이동 */
router.post('/archives/:opus/to-instance', (req, res) => {
  archiveService.toInstance(req.params.opus);
  res.sendStatus(204);
});

export default router;
