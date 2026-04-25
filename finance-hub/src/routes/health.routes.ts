import { Router } from 'express';

const router = Router();

/**
 * GET /api/health
 * 서버 상태 확인 엔드포인트
 */
router.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'finance-hub',
    timestamp: new Date().toISOString(),
  });
});

export default router;
