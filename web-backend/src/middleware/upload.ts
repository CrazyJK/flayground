import multer from 'multer';
import os from 'os';
import path from 'path';
import { config } from '../config';

/**
 * Multer 미들웨어 설정.
 * 이미지 업로드, 첨부파일 업로드 등에 사용한다.
 */

/** 이미지 업로드용 multer (imagePaths[0]/_upload에 저장) */
const imageUploadDir = path.join(config.flay.imagePaths[0], '_upload');

const imageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, imageUploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '.' + file.originalname);
  },
});

export const imageUpload = multer({ storage: imageStorage });

/** 첨부파일 업로드용 multer (OS 임시 디렉토리에 저장 후 복사) */
const attachStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, os.tmpdir()),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

export const attachUpload = multer({ storage: attachStorage });
