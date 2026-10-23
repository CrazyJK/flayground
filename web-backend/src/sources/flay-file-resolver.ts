import path from 'path';

/** 파일명 파싱 결과 */
export interface FlayFileResult {
  valid: boolean;
  studio: string;
  opus: string;
  title: string;
  actress: string;
  release: string;
  filePath: string;
}

/** 릴리스 날짜 유효성 검증 정규식 (Ground.Format.Date.RELEASE_DATE_PATTERN 대응) */
const RELEASE_DATE_PATTERN = /^((2000|2400|2800|(19|2[0-9](0[48]|[2468][048]|[13579][26])))\.02\.29)$|^(((19|2[0-9])[0-9]{2})\.02\.(0[1-9]|1[0-9]|2[0-8]))$|^(((19|2[0-9])[0-9]{2})\.(0[13578]|10|12)\.(0[1-9]|[12][0-9]|3[01]))$|^(((19|2[0-9])[0-9]{2})\.(0[469]|11)\.(0[1-9]|[12][0-9]|30))$/;

/**
 * 파일명을 `[studio][opus][title][actress][release].ext` 패턴으로 파싱한다.
 * Java FlayFileResolver.resolve() 대응
 * @param filePath 파일 절대 경로
 */
export function resolveFlayFile(filePath: string): FlayFileResult {
  const fileName = path.basename(filePath);
  const baseName = fileName.replace(/\.[^.]+$/, ''); // 확장자 제거
  const parts = baseName.split(']');

  if (parts.length < 5) {
    return { valid: false, studio: '', opus: '', title: '', actress: '', release: '', filePath };
  }

  const studio = parts[0].replace('[', '').trim();
  const opus = parts[1].replace('[', '').trim();
  const title = parts[2].replace('[', '').trim();
  const actress = parts[3].replace('[', '').trim();
  const release = parts[4].replace('[', '').replace(/-/g, '.').replace(/,/g, '.').trim();

  if (!studio) console.warn(`[FlayFileResolver] studio 패턴 오류: ${fileName}`);
  if (!opus) console.warn(`[FlayFileResolver] opus 패턴 오류: ${fileName}`);
  if (!title) console.warn(`[FlayFileResolver] title 패턴 오류: ${fileName}`);
  if (actress.includes('.') || actress.includes(',,')) console.info(`[FlayFileResolver] actress 패턴 의심: ${fileName}`);
  if (!RELEASE_DATE_PATTERN.test(release)) console.warn(`[FlayFileResolver] release 패턴 오류: ${fileName}`);

  // 파일명 정규화 (rename) - Java에서는 자동 rename 하지만, Node에서도 동일하게 처리
  const ext = path.extname(fileName).substring(1).toLowerCase();
  const extra = parts.length > 5 ? parts[5].trim() : '';
  const normalizedFilename = `[${studio}][${opus}][${title}][${actress}][${release}]${extra}.${ext}`;

  if (fileName !== normalizedFilename) {
    const fs = require('fs');
    const destPath = path.join(path.dirname(filePath), normalizedFilename);
    try {
      fs.renameSync(filePath, destPath);
      console.info(`[FlayFileResolver] rename: ${fileName} => ${normalizedFilename}`);
      return { valid: true, studio, opus, title, actress, release, filePath: destPath };
    } catch (err: any) {
      console.error(`[FlayFileResolver] rename 실패: ${fileName} => ${normalizedFilename}`, err.message);
    }
  }

  return { valid: true, studio, opus, title, actress, release, filePath };
}
