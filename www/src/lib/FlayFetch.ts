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
  favorite: boolean;
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
  count?: number;
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

export const BlankFlay: Flay = {
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
    lastPlay: 0,
    lastAccess: 0,
    lastModified: 0,
    comment: '',
    title: '',
    desc: '',
    tags: [],
    likes: [],
  },
  files: {
    cover: [],
    subtitles: [],
    candidate: [],
    movie: [],
  },
  length: 0,
  lastModified: 0,
};

const coverObjectURLMap = new Map<string, string>();
let tagGroupList: TagGroup[] | null = null;
let tagList: Tag[] | null = null;

/**
 * 깊은 병합을 수행하는 유틸리티 함수
 */
function deepMerge<T>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = result[key];

      if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue) && targetValue && typeof targetValue === 'object' && !Array.isArray(targetValue)) {
        result[key] = deepMerge(targetValue, sourceValue) as T[Extract<keyof T, string>];
      } else {
        result[key] = sourceValue as T[Extract<keyof T, string>];
      }
    }
  }

  return result;
}

export default class FlayFetch {
  static async getFullyFlay(opus: string): Promise<FullyFlay | null> {
    const fullyFlay = await ApiClient.get<FullyFlay>(`/flay/${opus}/fully`);
    if (fullyFlay) {
      fullyFlay.flay = deepMerge(BlankFlay, fullyFlay.flay);
    }
    return fullyFlay;
  }

  static async getFullyFlayList(): Promise<FullyFlay[]> {
    const fullyFlays = (await ApiClient.get<FullyFlay[]>('/flay/list/fully')) ?? [];
    return fullyFlays.map((fullyFlay) => ({
      ...fullyFlay,
      flay: deepMerge(BlankFlay, fullyFlay.flay),
    }));
  }

  /**
   * Flay 정보 조회
   * @param opus - opus 번호
   * @returns Flay 객체 또는 null
   */
  static async getFlay(opus: string): Promise<Flay | null> {
    const flay = await ApiClient.get<Flay>(`/flay/${opus}`);
    return flay ? deepMerge(BlankFlay, flay) : null;
  }

  static async getFlayAll(): Promise<Flay[]> {
    const flays = (await ApiClient.get<Flay[]>('/flay')) ?? [];
    return flays.map((flay) => deepMerge(BlankFlay, flay));
  }

  static async getFlayList(...opus: string[]): Promise<Flay[]> {
    const flays = (await ApiClient.post<Flay[]>('/flay', opus)) ?? [];
    return flays.map((flay) => deepMerge(BlankFlay, flay));
  }

  static async getOpusList(condition: Partial<SearchCondition>): Promise<string[]> {
    return (await ApiClient.post<string[]>('/flay/list/opus', condition, { cache: 'no-cache' })) ?? [];
  }
  static async getFlayListLowScore(): Promise<Flay[]> {
    const flays = (await ApiClient.get<Flay[]>('/flay/list/lowScore')) ?? [];
    return flays.map((flay) => deepMerge(BlankFlay, flay));
  }

  static async getFlayListOrderByScoreDesc(): Promise<Flay[]> {
    const flays = (await ApiClient.get<Flay[]>('/flay/list/orderbyScoreDesc')) ?? [];
    return flays.map((flay) => deepMerge(BlankFlay, flay));
  }

  static async getFlayCandidates(): Promise<Flay[]> {
    const flays = (await ApiClient.get<Flay[]>('/flay/candidates')) ?? [];
    return flays.map((flay) => deepMerge(BlankFlay, flay));
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
    return (await ApiClient.post<Record<string, boolean>>('/flay/exists', opus)) ?? {};
  }

  static async getScore(opus: string): Promise<number> {
    return Number((await ApiClient.get<number | string>(`/flay/${opus}/score`)) ?? 0);
  }

  /**
   * 배우 이름으로 플레이 수량 조회
   * @param name - 배우 이름
   * @returns 플레이 수량
   */
  static async getCountOfFlay(name: string): Promise<number> {
    return (await ApiClient.get<number>(`/flay/count/actress/${name}`)) ?? 0;
  }
  static async getFlayListByTagId(tagId: number): Promise<Flay[]> {
    const flays = (await ApiClient.get<Flay[]>(`/flay/find/tag/${tagId}`)) ?? [];
    return flays.map((flay) => deepMerge(BlankFlay, flay));
  }

  static async getFlayListByStudio(name: string): Promise<Flay[]> {
    const flays = (await ApiClient.get<Flay[]>(`/flay/find/studio/${name}`)) ?? [];
    return flays.map((flay) => deepMerge(BlankFlay, flay));
  }

  static async getFlayListByActress(name: string): Promise<Flay[]> {
    const flays = (await ApiClient.get<Flay[]>(`/flay/find/actress/${name}`)) ?? [];
    return flays.map((flay) => deepMerge(BlankFlay, flay));
  }

  /* ######################## Archive ######################## */

  static async getArchive(opus: string): Promise<Archive | null> {
    const archive = await ApiClient.get<Archive>(`/archive/${opus}`);
    return archive ? deepMerge(BlankFlay, archive) : null;
  }

  static async getArchiveAll(): Promise<Archive[]> {
    const archives = (await ApiClient.get<Archive[]>('/archive')) ?? [];
    return archives.map((archive) => deepMerge(BlankFlay, archive));
  }

  static async getArchiveOpusList(): Promise<string[]> {
    return (await ApiClient.get<string[]>('/archive/list/opus')) ?? [];
  }

  static async getArchiveListByStudio(name: string): Promise<Archive[]> {
    const archives = (await ApiClient.get<Archive[]>(`/archive/find/studio/${name}`)) ?? [];
    return archives.map((archive) => deepMerge(BlankFlay, archive));
  }

  static async getArchiveListByActress(name: string): Promise<Archive[]> {
    const archives = (await ApiClient.get<Archive[]>(`/archive/find/actress/${name}`)) ?? [];
    return archives.map((archive) => deepMerge(BlankFlay, archive));
  }

  /* ######################## Studio ######################## */

  static async getStudioAll(): Promise<Studio[]> {
    return (await ApiClient.get<Studio[]>('/info/studio')) ?? [];
  }

  static async getStudio(name: string): Promise<Studio | null> {
    return await ApiClient.get<Studio>(`/info/studio/${name}`);
  }

  static async getStudioFindOneByOpus(opus: string): Promise<Studio | null> {
    return await ApiClient.get<Studio>(`/info/studio/findOneByOpus/${opus}`);
  }

  /* ######################## Actress ######################## */

  static async getActressAll(): Promise<Actress[]> {
    return (await ApiClient.get<Actress[]>('/info/actress')) ?? [];
  }

  /**
   * 배우 정보 조회
   * @param name - 배우 이름
   * @returns 배우 정보 또는 null
   */
  static async getActress(name: string): Promise<Actress | null> {
    return await ApiClient.get<Actress>(`/info/actress/${name}`);
  }

  static async getActressListByLocalname(localName: string): Promise<Actress[]> {
    return (await ApiClient.get<Actress[]>(`/info/actress/find/byLocalname/${localName}`)) ?? [];
  }

  /* ######################## History ######################## */

  /**
   * 히스토리 목록 조회
   * @param opus - opus 번호
   * @returns 히스토리 목록
   */
  static async getHistories(opus: string): Promise<History[]> {
    return (await ApiClient.get<History[]>(`/info/history/find/${opus}`)) ?? [];
  }

  static async getHistoryListByAction(action: string): Promise<History[]> {
    return (await ApiClient.get<History[]>(`/info/history/find/action/${action}`)) ?? [];
  }

  /* ######################## Video ######################## */

  static async getVideo(opus: string): Promise<Video | null> {
    return await ApiClient.get<Video>(`/info/video/${opus}`);
  }

  /* ######################## Tag ######################## */

  static async getTag(id: number): Promise<Tag | null> {
    return await ApiClient.get<Tag>(`/info/tag/${id}`);
  }

  static async getTagListWithCount(): Promise<Tag[]> {
    return (await ApiClient.get<Tag[]>('/info/tag/withCount')) ?? [];
  }

  /**
   * 태그 그룹 목록 조회 (캐싱)
   * @returns 태그 그룹 목록
   */
  static async getTagGroups(): Promise<TagGroup[]> {
    if (tagGroupList === null) {
      tagGroupList = (await ApiClient.get<TagGroup[]>('/info/tagGroup')) ?? [];
    }
    return tagGroupList;
  }

  /**
   * 태그 목록 조회 (캐싱)
   * @returns 태그 목록
   */
  static async getTags(): Promise<Tag[]> {
    if (tagList === null) {
      tagList = (await ApiClient.get<Tag[]>('/info/tag')) ?? [];
    }
    return tagList;
  }

  /* ######################## Cover ######################## */

  /**
   * 커버 이미지 조회
   * @param opus - opus 번호
   * @returns 커버 이미지 Blob 또는 null
   */
  static async getCoverBlob(opus: string): Promise<Blob | null> {
    return await ApiClient.get<Blob>(`/static/cover/${opus}`, { responseType: 'blob' });
  }

  /**
   * 커버 이미지 URL 조회 (캐싱)
   * @param opus - opus 번호
   * @returns 커버 이미지 Object URL
   */
  static async getCoverURL(opus: string): Promise<string> {
    if (!coverObjectURLMap.has(opus)) {
      const blob = await FlayFetch.getCoverBlob(opus);
      if (blob) {
        coverObjectURLMap.set(opus, URL.createObjectURL(blob));
      }
    }
    return coverObjectURLMap.get(opus) ?? '';
  }

  /* ######################## Image ######################## */

  static async getImage(idx: number): Promise<ImageDomain | null> {
    return await ApiClient.get(`/image/${idx}`);
  }

  static async getImageAll(): Promise<ImageDomain[]> {
    return (await ApiClient.get<ImageDomain[]>('/image')) ?? [];
  }

  static async getImageSize(): Promise<number> {
    return Number((await ApiClient.get<number | string>('/image/size')) ?? 0);
  }

  static async removeImage(idx: number): Promise<void> {
    await ApiClient.delete(`/image/${idx}`);
  }

  static async getStaticImage(idx: number): Promise<ImageData> {
    const res = await ApiClient.getResponse(`/static/image/${idx}`);
    const name = decodeURIComponent(res.headers.get('Name')?.replace(/\+/g, ' ') ?? '');
    const path = decodeURIComponent(res.headers.get('Path')?.replace(/\+/g, ' ') ?? '');
    const modified = new Date(Number(res.headers.get('Modified')));
    const imageBlob = await res.blob();
    return { name, path, modified, imageBlob };
  }

  static getImageURL(idx: number): string {
    return ApiClient.buildUrl(`/static/image/${idx}`);
  }

  /* ######################## etc ######################## */

  /**
   * 특정 opus의 캐시 정리
   * @param opus - opus 번호
   */
  static clear(opus: string): void {
    coverObjectURLMap.delete(opus);
  }

  static clearAll(): void {
    coverObjectURLMap.clear();
  }

  static clearTag(): void {
    tagGroupList = null;
    tagList = null;
  }
}
