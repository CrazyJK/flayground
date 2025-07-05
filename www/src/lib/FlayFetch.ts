/**
 * opus를 키로 캐싱
 * - flay object
 * - cover image
 * - history
 * - flay count of actress
 */

import ApiClient from '@lib/ApiClient';

// Type definitions
export interface FullyFlay {
  flay: Flay;
  actress: Actress[];
}

export interface FlayFiles {
  cover: string[];
  subtitles: string[];
  candidate: string[];
  movie: string[];
}

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
  files: FlayFiles;
  length: number;
  lastModified: number;
}

export interface Video {
  opus: string;
  play: number;
  rank: number;
  lastPlay: number;
  lastAccess: number;
  lastModified: number;
  comment: string;
  title: string;
  desc: string;
  tags: Tag[];
  likes: string[];
}

export interface Archive extends Flay {}

export interface Studio {
  name: string;
  company: string;
  homepage: string;
  lastModified: number;
}

export interface Actress {
  favorite: true;
  name: string;
  localName: string;
  otherNames: string[];
  birth: string;
  body: string;
  height: number;
  debut: number;
  comment: string;
  lastModified: number;
  coverSize: number;
}

export interface History {
  date: string;
  opus: string;
  action: string;
  desc: string;
}

export interface Tag {
  id: number;
  name: string;
  group: string;
  description: string;
  lastModified: number;
}

export interface TagGroup {
  id: string;
  name: string;
  desc: string;
}

/**
 * 이미지 데이터 인터페이스
 * - name: 이미지 파일 이름
 * - path: 이미지 파일 경로
 * - modified: 이미지 파일 수정 날짜
 * - imageBlob: 이미지 Blob 데이터
 */
export interface ImageData {
  name: string;
  path: string;
  modified: Date;
  imageBlob: Blob;
}

export interface SearchCondition {
  sort: string;
  reverse: boolean;
  studio: string;
  opus: string;
  title: string;
  actress: string;
  release: string;
  rank: number[];
  search: string;
  withSubtitles: boolean;
  withFavorite: boolean;
  withNoFavorite: boolean;
}

export interface ImageDomain {
  idx: number;
  length: number;
  modified: number;
  name: string;
  path: string;
  file: string;
  width: number;
  height: number;
}

const coverObjectURLMap = new Map<string, string>();
let tagGroupList: TagGroup[] | null = null;
let tagList: Tag[] | null = null;

export default class FlayFetch {
  static async getFullyFlay(opus: string): Promise<FullyFlay> {
    return await ApiClient.get<FullyFlay>(`/flay/${opus}/fully`);
  }

  static async getFullyFlayList(): Promise<FullyFlay[]> {
    return await ApiClient.get<FullyFlay[]>('/flay/list/fully');
  }

  /**
   * Flay 정보 조회
   * @param opus - opus 번호
   * @returns Flay 객체
   */
  static async getFlay(opus: string): Promise<Flay> {
    return await ApiClient.get<Flay>(`/flay/${opus}`);
  }

  static async getFlayAll(): Promise<Flay[]> {
    return await ApiClient.get<Flay[]>('/flay');
  }

  static async getFlayList(...opus: string[]): Promise<Flay[]> {
    return await ApiClient.post<Flay[]>('/flay', opus);
  }

  static async getOpusList(condition: Partial<SearchCondition>): Promise<string[]> {
    return await ApiClient.post<string[]>('/flay/list/opus', condition, { cache: 'no-cache' });
  }
  static async getFlayListLowScore(): Promise<Flay[]> {
    return await ApiClient.get<Flay[]>('/flay/list/lowScore');
  }

  static async getFlayListOrderByScoreDesc(): Promise<Flay[]> {
    return await ApiClient.get<Flay[]>('/flay/list/orderbyScoreDesc');
  }

  static async getFlayCandidates(): Promise<Flay[]> {
    return await ApiClient.get<Flay[]>('/flay/candidates');
  }

  static async existsFlay(opus: string): Promise<boolean> {
    try {
      const res = await ApiClient.head(`/flay/${opus}`);
      return res.status === 200;
    } catch (error) {
      return false;
    }
  }

  static async existsFlayList(...opus: string[]): Promise<Record<string, boolean>> {
    return await ApiClient.post<Record<string, boolean>>('/flay/exists', opus);
  }

  static async getScore(opus: string): Promise<number> {
    return Number((await ApiClient.get<number | string>(`/flay/${opus}/score`)) || 0);
  }

  /**
   * 배우 이름으로 플레이 수량 조회
   * @param name - 배우 이름
   * @returns 플레이 수량
   */
  static async getCountOfFlay(name: string): Promise<number> {
    return await ApiClient.get<number>(`/flay/count/actress/${name}`);
  }
  static async getFlayListByTagId(tagId: number): Promise<Flay[]> {
    return await ApiClient.get<Flay[]>(`/flay/find/tag/${tagId}`);
  }

  static async getFlayListByStudio(name: string): Promise<Flay[]> {
    return await ApiClient.get<Flay[]>(`/flay/find/studio/${name}`);
  }

  static async getFlayListByActress(name: string): Promise<Flay[]> {
    return await ApiClient.get<Flay[]>(`/flay/find/actress/${name}`);
  }

  /* ######################## Archive ######################## */

  static async getArchive(opus: string): Promise<Archive> {
    return await ApiClient.get<Archive>(`/archive/${opus}`);
  }

  static async getArchiveAll(): Promise<Archive[]> {
    return await ApiClient.get<Archive[]>('/archive');
  }

  static async getArchiveOpusList(): Promise<string[]> {
    return await ApiClient.get<string[]>('/archive/list/opus');
  }

  static async getArchiveListByStudio(name: string): Promise<Archive[]> {
    return await ApiClient.get<Archive[]>(`/archive/find/studio/${name}`);
  }

  static async getArchiveListByActress(name: string): Promise<Archive[]> {
    return await ApiClient.get<Archive[]>(`/archive/find/actress/${name}`);
  }
  /* ######################## Studio ######################## */

  static async getStudioAll(): Promise<Studio[]> {
    return await ApiClient.get<Studio[]>('/info/studio');
  }

  static async getStudio(name: string): Promise<Studio> {
    return await ApiClient.get<Studio>(`/info/studio/${name}`);
  }

  static async getStudioFindOneByOpus(opus: string): Promise<Studio> {
    return await ApiClient.get<Studio>(`/info/studio/findOneByOpus/${opus}`);
  }

  /* ######################## Actress ######################## */

  static async getActressAll(): Promise<Actress[]> {
    return await ApiClient.get<Actress[]>('/info/actress');
  }

  /**
   * 배우 정보 조회
   * @param name - 배우 이름
   * @returns 배우 정보
   */
  static async getActress(name: string): Promise<Actress> {
    return await ApiClient.get<Actress>(`/info/actress/${name}`);
  }

  static async getActressListByLocalname(localName: string): Promise<Actress[]> {
    return await ApiClient.get<Actress[]>(`/info/actress/find/byLocalname/${localName}`);
  }

  /* ######################## History ######################## */

  /**
   * 히스토리 목록 조회
   * @param opus - opus 번호
   * @returns 히스토리 목록
   */
  static async getHistories(opus: string): Promise<History[]> {
    return await ApiClient.get<History[]>(`/info/history/find/${opus}`);
  }

  static async getHistoryListByAction(action: string): Promise<History[]> {
    return await ApiClient.get<History[]>(`/info/history/find/action/${action}`);
  }

  /* ######################## Video ######################## */

  static async getVideo(opus: string): Promise<Video> {
    return await ApiClient.get<Video>(`/info/video/${opus}`);
  }
  /* ######################## Tag ######################## */

  static async getTag(id: number): Promise<Tag> {
    return await ApiClient.get<Tag>(`/info/tag/${id}`);
  }

  static async getTagListWithCount(): Promise<Tag[]> {
    return await ApiClient.get<Tag[]>('/info/tag/withCount');
  }

  /**
   * 태그 그룹 목록 조회 (캐싱)
   * @returns 태그 그룹 목록
   */
  static async getTagGroups(): Promise<TagGroup[]> {
    if (tagGroupList === null) {
      tagGroupList = await ApiClient.get<TagGroup[]>('/info/tagGroup');
    }
    return tagGroupList;
  }

  /**
   * 태그 목록 조회 (캐싱)
   * @returns 태그 목록
   */
  static async getTags(): Promise<Tag[]> {
    if (tagList === null) {
      tagList = await ApiClient.get<Tag[]>('/info/tag');
    }
    return tagList;
  }

  /* ######################## Cover ######################## */

  /**
   * 커버 이미지 조회
   * @param opus - opus 번호
   * @returns 커버 이미지 Blob
   */
  static async getCover(opus: string): Promise<Blob> {
    return await ApiClient.get<Blob>(`/static/cover/${opus}`, { responseType: 'blob' });
  }

  /**
   * 커버 이미지 URL 조회 (캐싱)
   * @param opus - opus 번호
   * @returns 커버 이미지 Object URL
   */
  static async getCoverURL(opus: string): Promise<string> {
    if (!coverObjectURLMap.has(opus)) {
      const blob = await ApiClient.get<Blob>(`/static/cover/${opus}`, { responseType: 'blob' });
      coverObjectURLMap.set(opus, URL.createObjectURL(blob));
    }
    return coverObjectURLMap.get(opus)!;
  }
  /* ######################## Image ######################## */

  static async getImage(idx: number): Promise<ImageDomain> {
    return await ApiClient.get(`/image/${idx}`);
  }

  static async getImageAll(): Promise<ImageDomain[]> {
    return await ApiClient.get<ImageDomain[]>('/image');
  }

  static async getImageSize(): Promise<number> {
    return Number(await ApiClient.get<number | string>('/image/size'));
  }

  static async removeImage(idx: number): Promise<void> {
    await ApiClient.delete(`/image/${idx}`);
  }

  static async getStaticImage(idx: number): Promise<ImageData> {
    const res = await ApiClient.getResponse(`/static/image/${idx}`);
    const name = decodeURIComponent(res.headers.get('Name')?.replace(/\+/g, ' ') || '');
    const path = decodeURIComponent(res.headers.get('Path')?.replace(/\+/g, ' ') || '');
    const modified = new Date(Number(res.headers.get('Modified')));
    const imageBlob = await res.blob();
    return { name, path, modified, imageBlob };
  }

  /* ######################## etc ######################## */

  /**
   * 특정 opus의 캐시 정리
   * @param opus - opus 번호
   */
  static async clear(opus: string): Promise<void> {
    coverObjectURLMap.delete(opus);
  }

  static async clearAll(): Promise<void> {
    coverObjectURLMap.clear();
  }

  static async clearTag(): Promise<void> {
    tagGroupList = null;
    tagList = null;
  }
}
