import { Router } from 'express';
import { findCandidates } from '../services/flay.service';

const router = Router();

/**
 * GET /candidates - 후보 파일이 있는 Flay 목록
 * Java CandidatesController.list() 대응
 */
router.get('/candidates', (_req, res) => {
  res.json(findCandidates());
});

/**
 * GET /candidates/:keyword - 키워드로 후보 파일 필터링
 * Java CandidatesController.find() 대응
 */
router.get('/candidates/:keyword', (req, res) => {
  const keyword = req.params.keyword.toLowerCase();
  const candidates = findCandidates().filter((flay) => {
    const fullname = `${flay.studio} ${flay.opus} ${flay.title} ${flay.actressList.join(' ')}`.toLowerCase();
    return fullname.includes(keyword);
  });
  res.json(candidates);
});

export default router;
