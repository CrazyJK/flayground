import { Router } from 'express';
import { Actress } from '../domain/actress';
import * as actressService from '../services/actress-info.service';

const router = Router();

/**
 * @openapi
 * /info/actresses:
 *   get:
 *     tags: [Actress]
 *     summary: 전체 Actress 목록
 *     parameters:
 *       - in: query
 *         name: format
 *         schema: { type: string, enum: [map] }
 *       - in: query
 *         name: localname
 *         schema: { type: string }
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
 *                 $ref: '#/components/schemas/Actress'
 */
router.get('/info/actresses', (req, res) => {
  const { format, localname, search } = req.query;

  if (format === 'map') {
    const map: Record<string, Actress> = {};
    for (const a of actressService.list()) {
      map[a.name] = a;
    }
    return res.json(map);
  }
  if (localname) {
    return res.json(actressService.findByLocalname(localname as string));
  }
  if (search) {
    return res.json(actressService.find(search as string));
  }
  res.json(actressService.list());
});

/**
 * @openapi
 * /info/actresses/name-check:
 *   get:
 *     tags: [Actress]
 *     summary: 이름 유사도 체크
 *     parameters:
 *       - in: query
 *         name: threshold
 *         schema: { type: number }
 *     responses:
 *       200:
 *         description: 성공
 */
router.get('/info/actresses/name-check', (req, res) => {
  const threshold = parseFloat(req.query.threshold as string) || 0;
  res.json(actressService.funcNameCheck(threshold));
});

/**
 * @openapi
 * /info/actresses/{name}:
 *   get:
 *     tags: [Actress]
 *     summary: Actress 조회
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Actress'
 */
router.get('/info/actresses/:name', (req, res) => {
  res.json(actressService.get(req.params.name));
});

/**
 * @openapi
 * /info/actresses:
 *   post:
 *     tags: [Actress]
 *     summary: 신규 생성
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Actress'
 *     responses:
 *       200:
 *         description: 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Actress'
 */
router.post('/info/actresses', (req, res) => {
  const actress: Actress = req.body;
  res.json(actressService.create(actress));
});

/**
 * @openapi
 * /info/actresses:
 *   patch:
 *     tags: [Actress]
 *     summary: 수정
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Actress'
 *     responses:
  const actress: Actress = req.body;
  actressService.update(actress);
  res.sendStatus(204);
});

/**
 * @openapi
 * /info/actresses:
 *   put:
 *     tags: [Actress]
 *     summary: 병합
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Actress'
 *     responses:
 *       204:
 *         description: 성공
 */
router.put('/info/actresses', (req, res) => {
  const actress: Actress = req.body;
  actressService.persist(actress);
  res.sendStatus(204);
});

/**
 * @openapi
 * /info/actresses/{name}:
 *   put:
 *     tags: [Actress]
 *     summary: 이름 변경
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Actress'
 *     responses:
 *       204:
 *         description: 성공
 */
router.put('/info/actresses/:name', (req, res) => {
  const actress: Actress = req.body;
  actressService.rename(actress, req.params.name);
  res.sendStatus(204);
});

/**
 * @openapi
 * /info/actresses/{name}/favorite:
 *   patch:
 *     tags: [Actress]
 *     summary: 즐겨찾기 설정
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema: { type: string }
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
router.patch('/info/actresses/:name/favorite', (req, res) => {
  const { checked } = req.body;
  actressService.setFavorite(req.params.name, checked === true || checked === 'true');
  res.sendStatus(204);
});

/**
 * @openapi
 * /info/actresses:
 *   delete:
 *     tags: [Actress]
 *     summary: 삭제
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Actress'
 *     responses:
 *       204:
 *         description: 성공
 */
router.delete('/info/actresses', (req, res) => {
  const actress: Actress = req.body;
  actressService.deleteActress(actress);
  res.sendStatus(204);
});

export default router;
