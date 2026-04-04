import { Router } from 'express';
import { BatchOperation, BatchOption, checkBatch, getOption, reload, startBatch, toggleOption } from '../services/batch.service';

const router = Router();

/**
 * Batch 옵션/실행.
 * Java BatchController 대응
 */

/** GET /batches/options/:option - 옵션 조회 */
router.get('/batches/options/:option', (req, res) => {
  const option = req.params.option as BatchOption;
  res.json(getOption(option));
});

/** PUT /batches/options/:option - 옵션 토글 */
router.put('/batches/options/:option', (req, res) => {
  const option = req.params.option as BatchOption;
  res.json(toggleOption(option));
});

/** POST /batches/operations/:operation - 배치 실행 */
router.post('/batches/operations/:operation', (req, res) => {
  const operation = req.params.operation as BatchOperation;
  startBatch(operation);
  res.status(204).end();
});

/** GET /batches/operations/:operation/status - 배치 사전 검사 */
router.get('/batches/operations/:operation/status', (req, res) => {
  const operation = req.params.operation as BatchOperation;
  res.json(checkBatch(operation));
});

/** POST /batches/reload - 소스 리로드 */
router.post('/batches/reload', (_req, res) => {
  reload();
  res.status(204).end();
});

export default router;
