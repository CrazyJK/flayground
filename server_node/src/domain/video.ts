import { Tag } from './tag';

/** Video 도메인 (Info<String> 대응) */
export interface Video {
  opus: string;
  play: number;
  rank: number;
  /** 마지막 재생 시각 (epoch ms) */
  lastPlay: number;
  /** 마지막 접근 시각 (epoch ms) */
  lastAccess: number;
  lastModified: number;
  comment: string;
  title: string;
  desc: string;
  tags: Tag[];
  /** ISO date 문자열 배열 (Java List<Date> -> JSON ISO string[]) */
  likes: string[];
}

/**
 * 새 Video 생성
 * @param opus 비디오 식별자
 */
export function createVideo(opus: string): Video {
  return {
    opus,
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
  };
}
