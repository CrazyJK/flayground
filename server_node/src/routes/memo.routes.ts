import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { config } from '../config';

const MEMO_FILE = 'memo.html';

/** Memo 도메인 */
interface Memo {
  html: string;
  lastModified: string;
}

const router = Router();

/**
 * 메모 파일 경로를 반환한다.
 */
function getMemoPath(): string {
  return path.join(config.flay.infoPath, MEMO_FILE);
}

/** GET /memos - 메모 읽기 */
router.get('/memos', (_req, res) => {
  const memoPath = getMemoPath();
  if (!fs.existsSync(memoPath)) {
    res.json({ html: '', lastModified: '' });
    return;
  }

  const html = fs.readFileSync(memoPath, 'utf-8');
  const stat = fs.statSync(memoPath);
  res.json({ html, lastModified: stat.mtime.toISOString() });
});

/** POST /memos - 메모 저장 */
router.post('/memos', (req, res) => {
  const { html } = req.body;
  const memoPath = getMemoPath();

  // 백업
  if (fs.existsSync(memoPath)) {
    const backupPath = memoPath + '.' + Date.now();
    fs.copyFileSync(memoPath, backupPath);
  }

  fs.writeFileSync(memoPath, html || '', 'utf-8');
  const stat = fs.statSync(memoPath);
  res.json({ html: html || '', lastModified: stat.mtime.toISOString() });
});

export default router;
