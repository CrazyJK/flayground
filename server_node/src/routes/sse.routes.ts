import { Router } from 'express';
import { createSseConnection } from '../services/sse-emitters';

const router = Router();

/** GET /sse - SSE 연결 생성 */
router.get('/sse', (req, res) => {
  createSseConnection(req, res);
});

export default router;
