import crypto from 'crypto';
import { Request, Response, Router } from 'express';
import fs from 'fs';
import path from 'path';
import { config } from '../config';

/** Todayis 도메인 */
interface Todayis {
  uuid: string;
  fileName: string;
  filePath: string;
  fileLength: number;
}

const router = Router();

/**
 * 지정된 todayis 디렉토리에서 영상 파일들을 검색한다.
 */
function listTodayisFiles(): Todayis[] {
  const VIDEO_EXTS = new Set(['avi', 'mpg', 'mkv', 'wmv', 'mp4', 'mov', 'rmvb', 'm2ts']);
  const result: Todayis[] = [];

  for (const dir of config.flay.todayisPaths) {
    if (!fs.existsSync(dir)) continue;
    const files = listFilesRecursive(dir);
    for (const filePath of files) {
      const ext = path.extname(filePath).substring(1).toLowerCase();
      if (VIDEO_EXTS.has(ext)) {
        const stat = fs.statSync(filePath);
        result.push({
          uuid: crypto.randomUUID(),
          fileName: path.basename(filePath),
          filePath,
          fileLength: stat.size,
        });
      }
    }
  }

  return result;
}

/**
 * 디렉토리를 재귀 순회한다.
 */
function listFilesRecursive(dir: string): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...listFilesRecursive(fullPath));
    } else if (entry.isFile()) {
      results.push(fullPath);
    }
  }
  return results;
}

/** uuid -> filePath 매핑 (스트리밍용) */
const todayisMap = new Map<string, Todayis>();

/** GET /today-picks - 목록 조회 */
router.get('/today-picks', (_req, res) => {
  const list = listTodayisFiles();
  todayisMap.clear();
  for (const t of list) {
    todayisMap.set(t.uuid, t);
  }
  res.json(list);
});

/** POST /today-picks/play - 영상 재생 */
router.post('/today-picks/play', (req, res) => {
  const todayis: Todayis = req.body;
  if (!todayis.filePath || !fs.existsSync(todayis.filePath)) {
    res.status(404).json({ message: '파일을 찾을 수 없습니다' });
    return;
  }

  const { spawn } = require('child_process');
  const child = spawn(config.flay.playerApp, [todayis.filePath], { detached: true, stdio: 'ignore' });
  child.unref();

  res.status(204).end();
});

/** DELETE /today-picks - 영상 삭제 */
router.delete('/today-picks', (req, res) => {
  const todayis: Todayis = req.body;
  if (!todayis.filePath || !fs.existsSync(todayis.filePath)) {
    res.status(404).json({ message: '파일을 찾을 수 없습니다' });
    return;
  }

  try {
    fs.unlinkSync(todayis.filePath);
    console.log(`[Todayis] 삭제: ${todayis.filePath}`);
    res.status(204).end();
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /todayis/stream/:uuid - 영상 스트리밍
 * Java TodayisController.stream() 대응
 */
router.get('/today-picks/stream/:uuid', (req: Request, res: Response) => {
  const todayis = todayisMap.get(req.params.uuid as string);
  if (!todayis || !fs.existsSync(todayis.filePath)) {
    res.status(404).json({ message: '파일을 찾을 수 없습니다' });
    return;
  }

  const stat = fs.statSync(todayis.filePath);
  const fileSize = stat.size;
  const ext = path.extname(todayis.filePath).substring(1).toLowerCase();
  const range = req.headers.range;

  const contentType = ext === 'mp4' ? 'video/mp4' : ext === 'mkv' ? 'video/x-matroska' : 'application/octet-stream';

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    const stream = fs.createReadStream(todayis.filePath, { start, end });
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': contentType,
    });
    stream.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': contentType,
    });
    fs.createReadStream(todayis.filePath).pipe(res);
  }
});

export default router;
