import { Router } from 'express';
import { historyRepository } from '../sources/history-repository';

const router = Router();

/** GET /info/histories - 전체 History 목록 (?action=, ?days=, ?search=) */
router.get('/info/histories', (req, res) => {
  const { action, days, search } = req.query;

  if (search) {
    const query = search as string;
    const result = historyRepository
      .list()
      .filter((h) => h.date.includes(query) || h.opus === query || h.action === query || h.desc.includes(query))
      .sort((a, b) => b.date.localeCompare(a.date));
    return res.json(result);
  }

  if (action) {
    let result = historyRepository
      .list()
      .filter((h) => h.action === (action as string))
      .sort((a, b) => b.date.localeCompare(a.date));

    if (days) {
      const since = new Date();
      since.setDate(since.getDate() - parseInt(days as string, 10));
      const sinceStr = since.toISOString().substring(0, 10);
      result = result.filter((h) => h.date.localeCompare(sinceStr) >= 0);
    }
    return res.json(result);
  }

  res.json(historyRepository.list());
});

export default router;
