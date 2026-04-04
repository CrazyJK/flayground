import { Router } from 'express';
import { Flay, FullyFlay } from '../domain/flay';
import { FlayCondition } from '../domain/flay-condition';
import * as actressInfoService from '../services/actress-info.service';
import * as flayCollector from '../services/flay-collector';
import * as flayService from '../services/flay.service';
import { calcScore } from '../services/score-calculator';

const router = Router();

// ── 정적 라우트 (파라미터 라우트보다 먼저 등록해야 함) ──

/** GET /flays - 전체 Instance Flay 목록 (?fields=score, ?expand=actress, ?sort=score&order=asc|desc, ?search=, ?tag=&match=similar, ?{field}={value}, ?count=true) */
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

  const fieldParam = req.query.field as string | undefined;
  const valueParam = req.query.value as string | undefined;

  if (fieldParam && valueParam) {
    // ?field=actress&value=Ashida Noa 형식
    const result = flayService.findByField(fieldParam, valueParam);
    if (count === 'true') {
      return res.json(result.length);
    }
    return res.json(result);
  }

  const fieldEntry = Object.entries(req.query).find(([key]) => !reservedKeys.has(key) && key !== 'field' && key !== 'value');
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

/** POST /flays - opus 목록으로 Flay 조회 */
router.post('/flays', (req, res) => {
  const opusList: string[] = req.body;
  res.json(flayService.listByOpus(opusList));
});

/** POST /flays/search - FlayCondition으로 필터링 (?groupBy=flay|studio|opus|title|actress|release) */
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

/** GET /flays/candidates - 후보 파일 목록 (?keyword= 필터링) */
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

/** POST /flays/exists - opus 존재 여부 확인 */
router.post('/flays/exists', (req, res) => {
  res.json(flayService.exists(req.body));
});

/** POST /flays/open-folder - 폴더 열기 */
router.post('/flays/open-folder', (req, res) => {
  flayService.openFolderSvc(req.body);
  res.sendStatus(204);
});

/** DELETE /flays/files - 파일 삭제 */
router.delete('/flays/files', (req, res) => {
  flayService.deleteFileSvc(req.body);
  res.sendStatus(204);
});

// ── 파라미터 라우트 (정적 라우트 뒤에 등록) ──

/** GET /flays/:opus - Flay 조회 (?expand=actress) */
router.get('/flays/:opus', (req, res) => {
  const flay = flayService.getFlay(req.params.opus);
  if (req.query.expand === 'actress') {
    calcScore(flay);
    const actress = flay.actressList.map((name) => actressInfoService.get(name));
    const result: FullyFlay = { flay, actress };
    return res.json(result);
  }
  res.json(flay);
});

/** GET /flays/:opus/score - Flay score 조회 */
router.get('/flays/:opus/score', (req, res) => {
  res.json(flayService.getScore(req.params.opus));
});

/** PATCH /flays/:opus/candidates/accept - 후보 수락 */
router.patch('/flays/:opus/candidates/accept', (req, res) => {
  flayService.acceptCandidates(req.params.opus);
  res.sendStatus(204);
});

/** POST /flays/:opus/play - 영상 재생 (?seekTime=) */
router.post('/flays/:opus/play', (req, res) => {
  const seekTime = parseFloat(req.query.seekTime as string) || 0;
  flayService.playFlay(req.params.opus, seekTime);
  res.sendStatus(204);
});

/** POST /flays/:opus/edit - 자막 편집 */
router.post('/flays/:opus/edit', (req, res) => {
  flayService.editFlay(req.params.opus);
  res.sendStatus(204);
});

/** PUT /flays/:opus - 이름 변경 (body: Flay) */
router.put('/flays/:opus', (req, res) => {
  const newFlay: Flay = req.body;
  flayService.renameFlaySvc(req.params.opus, newFlay);
  res.sendStatus(204);
});

/** DELETE /flays/:opus/files - Flay에 속한 파일 삭제 */
router.delete('/flays/:opus/files', (req, res) => {
  flayService.deleteFileOnFlay(req.params.opus, req.body);
  res.sendStatus(204);
});

export default router;
