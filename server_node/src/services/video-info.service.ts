import { createHistory } from '../domain/history';
import { Tag } from '../domain/tag';
import { Video } from '../domain/video';
import { getInstanceFlay } from '../sources/flay-source';
import { historyRepository } from '../sources/history-repository';
import { videoInfoSource } from '../sources/info-sources';
import { sseSend } from './sse-emitters';

/**
 * Video 정보 서비스.
 * Java VideoInfoService 대응
 */

/** opus로 Video 조회 */
export function get(opus: string): Video {
  return videoInfoSource.get(opus);
}

/** 전체 Video 목록 */
export function list(): Video[] {
  return videoInfoSource.getList();
}

/** query 문자열로 검색 */
export function find(query: string): Video[] {
  return videoInfoSource.getList().filter((v) => JSON.stringify(v).includes(query));
}

/** 새 Video 생성 */
export function create(video: Video): Video {
  const created = videoInfoSource.create(video);
  sseSend(created);
  return created;
}

/**
 * Video를 저장한다. 없으면 생성, 있으면 수정.
 * Java VideoInfoService.put() 대응
 */
export function put(putVideo: Video): Video {
  const video = videoInfoSource.getOrNew(putVideo.opus);
  video.title = putVideo.title;
  video.desc = putVideo.desc;
  update(video);
  return video;
}

/**
 * Video를 업데이트한다.
 * lastAccess를 갱신하고 History를 기록한다.
 * Java VideoInfoService.update() 대응
 */
export function update(updateVideo: Video): void {
  updateVideo.lastAccess = Date.now();

  // Flay가 있으면 History 기록
  try {
    const flay = getInstanceFlay(updateVideo.opus);
    flay.video = updateVideo;
    historyRepository.save(createHistory(updateVideo.opus, 'UPDATE', JSON.stringify(updateVideo)));
  } catch {
    // Instance에 없으면 무시
  }

  videoInfoSource.update(updateVideo);
  sseSend(updateVideo);
}

/** Video 삭제 */
export function deleteVideo(video: Video): void {
  videoInfoSource.delete(video.opus);
  sseSend(video);
}

/**
 * rank를 설정한다.
 * Java VideoInfoService.setRank() 대응
 */
export function setRank(opus: string, rank: number): void {
  const video = videoInfoSource.get(opus);
  video.rank = rank;
  update(video);
}

/**
 * like를 추가한다. 6시간 이내 중복 방지.
 * Java VideoInfoService.setLike() 대응
 */
export function setLike(opus: string): void {
  const video = videoInfoSource.get(opus);
  const now = Date.now();
  const SIX_HOURS = 6 * 60 * 60 * 1000;

  // likes가 없거나, 6시간 이내 like가 없으면 추가
  if (!video.likes || video.likes.filter((dateStr) => new Date(dateStr).getTime() + SIX_HOURS > now).length === 0) {
    if (!video.likes) video.likes = [];
    video.likes.push(new Date().toISOString());
    update(video);
  }
}

/**
 * 태그를 토글한다.
 * Java VideoInfoService.toggleTag() 대응
 */
export function toggleTag(opus: string, tag: Tag, checked: boolean): void {
  const video = videoInfoSource.get(opus);

  if (checked) {
    // 이미 있는지 확인
    if (!video.tags.some((t) => t.id === tag.id)) {
      video.tags.push(tag);
    }
  } else {
    video.tags = video.tags.filter((t) => t.id !== tag.id);
  }
  update(video);
}

/**
 * 코멘트를 설정한다.
 */
export function setComment(opus: string, comment: string): void {
  const video = videoInfoSource.get(opus);
  video.comment = comment.trim();
  update(video);
}

/**
 * 특정 태그를 모든 Video에서 제거한다.
 * Java VideoInfoService.removeTag() 대응
 */
export function removeTag(deleteTag: Tag): void {
  for (const video of videoInfoSource.getList()) {
    if (video.tags.some((t) => t.id === deleteTag.id)) {
      video.tags = video.tags.filter((t) => t.id !== deleteTag.id);
      update(video);
    }
  }
}
