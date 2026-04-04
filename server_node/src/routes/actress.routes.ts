import { Router } from 'express';
import { Actress } from '../domain/actress';
import * as actressService from '../services/actress-info.service';

const router = Router();

/** GET /info/actresses - 전체 목록 (format=map 이면 name->Actress 맵) */
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

/** GET /info/actresses/name-check - 이름 유사도 체크 (?threshold=) */
router.get('/info/actresses/name-check', (req, res) => {
  const threshold = parseFloat(req.query.threshold as string) || 0;
  res.json(actressService.funcNameCheck(threshold));
});

/** GET /info/actresses/:name - Actress 조회 */
router.get('/info/actresses/:name', (req, res) => {
  res.json(actressService.get(req.params.name));
});

/** POST /info/actresses - 신규 생성 */
router.post('/info/actresses', (req, res) => {
  const actress: Actress = req.body;
  res.json(actressService.create(actress));
});

/** PATCH /info/actresses - 수정 */
router.patch('/info/actresses', (req, res) => {
  const actress: Actress = req.body;
  actressService.update(actress);
  res.sendStatus(204);
});

/** PUT /info/actresses - 병합 */
router.put('/info/actresses', (req, res) => {
  const actress: Actress = req.body;
  actressService.persist(actress);
  res.sendStatus(204);
});

/** PUT /info/actresses/:name - 이름 변경 (body: Actress with newName) */
router.put('/info/actresses/:name', (req, res) => {
  const actress: Actress = req.body;
  actressService.rename(actress, req.params.name);
  res.sendStatus(204);
});

/** PATCH /info/actresses/:name/favorite - 즐겨찾기 설정 (body: { checked }) */
router.patch('/info/actresses/:name/favorite', (req, res) => {
  const { checked } = req.body;
  actressService.setFavorite(req.params.name, checked === true || checked === 'true');
  res.sendStatus(204);
});

/** DELETE /info/actresses - 삭제 */
router.delete('/info/actresses', (req, res) => {
  const actress: Actress = req.body;
  actressService.deleteActress(actress);
  res.sendStatus(204);
});

export default router;
