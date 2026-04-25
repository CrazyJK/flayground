import { NextFunction, Request, Response, Router } from 'express';
import { createMiraeConnectedId } from '../codef/connector.js';
import { getBalance } from '../services/balance.service.js';
import { getTransactions } from '../services/transaction.service.js';

const router = Router();

/**
 * GET /api/accounts/balance
 * 미래에셋증권 주식잔고를 조회한다.
 */
router.get('/balance', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await getBalance();
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/accounts/transactions
 * 미래에셋증권 주식계좌 거래내역을 조회한다.
 *
 * Query params:
 *   - startDate: 조회 시작일 (YYYYMMDD, 필수)
 *   - endDate: 조회 종료일 (YYYYMMDD, 필수)
 *   - orderBy: "0" 최신순 (기본), "1" 과거순
 */
router.get('/transactions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, orderBy } = req.query as Record<string, string>;

    if (!startDate || !endDate) {
      res.status(400).json({ message: 'startDate, endDate 쿼리 파라미터가 필요합니다.' });
      return;
    }

    if (!/^\d{8}$/.test(startDate) || !/^\d{8}$/.test(endDate)) {
      res.status(400).json({ message: 'startDate, endDate는 YYYYMMDD 형식이어야 합니다.' });
      return;
    }

    const result = await getTransactions({ startDate, endDate, orderBy });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/connected-id
 * 미래에셋증권 ConnectedID를 신규 생성한다.
 * 초기 1회 실행 후 발급된 connectedId를 .env에 저장하여 사용한다.
 *
 * Body: { userId: string, userPassword: string }
 */
router.post('/auth/connected-id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, userPassword } = req.body as { userId?: string; userPassword?: string };

    if (!userId || !userPassword) {
      res.status(400).json({ message: 'userId, userPassword 필드가 필요합니다.' });
      return;
    }

    const connectedId = await createMiraeConnectedId(userId, userPassword);
    res.json({
      connectedId,
      message: '발급된 connectedId를 .env 파일의 CODEF_CONNECTED_ID에 저장하세요.',
    });
  } catch (err) {
    next(err);
  }
});

export default router;
