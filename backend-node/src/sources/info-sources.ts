import path from 'path';
import { config } from '../config';
import { Actress, createActress } from '../domain/actress';
import { Studio, createStudio } from '../domain/studio';
import { Tag, createTag } from '../domain/tag';
import { TagGroup, createTagGroup } from '../domain/tag-group';
import { Video, createVideo } from '../domain/video';
import { InfoSource } from './info-source';

/** 정보 파일 이름 상수 (Ground.InfoFilename 대응) */
const INFO_FILENAMES = {
  VIDEO: 'video.json',
  ACTRESS: 'actress.json',
  TAG: 'tag.json',
  STUDIO: 'studio.json',
  TAG_GROUP: 'tagGroup.json',
};

/** Video 정보 소스 */
export const videoInfoSource = new InfoSource<Video, string>(
  path.join(config.flay.infoPath, INFO_FILENAMES.VIDEO),
  (v) => v.opus,
  createVideo,
  (v) => {
    v.lastModified = Date.now();
  }
);

/** Actress 정보 소스 */
export const actressInfoSource = new InfoSource<Actress, string>(
  path.join(config.flay.infoPath, INFO_FILENAMES.ACTRESS),
  (a) => a.name,
  createActress,
  (a) => {
    a.lastModified = Date.now();
  }
);

/** Tag 정보 소스 */
export const tagInfoSource = new InfoSource<Tag, number>(
  path.join(config.flay.infoPath, INFO_FILENAMES.TAG),
  (t) => t.id,
  createTag,
  (t) => {
    t.lastModified = Date.now();
  }
);

/** Studio 정보 소스 */
export const studioInfoSource = new InfoSource<Studio, string>(
  path.join(config.flay.infoPath, INFO_FILENAMES.STUDIO),
  (s) => s.name,
  createStudio,
  (s) => {
    s.lastModified = Date.now();
  }
);

/** TagGroup 정보 소스 */
export const tagGroupInfoSource = new InfoSource<TagGroup, string>(
  path.join(config.flay.infoPath, INFO_FILENAMES.TAG_GROUP),
  (tg) => tg.id,
  createTagGroup,
  (tg) => {
    tg.lastModified = Date.now();
  }
);

/**
 * 모든 Info Source를 로드한다.
 * 서버 시작 시 호출되어야 한다.
 */
export function loadAllInfoSources(): void {
  console.log('[Info Sources] 로드 시작...');
  videoInfoSource.load((list) => {
    // 중복 opus 경고
    const counts = new Map<string, number>();
    for (const v of list) {
      counts.set(v.opus, (counts.get(v.opus) || 0) + 1);
    }
    for (const [key, count] of counts) {
      if (count > 1) console.warn(`[Video] 중복 opus: ${key} (${count}건)`);
    }
  });

  actressInfoSource.load((list) => {
    const counts = new Map<string, number>();
    for (const a of list) {
      counts.set(a.name, (counts.get(a.name) || 0) + 1);
    }
    for (const [key, count] of counts) {
      if (count > 1) console.warn(`[Actress] 중복 name: ${key} (${count}건)`);
    }
  });

  tagInfoSource.load((list) => {
    const counts = new Map<string, number>();
    for (const t of list) {
      counts.set(t.name, (counts.get(t.name) || 0) + 1);
    }
    for (const [key, count] of counts) {
      if (count > 1) console.warn(`[Tag] 중복 name: ${key} (${count}건)`);
    }
  });

  studioInfoSource.load((list) => {
    const counts = new Map<string, number>();
    for (const s of list) {
      counts.set(s.name, (counts.get(s.name) || 0) + 1);
    }
    for (const [key, count] of counts) {
      if (count > 1) console.warn(`[Studio] 중복 name: ${key} (${count}건)`);
    }
  });

  tagGroupInfoSource.load();

  console.log('[Info Sources] 로드 완료');
}
