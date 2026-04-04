import { Router } from 'express';
import { historyRepository } from '../sources/history-repository';

const router = Router();

/** GET /info/history - 전체 History 목록 */
router.get('/info/history', (_req, res) => {
  res.json(historyRepository.list());
});

/** GET /info/history/find/action/:action - 액션별 조회 */
router.get('/info/history/find/action/:action', (req, res) => {
  const action = req.params.action;
  const result = historyRepository
    .list()
    .filter((h) => h.action === action)
    .sort((a, b) => b.date.localeCompare(a.date));
  res.json(result);
});

/** GET /info/history/find/action/:action/:days - 최근 N일 액션별 조회 */
router.get('/info/history/find/action/:action/:days', (req, res) => {
  const action = req.params.action;
  const days = parseInt(req.params.days, 10);

  // 기준 날짜 계산
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().substring(0, 10); // yyyy-MM-dd

  const result = historyRepository
    .list()
    .filter((h) => h.action === action && h.date.localeCompare(sinceStr) >= 0)
    .sort((a, b) => b.date.localeCompare(a.date));
  res.json(result);
});

/** GET /info/history/find/:query - query 검색 */
router.get('/info/history/find/:query', (req, res) => {
  const query = req.params.query;
  const result = historyRepository
    .list()
    .filter((h) => h.date.includes(query) || h.opus === query || h.action === query || h.desc.includes(query))
    .sort((a, b) => b.date.localeCompare(a.date));
  res.json(result);
});

export default router;
