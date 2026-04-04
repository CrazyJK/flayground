import { Flay } from '../domain/flay';
import { FlayCondition } from '../domain/flay-condition';
import { actressInfoSource } from '../sources/info-sources';
import { calcScore } from './score-calculator';

/**
 * FlayCondition에 따라 필터링 및 정렬하여 Flay 목록을 반환한다.
 * Java FlayCollector 대응
 */
export function toFlayList(list: Flay[], condition: FlayCondition): Flay[] {
  return filterAndSort(list, condition);
}

/** 필터링 후 studio 목록 */
export function toStudioList(list: Flay[], condition: FlayCondition): string[] {
  return [...new Set(filterAndSort(list, condition).map((f) => f.studio))];
}

/** 필터링 후 opus 목록 */
export function toOpusList(list: Flay[], condition: FlayCondition): string[] {
  return filterAndSort(list, condition).map((f) => f.opus);
}

/** 필터링 후 title 목록 */
export function toTitleList(list: Flay[], condition: FlayCondition): string[] {
  return filterAndSort(list, condition).map((f) => f.title);
}

/** 필터링 후 actress 목록 (중복 제거) */
export function toActressList(list: Flay[], condition: FlayCondition): string[] {
  const names: string[] = [];
  filterAndSort(list, condition).forEach((flay) => names.push(...flay.actressList));
  return [...new Set(names)];
}

/** 필터링 후 release 목록 (중복 제거) */
export function toReleaseList(list: Flay[], condition: FlayCondition): string[] {
  return [...new Set(filterAndSort(list, condition).map((f) => f.release))];
}

/**
 * 필터링 + 정렬
 */
function filterAndSort(list: Flay[], condition: FlayCondition): Flay[] {
  const filtered = list.filter((flay) => filter(flay, condition));
  filtered.sort((f1, f2) => {
    return condition.reverse ? sort(f2, f1, condition) : sort(f1, f2, condition);
  });
  return filtered;
}

/**
 * FlayCondition에 따라 Flay를 필터링한다.
 */
function filter(flay: Flay, c: FlayCondition): boolean {
  return likeSearch(flay, c) && likeField(flay.studio, c.studio) && likeField(flay.opus, c.opus) && likeField(flay.title, c.title) && likeActress(flay, c.actress) && likeRelease(flay, c.release) && containsRank(flay, c.rank) && containsSubtitles(flay, c.withSubtitles) && containsFavorite(flay, c);
}

function likeField(value: string, query?: string): boolean {
  return !query || value.toLowerCase().includes(query.toLowerCase());
}

function likeActress(flay: Flay, actress?: string): boolean {
  return !actress || flay.actressList.join(',').toLowerCase().includes(actress.toLowerCase());
}

function likeRelease(flay: Flay, release?: string): boolean {
  return !release || flay.release.includes(release);
}

function likeSearch(flay: Flay, c: FlayCondition): boolean {
  if (!c.search) return true;
  return likeField(flay.studio, c.search) || likeField(flay.opus, c.search) || likeField(flay.title, c.search) || likeActress(flay, c.search) || likeRelease(flay, c.search) || containsTag(flay, c.search);
}

function containsTag(flay: Flay, tagName: string): boolean {
  return flay.video.tags.some((tag) => tag.name === tagName);
}

function containsRank(flay: Flay, ranks: number[]): boolean {
  return !ranks || ranks.length === 0 || ranks.includes(flay.video.rank);
}

function containsSubtitles(flay: Flay, withSubtitles: boolean): boolean {
  return !withSubtitles || flay.files.subtitles.length > 0;
}

function containsFavorite(flay: Flay, c: FlayCondition): boolean {
  if (c.withFavorite && !c.withNoFavorite) {
    return flay.actressList.some((name) => {
      try {
        return actressInfoSource.get(name).favorite;
      } catch {
        return false;
      }
    });
  } else if (!c.withFavorite && c.withNoFavorite) {
    return (
      flay.actressList.length === 0 ||
      flay.actressList.every((name) => {
        try {
          return !actressInfoSource.get(name).favorite;
        } catch {
          return true;
        }
      })
    );
  }
  return true;
}

/**
 * 정렬 비교 함수
 */
function sort(f1: Flay, f2: Flay, c: FlayCondition): number {
  let cmp = 0;

  switch (c.sort) {
    case 'STUDIO':
      cmp = f1.studio.localeCompare(f2.studio);
      break;
    case 'OPUS':
      break; // thenSortByOpus에서 처리
    case 'TITLE':
      cmp = f1.title.localeCompare(f2.title);
      break;
    case 'ACTRESS':
      cmp = f1.actressList.join(',').localeCompare(f2.actressList.join(','));
      break;
    case 'RELEASE':
      cmp = f1.release.localeCompare(f2.release);
      break;
    case 'PLAY':
      cmp = f1.video.play - f2.video.play;
      break;
    case 'RANK':
      cmp = f1.video.rank - f2.video.rank;
      break;
    case 'LASTPLAY':
      cmp = f1.video.lastPlay - f2.video.lastPlay;
      break;
    case 'LASTSHOT':
      cmp = dateCompare(getLastLike(f1), getLastLike(f2));
      break;
    case 'LASTACCESS':
      cmp = f1.video.lastAccess - f2.video.lastAccess;
      break;
    case 'LASTMODIFIED':
      cmp = f1.lastModified - f2.lastModified;
      break;
    case 'SCORE':
      calcScore(f1);
      calcScore(f2);
      cmp = f1.score - f2.score;
      break;
    case 'LENGTH':
      cmp = f1.length - f2.length;
      break;
    case 'SHOT':
      cmp = getLikeCount(f1) - getLikeCount(f2);
      break;
  }

  // thenSortByOpus
  return cmp !== 0 ? cmp : f1.opus.localeCompare(f2.opus);
}

function getLikeCount(flay: Flay): number {
  return flay.video.likes ? flay.video.likes.length : 0;
}

function getLastLike(flay: Flay): string | null {
  if (!flay.video.likes || flay.video.likes.length === 0) return null;
  return flay.video.likes[flay.video.likes.length - 1];
}

function dateCompare(d1: string | null, d2: string | null): number {
  if (d1 === null && d2 === null) return 0;
  if (d1 === null) return -1;
  if (d2 === null) return 1;
  return d1.localeCompare(d2);
}
