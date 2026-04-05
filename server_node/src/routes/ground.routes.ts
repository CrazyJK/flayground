import { Router } from 'express';
import { config } from '../config';

const router = Router();

/**
 * @openapi
 * /config:
 *   get:
 *     tags: [Config]
 *     summary: 서버 설정 정보
 *     responses:
 *       200:
 *         description: 성공
 */
router.get('/config', (_req, res) => {
  const flay = config.flay;

  const propertiesMap: Record<string, unknown> = {
    archivePath: flay.archivePath,
    storagePath: flay.storagePath,
    stagePaths: flay.stagePaths,
    coverPath: flay.coverPath,
    queuePath: flay.queuePath,
    candidatePath: flay.candidatePath,
    subtitlesPath: flay.subtitlesPath,
    infoPath: flay.infoPath,
    todayisPaths: flay.todayisPaths,
    imagePaths: flay.imagePaths,
    backupPath: flay.backupPath,
    attachPath: flay.attachPath,
    diaryPath: flay.diaryPath,
    playerApp: flay.playerApp,
    editorApp: flay.editorApp,
    paintApp: flay.paintApp,
    recyclebin: flay.recyclebin,
    recyclebinUse: flay.recyclebinUse,
    deleteLowerScore: flay.deleteLowerScore,
    storageLimit: flay.storageLimit,
    score: flay.score,
    backup: flay.backup,
    automaticallyCertificatedIp: flay.automaticallyCertificatedIp,
    useTorProxy: flay.useTorProxy,
    jsoupTimeout: flay.jsoupTimeout,
  };

  res.json(propertiesMap);
});

export default router;
