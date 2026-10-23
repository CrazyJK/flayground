import { Router } from 'express';
import { createSseConnection } from '../services/sse-emitters';

const router = Router();

/**
 * @openapi
 * /sse:
 *   get:
 *     tags: [SSE]
 *     summary: SSE 연결 생성
 *     responses:
 *       200:
 *         description: SSE 스트림
 *         content:
 *           text/event-stream: {}
 */
router.get('/sse', (req, res) => {
  createSseConnection(req, res);
});

export default router;
