/** FlayCondition 정렬 기준 (Java Sort enum 대응) */
export type FlaySort = 'STUDIO' | 'OPUS' | 'TITLE' | 'ACTRESS' | 'RELEASE' | 'PLAY' | 'RANK' | 'LASTPLAY' | 'LASTSHOT' | 'LASTACCESS' | 'LASTMODIFIED' | 'SCORE' | 'LENGTH' | 'SHOT';

/** Flay 검색/필터 조건 (FlayCondition 대응) */
export interface FlayCondition {
  sort: FlaySort;
  reverse: boolean;
  studio?: string;
  opus?: string;
  title?: string;
  actress?: string;
  release?: string;
  rank: number[];
  search?: string;
  withSubtitles: boolean;
  withFavorite: boolean;
  withNoFavorite: boolean;
}

/** 기본 FlayCondition */
export function createDefaultCondition(): FlayCondition {
  return {
    sort: 'RELEASE',
    reverse: false,
    rank: [0, 1, 2, 3, 4, 5],
    withSubtitles: false,
    withFavorite: false,
    withNoFavorite: false,
  };
}
