import { Router } from 'express';
import { Flay, FullyFlay } from '../domain/flay';
import { FlayCondition } from '../domain/flay-condition';
import * as actressInfoService from '../services/actress-info.service';
import * as flayCollector from '../services/flay-collector';
import * as flayService from '../services/flay.service';
import { calcScore } from '../services/score-calculator';

const router = Router();

// ── 정적 라우트 (파라미터 라우트보다 먼저 등록해야 함) ──

/** GET /flay - 전체 Instance Flay 목록 */
router.get('/flay', (_req, res) => {
  res.json(flayService.list());
});

/** POST /flay - opus 목록으로 Flay 조회 */
router.post('/flay', (req, res) => {
  const opusList: string[] = req.body;
  res.json(flayService.listByOpus(opusList));
});

/** GET /flay/list/score - 전체 score 맵 */
router.get('/flay/list/score', (_req, res) => {
  res.json(flayService.getScoreMap());
});

/** GET /flay/list/fully - 전체 Flay + Actress 목록 */
router.get('/flay/list/fully', (_req, res) => {
  const dataList: FullyFlay[] = [];
  for (const flay of flayService.list()) {
    calcScore(flay);
    const actress = flay.actressList.map((name) => actressInfoService.get(name));
    dataList.push({ flay, actress });
  }
  res.json(dataList);
});

/** GET /flay/list/lowScore - 저점수 Flay 목록 */
router.get('/flay/list/lowScore', (_req, res) => {
  res.json(flayService.getListOfLowScore());
});

/** GET /flay/list/orderbyScoreDesc - score 내림차순 목록 */
router.get('/flay/list/orderbyScoreDesc', (_req, res) => {
  res.json(flayService.getListOrderbyScoreDesc());
});

/** POST /flay/list/flay - FlayCondition으로 필터링된 Flay 목록 */
router.post('/flay/list/flay', (req, res) => {
  const condition: FlayCondition = req.body;
  res.json(flayCollector.toFlayList(flayService.list(), condition));
});

/** POST /flay/list/studio - 필터링된 studio 목록 */
router.post('/flay/list/studio', (req, res) => {
  const condition: FlayCondition = req.body;
  res.json(flayCollector.toStudioList(flayService.list(), condition));
});

/** POST /flay/list/opus - 필터링된 opus 목록 */
router.post('/flay/list/opus', (req, res) => {
  const condition: FlayCondition = req.body;
  res.json(flayCollector.toOpusList(flayService.list(), condition));
});

/** POST /flay/list/title - 필터링된 title 목록 */
router.post('/flay/list/title', (req, res) => {
  const condition: FlayCondition = req.body;
  res.json(flayCollector.toTitleList(flayService.list(), condition));
});

/** POST /flay/list/actress - 필터링된 actress 목록 */
router.post('/flay/list/actress', (req, res) => {
  const condition: FlayCondition = req.body;
  res.json(flayCollector.toActressList(flayService.list(), condition));
});

/** POST /flay/list/release - 필터링된 release 목록 */
router.post('/flay/list/release', (req, res) => {
  const condition: FlayCondition = req.body;
  res.json(flayCollector.toReleaseList(flayService.list(), condition));
});

/** GET /flay/find/tag/:id/like - 태그 유사 검색 (find/:field/:value 보다 먼저) */
router.get('/flay/find/tag/:id/like', (req, res) => {
  res.json(flayService.findByTagLike(parseInt(req.params.id, 10)));
});

/** GET /flay/find/:field/:value - 필드별 검색 */
router.get('/flay/find/:field/:value', (req, res) => {
  res.json(flayService.findByField(req.params.field, req.params.value));
});

/** GET /flay/find/:query - query 검색 */
router.get('/flay/find/:query', (req, res) => {
  res.json(flayService.findByQuery(req.params.query));
});

/** GET /flay/count/:field/:value - 필드별 카운트 */
router.get('/flay/count/:field/:value', (req, res) => {
  res.json(flayService.findByField(req.params.field, req.params.value).length);
});

/** GET /flay/candidates - 후보 파일 목록 */
router.get('/flay/candidates', (_req, res) => {
  res.json(flayService.findCandidates());
});

/** POST /flay/exists - opus 존재 여부 확인 */
router.post('/flay/exists', (req, res) => {
  res.json(flayService.exists(req.body));
});

/** PUT /flay/open/folder - 폴더 열기 */
router.put('/flay/open/folder', (req, res) => {
  flayService.openFolderSvc(req.body);
  res.sendStatus(204);
});

/** DELETE /flay/file - 파일 삭제 */
router.delete('/flay/file', (req, res) => {
  flayService.deleteFileSvc(req.body);
  res.sendStatus(204);
});

// ── 파라미터 라우트 (정적 라우트 뒤에 등록) ──

/** GET /flay/:opus - Flay 조회 */
router.get('/flay/:opus', (req, res) => {
  res.json(flayService.getFlay(req.params.opus));
});

/** GET /flay/:opus/score - Flay score 조회 */
router.get('/flay/:opus/score', (req, res) => {
  res.json(flayService.getScore(req.params.opus));
});

/** GET /flay/:opus/fully - Flay + Actress 정보 */
router.get('/flay/:opus/fully', (req, res) => {
  const flay = flayService.getFlay(req.params.opus);
  calcScore(flay);
  const actress = flay.actressList.map((name) => actressInfoService.get(name));
  const result: FullyFlay = { flay, actress };
  res.json(result);
});

/** PATCH /flay/candidates/:opus - 후보 수락 */
router.patch('/flay/candidates/:opus', (req, res) => {
  flayService.acceptCandidates(req.params.opus);
  res.sendStatus(204);
});

/** PATCH /flay/play/:opus - 영상 재생 */
router.patch('/flay/play/:opus', (req, res) => {
  const seekTime = parseFloat(req.query.seekTime as string) || 0;
  flayService.playFlay(req.params.opus, seekTime);
  res.sendStatus(204);
});

/** PATCH /flay/edit/:opus - 자막 편집 */
router.patch('/flay/edit/:opus', (req, res) => {
  flayService.editFlay(req.params.opus);
  res.sendStatus(204);
});

/** PUT /flay/rename/:opus - 이름 변경 */
router.put('/flay/rename/:opus', (req, res) => {
  const newFlay: Flay = req.body;
  flayService.renameFlaySvc(req.params.opus, newFlay);
  res.sendStatus(204);
});

/** DELETE /flay/file/:opus - Flay에 속한 파일 삭제 */
router.delete('/flay/file/:opus', (req, res) => {
  flayService.deleteFileOnFlay(req.params.opus, req.body);
  res.sendStatus(204);
});

export default router;
