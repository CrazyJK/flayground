import { Router } from 'express';
import * as archiveService from '../services/flay-archive.service';

const router = Router();

/**
 * @openapi
 * /archives:
 *   get:
 *     tags: [Archive]
 *     summary: 전체 Archive 목록
 *     parameters:
 *       - in: query
 *         name: fields
 *         schema: { type: string, enum: [opus] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 성공
 */
router.get('/archives', (req, res) => {
  const { fields, search } = req.query;

  if (fields === 'opus') {
    return res.json(archiveService.listOpus());
  }
  if (search) {
    return res.json(archiveService.find(search as string));
  }

  // 필드별 검색: ?field=actress&value=xxx 또는 ?key=actress&value=xxx 또는 ?actress=xxx 형식 지원
  const reservedKeys = new Set(['fields', 'search']);

  const fieldParam = (req.query.field || req.query.key) as string | undefined;
  const valueParam = req.query.value as string | undefined;

  if (fieldParam && valueParam) {
    return res.json(archiveService.findByField(fieldParam, valueParam));
  }

  const fieldEntry = Object.entries(req.query).find(([k]) => !reservedKeys.has(k) && k !== 'field' && k !== 'key' && k !== 'value');
  if (fieldEntry) {
    const [key, value] = fieldEntry;
    return res.json(archiveService.findByField(key, value as string));
  }

  res.json(archiveService.list());
});

/**
 * @openapi
 * /archives/{opus}:
 *   get:
 *     tags: [Archive]
 *     summary: Archive Flay 조회
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
router.get('/archives/:opus', (req, res) => {
  try {
    res.json(archiveService.get(req.params.opus));
  } catch {
    res.status(404).json(null);
  }
});

/**
 * @openapi
 * /archives/{opus}/to-instance:
 *   post:
 *     tags: [Archive]
 *     summary: Archive -> Instance 이동
 *     parameters:
 *       - in: path
 *         name: opus
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: 성공
 */
router.post('/archives/:opus/to-instance', (req, res) => {
  archiveService.toInstance(req.params.opus);
  res.sendStatus(204);
});

export default router;
