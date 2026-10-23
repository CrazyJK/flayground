import { config } from '../config';
import { Flay } from '../domain/flay';
import { createHistory } from '../domain/history';
import { getArchiveFlay, getInstanceFlay, getInstanceFlayList, isSubtitlesFile, isVideoFile } from '../sources/flay-source';
import { historyRepository } from '../sources/history-repository';
import { tagInfoSource, videoInfoSource } from '../sources/info-sources';
import * as actionHandler from './flay-action-handler';
import { collectCandidates, deleteFile, moveFileToDirectory, renameFlay, renameFlayWith } from './flay-file-handler';
import { calcScore, listOrderByScoreDesc } from './score-calculator';
import { sseSend } from './sse-emitters';

/**
 * Flay 서비스.
 * Java FlayServiceImpl 대응 - Instance Flay에 대한 CRUD 및 비즈니스 로직
 */

/** opus로 Flay 조회 */
export function get(opus: string): Flay {
  return getInstanceFlay(opus);
}

/** 전체 Instance Flay 목록 */
export function list(): Flay[] {
  return getInstanceFlayList();
}

/** opus 목록으로 Flay 조회. 찾을 수 없는 opus는 제외한다. */
export function listByOpus(opusList: string[]): Flay[] {
  if (!opusList || opusList.length === 0) return getInstanceFlayList();
  return opusList
    .map((opus) => {
      try {
        return getInstanceFlay(opus);
      } catch {
        return null;
      }
    })
    .filter((flay): flay is Flay => flay !== null);
}

/** score 내림차순 정렬 목록 */
export function getListOrderbyScoreDesc(): Flay[] {
  return listOrderByScoreDesc(getInstanceFlayList());
}

/**
 * 저장 용량 초과 시 low score 목록을 반환한다.
 * Java FlayServiceImpl.listOfLowScore() 대응
 */
export function getListOfLowScore(): Flay[] {
  const storageLimit = config.flay.storageLimit * 1024 * 1024 * 1024; // GB -> bytes
  const sorted = listOrderByScoreDesc(getInstanceFlayList());
  const lowScoreList: Flay[] = [];
  let lengthSum = 0;

  for (const flay of sorted) {
    lengthSum += flay.length;
    if (lengthSum > storageLimit) {
      lowScoreList.push(flay);
    }
  }
  return lowScoreList;
}

/**
 * query 문자열로 Flay를 검색한다.
 * Flay의 fullname (studio + opus + title + actress + release)으로 검색
 */
export function findByQuery(query: string): Flay[] {
  const q = query.toLowerCase();
  return getInstanceFlayList()
    .filter((f) => toQueryString(f).toLowerCase().includes(q))
    .sort(defaultComparator);
}

/**
 * 필드별 검색.
 * Java FlayServiceAdapter.findByField() 대응
 */
export function findByField(field: string, value: string): Flay[] {
  const list = getInstanceFlayList();

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
 * 태그와 유사한 Flay를 찾는다.
 * Java FlayServiceImpl.findByTagLike() 대응
 */
export function findByTagLike(tagId: number): Flay[] {
  const tag = tagInfoSource.get(tagId);
  const searchChars = `${tag.name},${tag.description || ''}`
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return getInstanceFlayList().filter((f) => {
    // 태그 포함 여부
    if (f.video.tags.some((t) => t.id === tagId)) return true;
    // fullname에 태그명/설명 포함 여부
    const fullname = toQueryString(f);
    return searchChars.some((c) => fullname.includes(c));
  });
}

/**
 * 후보 파일이 있는 Flay 목록을 반환한다.
 * Java FlayServiceImpl.findCandidates() 대응
 */
export function findCandidates(): Flay[] {
  return collectCandidates(getInstanceFlayList());
}

/**
 * 후보 파일을 수락한다.
 * Java FlayServiceImpl.acceptCandidates() 대응
 */
export function acceptCandidates(opus: string): void {
  const flay = getInstanceFlay(opus);
  const candiList = [...flay.files.candidate];
  const stagePath = config.flay.stagePaths[0];

  for (const file of candiList) {
    if (isVideoFile(file)) {
      moveFileToDirectory(file, stagePath);
      flay.files.movie.push(require('path').join(stagePath, require('path').basename(file)));
    } else if (isSubtitlesFile(file)) {
      // 비디오 파일이 있으면 그 위치로
      const baseFolder = flay.files.movie.length > 0 ? require('path').dirname(flay.files.movie[0]) : stagePath;
      moveFileToDirectory(file, baseFolder);
      flay.files.subtitles.push(require('path').join(baseFolder, require('path').basename(file)));
    } else {
      throw new Error('알 수 없는 파일 확장자: ' + file);
    }
  }
  flay.files.candidate = [];

  // Rank 조정
  if (flay.video.rank < 0) {
    flay.video.rank = 0;
  }

  // 파일명 정리
  renameFlay(flay);
}

/**
 * 영상을 재생한다.
 * Java FlayServiceImpl.play() 대응
 */
export function playFlay(opus: string, seekTime: number): void {
  const flay = getInstanceFlay(opus);
  actionHandler.play(flay, seekTime);

  flay.video.play++; // 재생 횟수 증가
  flay.video.lastPlay = Date.now(); // lastPlayed 업데이트
  videoInfoSource.update(flay.video);
  historyRepository.save(createHistory(opus, 'PLAY', toFullname(flay)));
}

/**
 * 자막 편집기를 연다.
 */
export function editFlay(opus: string): void {
  actionHandler.edit(getInstanceFlay(opus));
}

/**
 * Flay 이름을 변경한다.
 * Java FlayServiceImpl.rename() 대응
 */
export function renameFlaySvc(opus: string, newFlay: Flay): void {
  if (opus !== newFlay.opus) {
    throw new Error('opus 변경은 허용되지 않습니다');
  }

  let flay: Flay;
  try {
    flay = getInstanceFlay(opus);
  } catch {
    flay = getArchiveFlay(opus);
  }

  renameFlayWith(flay, newFlay.studio, newFlay.title, newFlay.actressList, newFlay.release);
  sseSend(flay);
}

/**
 * 폴더를 탐색기로 연다.
 */
export function openFolderSvc(folder: string): void {
  actionHandler.openFolder(folder);
}

/**
 * 파일을 삭제한다.
 */
export function deleteFileSvc(file: string): void {
  deleteFile(file);
  console.warn(`[FlayService] 파일 삭제: ${file}`);
}

/**
 * Flay에 속한 파일을 삭제한다.
 * Java FlayServiceImpl.deleteFileOnFlay() 대응
 */
export function deleteFileOnFlay(opus: string, file: string): void {
  const flay = getInstanceFlay(opus);

  // Flay의 파일 목록에서 제거
  for (const fileList of Object.values(flay.files)) {
    const idx = fileList.indexOf(file);
    if (idx !== -1) {
      fileList.splice(idx, 1);
    }
  }

  // 파일 삭제
  deleteFile(file);

  // 파일명 정리
  renameFlay(flay);
}

/**
 * opus 목록의 존재 여부를 확인한다.
 */
export function exists(opusList: string[]): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  for (const opus of opusList) {
    try {
      getInstanceFlay(opus);
      result[opus] = true;
    } catch {
      result[opus] = false;
    }
  }
  return result;
}

/**
 * Flay의 score를 계산하여 반환한다.
 */
export function getScore(opus: string): number {
  const flay = getFlay(opus);
  calcScore(flay);
  return flay.score;
}

/**
 * 전체 Flay의 score 맵을 반환한다.
 */
export function getScoreMap(): Record<string, number> {
  const result: Record<string, number> = {};
  for (const flay of getInstanceFlayList()) {
    calcScore(flay);
    result[flay.opus] = flay.score;
  }
  return result;
}

/**
 * Instance 또는 Archive에서 Flay를 조회한다.
 */
export function getFlay(opus: string): Flay {
  try {
    return getInstanceFlay(opus);
  } catch {
    return getArchiveFlay(opus);
  }
}

// ── 유틸 ─────────────────────────────────────────────

/** Flay의 fullname 생성 */
function toFullname(flay: Flay): string {
  return `[${flay.studio}][${flay.opus}][${flay.title}][${flay.actressList.join(',')}][${flay.release}]`;
}

/** Flay를 query용 문자열로 변환 */
function toQueryString(flay: Flay): string {
  return `${flay.studio} ${flay.opus} ${flay.title} ${flay.actressList.join(' ')} ${flay.release} ${flay.video.comment || ''}`;
}

/** 기본 정렬: release 내림, studio 내림, opus 내림 */
function defaultComparator(a: Flay, b: Flay): number {
  const relCmp = b.release.localeCompare(a.release);
  if (relCmp !== 0) return relCmp;
  const stCmp = b.studio.localeCompare(a.studio);
  if (stCmp !== 0) return stCmp;
  return b.opus.localeCompare(a.opus);
}
