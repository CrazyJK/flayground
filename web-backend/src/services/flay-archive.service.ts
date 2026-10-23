import { Flay } from '../domain/flay';
import { getArchiveFlay, getArchiveFlayList, getInstanceFlay } from '../sources/flay-source';
import { moveCoverDirectory } from './flay-file-handler';

/**
 * Archive Flay 서비스.
 * Java FlayArchiveServiceImpl 대응
 */

/** opus로 Archive Flay 조회. 없으면 Instance에서도 찾는다. */
export function get(opus: string): Flay {
  try {
    return getInstanceFlay(opus);
  } catch {
    return getArchiveFlay(opus);
  }
}

/** 전체 Archive Flay 목록 */
export function list(): Flay[] {
  return getArchiveFlayList();
}

/** Archive Flay opus 목록 */
export function listOpus(): string[] {
  return getArchiveFlayList().map((f) => f.opus);
}

/** query 문자열로 검색 */
export function find(query: string): Flay[] {
  const q = query.toLowerCase();
  return getArchiveFlayList()
    .filter((f) => toQueryString(f).toLowerCase().includes(q))
    .sort(defaultComparator);
}

/** 필드별 검색 */
export function findByField(field: string, value: string): Flay[] {
  const list = getArchiveFlayList();

  switch (field.toLowerCase()) {
    case 'studio':
      return list.filter((f) => f.studio === value).sort(defaultComparator);
    case 'title':
      return list.filter((f) => f.title.includes(value)).sort(defaultComparator);
    case 'actress':
      return list.filter((f) => f.actressList.some((a) => a === value)).sort(defaultComparator);
    case 'release':
      return list.filter((f) => f.release.startsWith(value)).sort(defaultComparator);
    case 'rank': {
      const rank = parseInt(value, 10);
      return list.filter((f) => f.video.rank === rank).sort(defaultComparator);
    }
    case 'play': {
      const play = parseInt(value, 10);
      return list.filter((f) => f.video.play === play).sort(defaultComparator);
    }
    case 'comment':
      return list.filter((f) => f.video.comment.includes(value)).sort(defaultComparator);
    case 'tag': {
      const tagId = parseInt(value, 10);
      return list.filter((f) => f.video.tags.some((t) => t.id === tagId)).sort(defaultComparator);
    }
    default:
      throw new Error(`알 수 없는 검색 필드: ${field}`);
  }
}

/**
 * Archive Flay를 Instance로 이동한다.
 * Java FlayArchiveServiceImpl.toInstance() 대응
 */
export function toInstance(opus: string): void {
  const flay = getArchiveFlay(opus);
  moveCoverDirectory(flay);
  // Archive 맵에서 제거
  const archiveList = getArchiveFlayList();
  const idx = archiveList.findIndex((f) => f.opus === opus);
  if (idx !== -1) {
    archiveList.splice(idx, 1);
  }
}

// ── 유틸 ─────────────────────────────────────────────

function toQueryString(flay: Flay): string {
  return `${flay.studio} ${flay.opus} ${flay.title} ${flay.actressList.join(' ')} ${flay.release} ${flay.video.comment || ''}`;
}

function defaultComparator(a: Flay, b: Flay): number {
  const relCmp = b.release.localeCompare(a.release);
  if (relCmp !== 0) return relCmp;
  const stCmp = b.studio.localeCompare(a.studio);
  if (stCmp !== 0) return stCmp;
  return b.opus.localeCompare(a.opus);
}
