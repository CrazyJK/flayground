import { Router } from 'express';
import { BatchOperation, BatchOption, checkBatch, getOption, reload, startBatch, toggleOption } from '../services/batch.service';

const router = Router();

/**
 * Batch 옵션/실행.
 * Java BatchController 대응
 */

/** GET /batch/option/:option - 옵션 조회 */
router.get('/batch/option/:option', (req, res) => {
  const option = req.params.option as BatchOption;
  res.json(getOption(option));
});

/** PUT /batch/option/:option - 옵션 토글 */
router.put('/batch/option/:option', (req, res) => {
  const option = req.params.option as BatchOption;
  res.json(toggleOption(option));
});

/** PUT /batch/start/:operation - 배치 실행 */
router.put('/batch/start/:operation', (req, res) => {
  const operation = req.params.operation as BatchOperation;
  startBatch(operation);
  res.status(204).end();
});

/** GET /batch/check/:operation - 배치 사전 검사 */
router.get('/batch/check/:operation', (req, res) => {
  const operation = req.params.operation as BatchOperation;
  res.json(checkBatch(operation));
});

/** PUT /batch/reload - 소스 리로드 */
router.put('/batch/reload', (_req, res) => {
  reload();
  res.status(204).end();
});

export default router;
