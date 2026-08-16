import { Router } from 'express';
import { BatchOperation, BatchOption, checkBatch, getOption, reload, startBatch, toggleOption } from '../services/batch.service';

const router = Router();

/**
 * Batch 옵션/실행.
 * Java BatchController 대응
 */

/**
 * @openapi
 * /batches/options/{option}:
 *   get:
 *     tags: [Batch]
 *     summary: 옵션 조회
 *     parameters:
 *       - in: path
 *         name: option
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 성공
 */
router.get('/batches/options/:option', (req, res) => {
  const option = req.params.option as BatchOption;
  res.json(getOption(option));
});

/**
 * @openapi
 * /batches/options/{option}:
 *   put:
 *     tags: [Batch]
 *     summary: 옵션 토글
 *     parameters:
 *       - in: path
 *         name: option
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 성공
 */
router.put('/batches/options/:option', (req, res) => {
  const option = req.params.option as BatchOption;
  res.json(toggleOption(option));
});

/**
 * @openapi
 * /batches/operations/{operation}:
 *   post:
 *     tags: [Batch]
 *     summary: 배치 실행
 *     parameters:
 *       - in: path
 *         name: operation
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: 성공
 */
router.post('/batches/operations/:operation', (req, res) => {
  const operation = req.params.operation as BatchOperation;
  startBatch(operation);
  res.status(204).end();
});

/**
 * @openapi
 * /batches/operations/{operation}/status:
 *   get:
 *     tags: [Batch]
 *     summary: 배치 사전 검사
 *     parameters:
 *       - in: path
 *         name: operation
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 성공
 */
router.get('/batches/operations/:operation/status', (req, res) => {
  const operation = req.params.operation as BatchOperation;
  res.json(checkBatch(operation));
});

/**
 * @openapi
 * /batches/reload:
 *   post:
 *     tags: [Batch]
 *     summary: 소스 리로드
 *     responses:
 *       204:
 *         description: 성공
 */
router.post('/batches/reload', (_req, res) => {
  reload();
  res.status(204).end();
});

export default router;
