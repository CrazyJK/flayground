/**
 * opus를 키로 캐싱
 * - flay object
 * - cover image
 * - history
 * - flay count of actress
 */

const coverObjectURLMap = new Map();

export default class FlayFetch {
  static async getFullyFlay(opus) {
    return await fetch(`/flay/${opus}/fully`).then((res) => res.json());
  }

  static async getFullyFlayList() {
    return await fetch('/flay/list/fully').then((res) => res.json());
  }

  /**
   *
   * @param {string} opus
   * @returns
   */
  static async getFlay(opus) {
    return await fetch(`/flay/${opus}`).then((res) => res.json());
  }

  static async getFlayList(...opus) {
    return await fetch('/flay', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(opus) }).then((res) => res.json());
  }

  static async existsFlay(opus) {
    const res = await fetch(`/flay/${opus}`, { method: 'HEAD' });
    return res.status === 200;
  }

  static async existsFlayList(...opus) {
    return await fetch('/flay/exists', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(opus) }).then((res) => res.json());
  }

  static async getArchive(opus) {
    return await fetch(`/archive/${opus}`).then((res) => res.json());
  }

  static async getArchiveList() {
    return await fetch('/archive').then((res) => res.json());
  }

  static async getArchiveOpusList() {
    return await fetch('/archive/list/opus').then((res) => res.json());
  }

  /**
   *
   * @param {string} name
   * @returns
   */
  static async getActress(name) {
    return await fetch(`/info/actress/${name}`).then((res) => res.json());
  }

  static async getActressListByLocalname(localName) {
    return await fetch(`/info/actress/find/byLocalname/${localName}`).then((res) => res.json());
  }

  static async getScore(opus) {
    return Number((await fetch(`/flay/${opus}/score`).then((res) => res.text())) || 0);
  }

  /**
   *
   * @param {string} opus
   * @returns
   */
  static async getCover(opus) {
    if (!coverObjectURLMap.has(opus)) {
      const blob = await fetch(`/static/cover/${opus}`).then((res) => res.blob());
      coverObjectURLMap.set(opus, URL.createObjectURL(blob));
    }
    return coverObjectURLMap.get(opus);
  }

  /**
   *
   * @param {string} opus
   * @returns
   */
  static async getHistories(opus) {
    return await fetch(`/info/history/find/${opus}`).then((res) => res.json());
  }

  static async getVideo(opus) {
    return await fetch(`/info/video/${opus}`).then((res) => res.json());
  }

  /**
   *
   * @param {string} name actress name
   * @returns
   */
  static async getCountOfFlay(name) {
    return await fetch(`/flay/count/actress/${name}`).then((res) => res.text());
  }

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
}
