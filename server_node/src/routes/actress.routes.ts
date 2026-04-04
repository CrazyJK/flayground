import { Router } from 'express';
import { Actress } from '../domain/actress';
import * as actressService from '../services/actress-info.service';

const router = Router();

/** GET /info/actress - 전체 목록 */
router.get('/info/actress', (_req, res) => {
  res.json(actressService.list());
});

/** GET /info/actress/map - name -> Actress 맵 */
router.get('/info/actress/map', (_req, res) => {
  const map: Record<string, Actress> = {};
  for (const a of actressService.list()) {
    map[a.name] = a;
  }
  res.json(map);
});

/** GET /info/actress/find/byLocalname/:localname - 로컬이름 검색 */
router.get('/info/actress/find/byLocalname/:localname', (req, res) => {
  res.json(actressService.findByLocalname(req.params.localname));
});

/** GET /info/actress/find/:query - 검색 */
router.get('/info/actress/find/:query', (req, res) => {
  res.json(actressService.find(req.params.query));
});

/** GET /info/actress/func/nameCheck/:limit - 이름 유사도 체크 */
router.get('/info/actress/func/nameCheck/:limit', (req, res) => {
  res.json(actressService.funcNameCheck(parseFloat(req.params.limit)));
});

/** GET /info/actress/:name - Actress 조회 */
router.get('/info/actress/:name', (req, res) => {
  res.json(actressService.get(req.params.name));
});

/** POST /info/actress - 신규 생성 */
router.post('/info/actress', (req, res) => {
  const actress: Actress = req.body;
  res.json(actressService.create(actress));
});

/** PATCH /info/actress - 수정 */
router.patch('/info/actress', (req, res) => {
  const actress: Actress = req.body;
  actressService.update(actress);
  res.sendStatus(204);
});

/** PUT /info/actress - 병합 */
router.put('/info/actress', (req, res) => {
  const actress: Actress = req.body;
  actressService.persist(actress);
  res.sendStatus(204);
});

/** PUT /info/actress/rename/:name - 이름 변경 */
router.put('/info/actress/rename/:name', (req, res) => {
  const actress: Actress = req.body;
  actressService.rename(actress, req.params.name);
  res.sendStatus(204);
});

/** PUT /info/actress/favorite/:name/:checked - 즐겨찾기 설정 */
router.put('/info/actress/favorite/:name/:checked', (req, res) => {
  actressService.setFavorite(req.params.name, req.params.checked === 'true');
  res.sendStatus(204);
});

/** DELETE /info/actress - 삭제 */
router.delete('/info/actress', (req, res) => {
  const actress: Actress = req.body;
  actressService.deleteActress(actress);
  res.sendStatus(204);
});

export default router;
