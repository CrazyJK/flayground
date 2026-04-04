import { Router } from 'express';
import { config } from '../config';

const router = Router();

/**
 * GET /config - 서버 설정 정보를 Map 형태로 반환한다.
 * Java GroundController.config() 대응 - GroundProperties의 getter/is 메서드를 reflection으로 읽어 반환
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
