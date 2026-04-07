import { Router } from 'express';
import { Flay, FullyFlay } from '../domain/flay';
import { FlayCondition } from '../domain/flay-condition';
import * as actressInfoService from '../services/actress-info.service';
import * as flayCollector from '../services/flay-collector';
import * as flayService from '../services/flay.service';
import { calcScore } from '../services/score-calculator';

const router = Router();

// ── 정적 라우트 (파라미터 라우트보다 먼저 등록해야 함) ──

/**
 * @openapi
 * /flays:
 *   get:
 *     tags: [Flay]
 *     summary: 전체 Instance Flay 목록
 *     parameters:
 *       - in: query
 *         name: fields
 *         schema: { type: string, enum: [score] }
 *         description: score 맵 반환
 *       - in: query
 *         name: expand
 *         schema: { type: string, enum: [actress] }
 *         description: Actress 포함 확장
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [score] }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: tag
 *         schema: { type: integer }
 *       - in: query
 *         name: match
 *         schema: { type: string, enum: [similar] }
 *       - in: query
 *         name: count
 *         schema: { type: string, enum: ['true'] }
 *     responses:
 *       200:
 *         description: 성공
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: array
 *                   items:
 *                     $ref: '#/components/schemas/Flay'
 *                 - type: array
 *                   items:
 *                     $ref: '#/components/schemas/FullyFlay'
 *                 - type: object
 *                   additionalProperties: { type: number }
 *                   description: score 맵 (fields=score)
 */
router.get('/flays', (req, res) => {
  const { fields, expand, sort, order, search, tag, match, count } = req.query;

  // score 맵 반환
  if (fields === 'score') {
    return res.json(flayService.getScoreMap());
  }

  // 전체 Flay + Actress 목록
  if (expand === 'actress') {
    const dataList: FullyFlay[] = [];
    for (const flay of flayService.list()) {
      calcScore(flay);
      const actress = flay.actressList.map((name) => actressInfoService.get(name));
      dataList.push({ flay, actress });
    }
    return res.json(dataList);
  }

  // 정렬
  if (sort === 'score' && order === 'asc') {
    return res.json(flayService.getListOfLowScore());
  }
  if (sort === 'score' && order === 'desc') {
    return res.json(flayService.getListOrderbyScoreDesc());
  }

  // 태그 유사 검색
  if (tag && match === 'similar') {
    return res.json(flayService.findByTagLike(parseInt(tag as string, 10)));
  }

  // query 검색
  if (search) {
    return res.json(flayService.findByQuery(search as string));
  }

  // 필드별 검색: ?field=actress&value=xxx 또는 ?actress=xxx 형식 지원
  // fields, expand, sort, order, search, tag, match, count는 예약어이므로 제외
  const reservedKeys = new Set(['fields', 'expand', 'sort', 'order', 'search', 'tag', 'match', 'count']);

  const fieldParam = (req.query.field || req.query.key) as string | undefined;
  const valueParam = req.query.value as string | undefined;

  if (fieldParam && valueParam) {
    // ?field=actress&value=xxx 또는 ?key=actress&value=xxx 형식
    const result = flayService.findByField(fieldParam, valueParam);
    if (count === 'true') {
      return res.json(result.length);
    }
    return res.json(result);
  }

  const fieldEntry = Object.entries(req.query).find(([key]) => !reservedKeys.has(key) && key !== 'field' && key !== 'key' && key !== 'value');
  if (fieldEntry) {
    const [field, value] = fieldEntry;
    const result = flayService.findByField(field, value as string);
    if (count === 'true') {
      return res.json(result.length);
    }
    return res.json(result);
  }

  res.json(flayService.list());
});

/**
 * @openapi
 * /flays:
 *   post:
 *     tags: [Flay]
 *     summary: opus 목록으로 Flay 조회
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items: { type: string }
 *             example: ['ABC-001', 'DEF-002']
 *     responses:
 *       200:
 *         description: 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Flay'
 */
router.post('/flays', (req, res) => {
  const opusList: string[] = req.body;
  res.json(flayService.listByOpus(opusList));
});

/**
 * @openapi
 * /flays/search:
 *   post:
 *     tags: [Flay]
 *     summary: FlayCondition으로 필터링
 *     parameters:
 *       - in: query
 *         name: groupBy
 *         schema: { type: string, enum: [flay, studio, opus, title, actress, release] }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FlayCondition'
 *     responses:
 *       200:
 *         description: 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Flay'
 */
router.post('/flays/search', (req, res) => {
  const condition: FlayCondition = req.body;
  const groupBy = (req.query.groupBy as string) || 'flay';

  switch (groupBy) {
    case 'studio':
      return res.json(flayCollector.toStudioList(flayService.list(), condition));
    case 'opus':
      return res.json(flayCollector.toOpusList(flayService.list(), condition));
    case 'title':
      return res.json(flayCollector.toTitleList(flayService.list(), condition));
    case 'actress':
      return res.json(flayCollector.toActressList(flayService.list(), condition));
    case 'release':
      return res.json(flayCollector.toReleaseList(flayService.list(), condition));
    default:
      return res.json(flayCollector.toFlayList(flayService.list(), condition));
  }
});

/**
 * @openapi
 * /flays/candidates:
 *   get:
 *     tags: [Flay]
 *     summary: 후보 파일 목록
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Flay'
 */
router.get('/flays/candidates', (req, res) => {
  const keyword = req.query.keyword as string | undefined;
  if (keyword) {
    const kw = keyword.toLowerCase();
    const candidates = flayService.findCandidates().filter((flay) => {
      const fullname = `${flay.studio} ${flay.opus} ${flay.title} ${flay.actressList.join(' ')}`.toLowerCase();
      return fullname.includes(kw);
    });
    return res.json(candidates);
  }
  res.json(flayService.findCandidates());
});

/**
 * @openapi
 * /flays/exists:
 *   post:
 *     tags: [Flay]
 *     summary: opus 존재 여부 확인
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items: { type: string }
 *             example: ['ABC-001', 'DEF-002']
 *     responses:
 *       200:
 *         description: 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties: { type: boolean }
 */
router.post('/flays/exists', (req, res) => {
  res.json(flayService.exists(req.body));
});

/**
 * @openapi
 * /flays/open-folder:
 *   post:
 *     tags: [Flay]
 *     summary: 폴더 열기
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               path: { type: string }
 *     responses:
 *       204:
 *         description: 성공
 */
router.post('/flays/open-folder', (req, res) => {
  flayService.openFolderSvc(req.body.path);
  res.sendStatus(204);
});

/**
 * @openapi
 * /flays/files:
 *   delete:
 *     tags: [Flay]
 *     summary: 파일 삭제
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FlayFiles'
 *     responses:
 *       204:
 *         description: 성공
 */
router.delete('/flays/files', (req, res) => {
  flayService.deleteFileSvc(req.body);
  res.sendStatus(204);
});

// ── 파라미터 라우트 (정적 라우트 뒤에 등록) ──

/**
 * @openapi
 * /flays/{opus}:
 *   get:
 *     tags: [Flay]
 *     summary: Flay 조회
 *     parameters:
 *       - in: path
 *         name: opus
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: expand
 *         schema: { type: string, enum: [actress] }
 *     responses:
 *       200:
 *         description: 성공
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/Flay'
 *                 - $ref: '#/components/schemas/FullyFlay'
 *       404:
 *         description: 찾을 수 없음
 */
router.get('/flays/:opus', (req, res) => {
  try {
    const flay = flayService.getFlay(req.params.opus);
    if (req.query.expand === 'actress') {
      calcScore(flay);
      const actress = flay.actressList.map((name) => actressInfoService.get(name));
      const result: FullyFlay = { flay, actress };
      return res.json(result);
    }
    res.json(flay);
  } catch {
    res.status(404).json(null);
  }
});

/**
 * @openapi
 * /flays/{opus}/score:
 *   get:
 *     tags: [Flay]
 *     summary: Flay score 조회
 *     parameters:
 *       - in: path
 *         name: opus
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: number
 */
router.get('/flays/:opus/score', (req, res) => {
  res.json(flayService.getScore(req.params.opus));
});

/**
 * @openapi
 * /flays/{opus}/candidates/accept:
 *   patch:
 *     tags: [Flay]
 *     summary: 후보 수락
 *     parameters:
 *       - in: path
 *         name: opus
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: 성공
 */
router.patch('/flays/:opus/candidates/accept', (req, res) => {
  flayService.acceptCandidates(req.params.opus);
  res.sendStatus(204);
});

/**
 * @openapi
 * /flays/{opus}/play:
 *   post:
 *     tags: [Flay]
 *     summary: 영상 재생
 *     parameters:
 *       - in: path
 *         name: opus
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: seekTime
 *         schema: { type: number }
 *     responses:
 *       204:
 *         description: 성공
 */
router.post('/flays/:opus/play', (req, res) => {
  const seekTime = parseFloat(req.query.seekTime as string) || 0;
  flayService.playFlay(req.params.opus, seekTime);
  res.sendStatus(204);
});

/**
 * @openapi
 * /flays/{opus}/edit:
 *   post:
 *     tags: [Flay]
 *     summary: 자막 편집
 *     parameters:
 *       - in: path
 *         name: opus
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: 성공
 */
router.post('/flays/:opus/edit', (req, res) => {
  flayService.editFlay(req.params.opus);
  res.sendStatus(204);
});

/**
 * @openapi
 * /flays/{opus}:
 *   put:
 *     tags: [Flay]
 *     summary: 이름 변경
 *     parameters:
 *       - in: path
 *         name: opus
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Flay'
 *     responses:
 *       204:
 *         description: 성공
 */
router.put('/flays/:opus', (req, res) => {
  const newFlay: Flay = req.body;
  flayService.renameFlaySvc(req.params.opus, newFlay);
  res.sendStatus(204);
});

/**
 * @openapi
 * /flays/{opus}/files:
 *   delete:
 *     tags: [Flay]
 *     summary: Flay에 속한 파일 삭제
 *     parameters:
 *       - in: path
 *         name: opus
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FlayFiles'
 *     responses:
 *       204:
 *         description: 성공
 */
router.delete('/flays/:opus/files', (req, res) => {
  flayService.deleteFileOnFlay(req.params.opus, req.body);
  res.sendStatus(204);
});

export default router;
