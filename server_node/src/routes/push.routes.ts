import { Router } from 'express';
import { getVapidPublicKey } from '../services/web-push.service';
import { PushSubscriptionDTO, pushSubscriptionRepo } from '../sources/push-subscription-repo';

const router = Router();

/**
 * 클라이언트 IP 주소를 가져온다. 프록시 환경 고려.
 */
function getClientIp(req: any): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const first = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0].trim();
    return first;
  }
  return req.headers['proxy-client-ip'] || req.headers['wl-proxy-client-ip'] || req.ip || '0.0.0.0';
}

/**
 * 세션 또는 IP 기반 사용자 ID를 생성한다.
 */
function getUserId(req: any): string {
  const ip = getClientIp(req);
  return 'user_' + ip.replace(/[.:]/g, '_');
}

/**
 * @openapi
 * /push/vapid-public-key:
 *   get:
 *     tags: [Push]
 *     summary: VAPID 공개키 반환
 *     responses:
 *       200:
 *         description: 성공
 *         content:
 *           text/plain: {}
 */
router.get('/push/vapid-public-key', (_req, res) => {
  res.send(getVapidPublicKey());
});

/**
 * @openapi
 * /push/subscriptions:
 *   post:
 *     tags: [Push]
 *     summary: Push 구독 등록
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200:
 *         description: 성공
 */
router.post('/push/subscriptions', (req, res) => {
  const userId = getUserId(req);
  const dto: PushSubscriptionDTO = req.body;
  pushSubscriptionRepo.subscribe(userId, dto);
  res.status(200).end();
});

/**
 * @openapi
 * /push/subscriptions:
 *   delete:
 *     tags: [Push]
 *     summary: Push 구독 해제
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200:
 *         description: 성공
 */
router.delete('/push/subscriptions', (req, res) => {
  const dto: PushSubscriptionDTO = req.body;
  pushSubscriptionRepo.deleteByEndpoint(dto.endpoint);
  res.status(200).end();
});

/**
 * @openapi
 * /push/subscriptions:
 *   get:
 *     tags: [Push]
 *     summary: 사용자의 구독 정보 조회
 *     responses:
 *       200:
 *         description: 성공
 */
router.get('/push/subscriptions', (req, res) => {
  const userId = getUserId(req);
  const subs = pushSubscriptionRepo.findByUserId(userId);
  if (subs.length === 0) {
    res.json(null);
    return;
  }
  // 첫 번째 구독을 DTO 형식으로 반환
  const sub = subs[0];
  res.json({
    endpoint: sub.endpoint,
    keys: {
      p256dh: sub.p256dh,
      auth: sub.auth,
    },
  });
});

export default router;
