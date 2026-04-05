import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { config } from '../config';
import { attachUpload } from '../middleware/upload';

const router = Router();

/** Attach (첨부) 도메인 */
interface AttachFile {
  id: string;
  name: string;
  size: number;
  filePath: string;
}

interface Attach {
  id: string;
  name: string;
  type: string;
  files: AttachFile[];
}

/**
 * Attach 디렉토리 경로를 반환한다.
 */
function getAttachDir(): string {
  return config.flay.attachPath;
}

/**
 * attach.json 메타 파일을 로드한다.
 */
function loadAttachMeta(id: string): Attach | null {
  const metaPath = path.join(getAttachDir(), id, 'attach.json');
  if (!fs.existsSync(metaPath)) return null;
  return JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
}

/**
 * attach.json 메타 파일을 저장한다.
 */
function saveAttachMeta(attach: Attach): void {
  const dir = path.join(getAttachDir(), attach.id);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'attach.json'), JSON.stringify(attach, null, 2), 'utf-8');
}

/**
 * @openapi
 * /attachments/{id}:
 *   get:
 *     tags: [Attach]
 *     summary: 첨부 정보 조회
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 성공
 *       404:
 *         description: 찾을 수 없음
 */
router.get('/attachments/:id', (req, res) => {
  const attach = loadAttachMeta(req.params.id);
  if (!attach) {
    res.status(404).json({ message: `Attach not found: ${req.params.id}` });
    return;
  }
  res.json(attach);
});

/**
 * @openapi
 * /attachments/{id}/files/{attachFileId}:
 *   get:
 *     tags: [Attach]
 *     summary: 첨부 파일 정보 조회
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: attachFileId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 성공
 *       404:
 *         description: 찾을 수 없음
 */
router.get('/attachments/:id/files/:attachFileId', (req, res) => {
  const attach = loadAttachMeta(req.params.id);
  if (!attach) {
    res.status(404).json({ message: `Attach not found: ${req.params.id}` });
    return;
  }
  const file = attach.files.find((f) => f.id === req.params.attachFileId);
  if (!file) {
    res.status(404).json({ message: `AttachFile not found: ${req.params.attachFileId}` });
    return;
  }
  res.json(file);
});

/**
 * @openapi
 * /attachments/{id}/files/{attachFileId}/download:
 *   get:
 *     tags: [Attach]
 *     summary: 첨부 파일 다운로드
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: attachFileId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 파일 다운로드
 *       404:
 *         description: 찾을 수 없음
 */
router.get('/attachments/:id/files/:attachFileId/download', (req, res) => {
  const attach = loadAttachMeta(req.params.id);
  if (!attach) {
    res.status(404).json({ message: `Attach not found: ${req.params.id}` });
    return;
  }
  const file = attach.files.find((f) => f.id === req.params.attachFileId);
  if (!file || !fs.existsSync(file.filePath)) {
    res.status(404).json({ message: `AttachFile not found` });
    return;
  }
  res.download(file.filePath, file.name);
});

/**
 * @openapi
 * /attachments:
 *   post:
 *     tags: [Attach]
 *     summary: 새 첨부 생성
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               type: { type: string }
 *     responses:
 *       200:
 *         description: 성공
 */
router.post('/attachments', (req, res) => {
  const { name, type } = req.body;
  const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
  const attach: Attach = { id, name, type, files: [] };
  saveAttachMeta(attach);
  res.json(attach);
});

/**
 * @openapi
 * /attachments:
 *   put:
 *     tags: [Attach]
 *     summary: 첨부에 파일 추가
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               id: { type: string }
 *               file:
 *                 type: array
 *                 items: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: 성공
 */
router.put('/attachments', attachUpload.array('file'), (req, res) => {
  const { id } = req.body;
  const attach = loadAttachMeta(id);
  if (!attach) {
    res.status(404).json({ message: `Attach not found: ${id}` });
    return;
  }

  const files = req.files as Express.Multer.File[] | undefined;
  if (!files || files.length === 0) {
    res.status(400).json({ message: '파일이 없습니다' });
    return;
  }

  for (const file of files) {
    const attachFileId = Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
    const destPath = path.join(getAttachDir(), id, file.originalname);
    fs.copyFileSync(file.path, destPath);
    attach.files.push({
      id: attachFileId,
      name: file.originalname,
      size: file.size,
      filePath: destPath,
    });
  }

  saveAttachMeta(attach);
  res.json(attach);
});

/** DELETE /attachments - 첨부 파일 제거 */
router.delete('/attachments', (req, res) => {
  const { id, attachFileId } = req.body;
  const attach = loadAttachMeta(id);
  if (!attach) {
    res.status(404).json({ message: `Attach not found: ${id}` });
    return;
  }

  const fileIdx = attach.files.findIndex((f) => f.id === attachFileId);
  if (fileIdx === -1) {
    res.status(404).json({ message: `AttachFile not found: ${attachFileId}` });
    return;
  }

  const [removed] = attach.files.splice(fileIdx, 1);
  if (fs.existsSync(removed.filePath)) {
    fs.unlinkSync(removed.filePath);
  }

  saveAttachMeta(attach);
  res.json(attach);
});

export default router;
