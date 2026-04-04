import { Video } from './video';

/** Flay 파일 맵 (프론트엔드 FlayFiles 대응) */
export interface FlayFiles {
  movie: string[];
  subtitles: string[];
  cover: string[];
  candidate: string[];
}

/** Flay 도메인 */
export interface Flay {
  studio: string;
  opus: string;
  title: string;
  actressList: string[];
  release: string;

  score: number;
  actressPoint: number;
  studioPoint: number;

  archive: boolean;

  video: Video;

  /** 파일 경로 맵 (Java Map<String, List<File>> → 경로 문자열 배열) */
  files: FlayFiles;

  /** 전체 파일 크기 합계 (bytes) */
  length: number;
  /** 가장 최근 수정 시각 (epoch ms) */
  lastModified: number;
}

/** Flay + Actress 정보 (FullyFlay 대응) */
export interface FullyFlay {
  flay: Flay;
  actress: import('./actress').Actress[];
}

/**
 * 빈 Flay 객체 생성
 */
export function createFlay(): Flay {
  return {
    studio: '',
    opus: '',
    title: '',
    actressList: [],
    release: '',
    score: 0,
    actressPoint: 0,
    studioPoint: 0,
    archive: false,
    video: {
      opus: '',
      play: 0,
      rank: 0,
      lastPlay: -1,
      lastAccess: -1,
      lastModified: -1,
      comment: '',
      title: '',
      desc: '',
      tags: [],
      likes: [],
    },
    files: { movie: [], subtitles: [], cover: [], candidate: [] },
    length: 0,
    lastModified: -1,
  };
}

/** Flay 파일맵 키 상수 */
export const FLAY_FILE_KEYS = {
  MOVIE: 'movie' as const,
  SUBTITLES: 'subtitles' as const,
  COVER: 'cover' as const,
  CANDIDATE: 'candidate' as const,
};
