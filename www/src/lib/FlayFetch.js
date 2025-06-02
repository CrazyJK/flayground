/**
 * opus를 키로 캐싱
 * - flay object
 * - cover image
 * - history
 * - flay count of actress
 */

import ApiClient from '@lib/ApiClient';

const coverObjectURLMap = new Map();
let tagGroupList = null;
let tagList = null;

export default class FlayFetch {
  static async getFullyFlay(opus) {
    return await ApiClient.get(`/flay/${opus}/fully`);
  }

  static async getFullyFlayList() {
    return await ApiClient.get('/flay/list/fully');
  }

  /**
   *
   * @param {string} opus
   * @returns
   */
  static async getFlay(opus) {
    return await ApiClient.get(`/flay/${opus}`);
  }

  static async getFlayAll() {
    return await ApiClient.get('/flay');
  }

  static async getFlayList(...opus) {
    return await ApiClient.post('/flay', opus);
  }

  static async getOpusList(condition) {
    return await ApiClient.post('/flay/list/opus', condition, { cache: 'no-cache' });
  }

  static async getFlayListLowScore() {
    return await ApiClient.get('/flay/list/lowScore');
  }

  static async getFlayListOrderByScoreDesc() {
    return await ApiClient.get('/flay/list/orderbyScoreDesc');
  }

  static async getFlayCandidates() {
    return await ApiClient.get('/flay/candidates');
  }

  static async existsFlay(opus) {
    try {
      const res = await ApiClient.head(`/flay/${opus}`);
      return res.status === 200;
    } catch (error) {
      return false;
    }
  }

  static async existsFlayList(...opus) {
    return await ApiClient.post('/flay/exists', opus);
  }

  static async getScore(opus) {
    return Number((await ApiClient.get(`/flay/${opus}/score`)) || 0);
  }

  /**
   *
   * @param {string} name actress name
   * @returns
   */
  static async getCountOfFlay(name) {
    return await ApiClient.get(`/flay/count/actress/${name}`);
  }

  static async getFlayListByTagId(tagId) {
    return await ApiClient.get(`/flay/find/tag/${tagId}`);
  }

  static async getFlayListByStudio(name) {
    return await ApiClient.get(`/flay/find/studio/${name}`);
  }

  static async getFlayListByActress(name) {
    return await ApiClient.get(`/flay/find/actress/${name}`);
  }

  /* ######################## Archive ######################## */

  static async getArchive(opus) {
    return await ApiClient.get(`/archive/${opus}`);
  }

  static async getArchiveAll() {
    return await ApiClient.get('/archive');
  }

  static async getArchiveOpusList() {
    return await ApiClient.get('/archive/list/opus');
  }

  static async getArchiveListByStudio(name) {
    return await ApiClient.get(`/archive/find/studio/${name}`);
  }

  static async getArchiveListByActress(name) {
    return await ApiClient.get(`/archive/find/actress/${name}`);
  }

  /* ######################## Studio ######################## */

  static async getStudioAll() {
    return await ApiClient.get('/info/studio');
  }

  static async getStudio(name) {
    return await ApiClient.get(`/info/studio/${name}`);
  }

  static async getStudioFindOneByOpus(opus) {
    return await ApiClient.get(`/info/studio/findOneByOpus/${opus}`);
  }

  /* ######################## Actress ######################## */

  static async getActressAll() {
    return await ApiClient.get('/info/actress');
  }

  /**
   *
   * @param {string} name
   * @returns
   */
  static async getActress(name) {
    return await ApiClient.get(`/info/actress/${name}`);
  }

  static async getActressListByLocalname(localName) {
    return await ApiClient.get(`/info/actress/find/byLocalname/${localName}`);
  }

  /* ######################## History ######################## */

  /**
   *
   * @param {string} opus
   * @returns
   */
  static async getHistories(opus) {
    return await ApiClient.get(`/info/history/find/${opus}`);
  }

  static async getHistoryListByAction(action) {
    return await ApiClient.get(`/info/history/find/action/${action}`);
  }

  /* ######################## Video ######################## */

  static async getVideo(opus) {
    return await ApiClient.get(`/info/video/${opus}`);
  }

  /* ######################## Tag ######################## */

  static async getTag(id) {
    return await ApiClient.get(`/info/tag/${id}`);
  }

  static async getTagListWithCount() {
    return await ApiClient.get('/info/tag/withCount');
  }

  /**
   *
   * @returns {Promise<TagGroup[]>}
   */
  static async getTagGroups() {
    if (tagGroupList === null) {
      tagGroupList = await ApiClient.get('/info/tagGroup');
    }
    return tagGroupList;
  }

  /**
   *
   * @returns {Promise<Tag[]>}
   */
  static async getTags() {
    if (tagList === null) {
      tagList = await ApiClient.get('/info/tag');
    }
    return tagList;
  }

  /* ######################## Cover ######################## */

  /**
   *
   * @param {string} opus
   * @returns
   */
  static async getCover(opus) {
    return await ApiClient.get(`/static/cover/${opus}`);
  }

  /**
   *
   * @param {string} opus
   * @returns
   */
  static async getCoverURL(opus) {
    if (!coverObjectURLMap.has(opus)) {
      const blob = await ApiClient.get(`/static/cover/${opus}`);
      coverObjectURLMap.set(opus, URL.createObjectURL(blob));
    }
    return coverObjectURLMap.get(opus);
  }

  /* ######################## Image ######################## */

  static async getImage(idx) {
    return await ApiClient.get(`/image/${idx}`);
  }

  static async getImageAll() {
    return await ApiClient.get('/image');
  }

  static async getImageSize() {
    return Number(await ApiClient.get('/image/size'));
  }

  static async getStaticImage(idx) {
    const res = await ApiClient.getResponse(`/static/image/${idx}`);
    const name = decodeURIComponent(res.headers.get('Name').replace(/\+/g, ' '));
    const path = decodeURIComponent(res.headers.get('Path').replace(/\+/g, ' '));
    const modified = new Date(Number(res.headers.get('Modified')));
    const imageBlob = await res.blob();
    return { name, path, modified, imageBlob };
  }

  /* ######################## etc ######################## */

  /**
   *
   * @param {string} opus
   */
  static async clear(opus) {
    coverObjectURLMap.delete(opus);
  }

  static async clearAll() {
    coverObjectURLMap.clear();
  }

  static async clearTag() {
    tagGroupList = null;
    tagList = null;
  }
}
