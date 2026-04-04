import { config } from '../config';
import { Flay } from '../domain/flay';
import { actressInfoSource } from '../sources/info-sources';

/**
 * Flay 점수를 계산한다.
 * Java ScoreCalculator.calcScore() 대응
 *
 * score = likes * likePoint + rank * rankPoint + subtitle * subtitlesPoint + favoriteActress * favoritePoint
 */
export function calcScore(flay: Flay): void {
  const { rankPoint, likePoint, subtitlesPoint, favoritePoint } = config.flay.score;

  flay.score = resolveLikes(flay) * likePoint + resolveRank(flay) * rankPoint + existingCountOfSubtitle(flay) * subtitlesPoint + countFavoriteActress(flay) * favoritePoint;
}

/** likes 개수 */
function resolveLikes(flay: Flay): number {
  return flay.video.likes ? flay.video.likes.length : 0;
}

/**
 * rank 값을 구한다. 0이면 태그에서 추출한다.
 * {1: 50, 2: 63, 3: 64, 4: 65, 5: 66}
 */
function resolveRank(flay: Flay): number {
  if (flay.video.rank !== 0) return flay.video.rank;

  const tagIds = flay.video.tags.map((t) => t.id);
  if (tagIds.includes(66)) return 5;
  if (tagIds.includes(65)) return 4;
  if (tagIds.includes(64)) return 3;
  if (tagIds.includes(63)) return 2;
  if (tagIds.includes(50)) return 1;
  return 0;
}

/** 자막 존재 여부 (있으면 1, 없으면 0) */
function existingCountOfSubtitle(flay: Flay): number {
  return flay.files.subtitles.length > 0 ? 1 : 0;
}

/** 즐겨찾기 배우 수 */
function countFavoriteActress(flay: Flay): number {
  return flay.actressList.reduce((sum, name) => {
    if (!name) return sum;
    try {
      const actress = actressInfoSource.get(name);
      return sum + (actress.favorite ? 1 : 0);
    } catch {
      return sum;
    }
  }, 0);
}

/**
 * likes, score, release, modified 순으로 정렬된 리스트를 반환한다.
 * rank > 0 이고 영상 파일이 있는 것만 포함한다.
 * Java ScoreCalculator.listOrderByScoreDesc() 대응
 */
export function listOrderByScoreDesc(flayList: Flay[]): Flay[] {
  const filtered = flayList.filter((flay) => flay.video.rank > 0 && flay.files.movie.length > 0);

  filtered.forEach((f) => calcScore(f));

  return filtered.sort((a, b) => {
    // likes 내림차순
    const likeDiff = getLikeCount(b) - getLikeCount(a);
    if (likeDiff !== 0) return likeDiff;

    // score 내림차순
    const scoreDiff = b.score - a.score;
    if (scoreDiff !== 0) return scoreDiff;

    // release 내림차순
    const releaseDiff = b.release.localeCompare(a.release);
    if (releaseDiff !== 0) return releaseDiff;

    // lastModified 내림차순
    return b.lastModified - a.lastModified;
  });
}

/** likes 개수 */
function getLikeCount(flay: Flay): number {
  return flay.video.likes ? flay.video.likes.length : 0;
}
