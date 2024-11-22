/**
 * opus를 키로 캐싱
 * - flay object
 * - cover image
 * - history
 * - flay count of actress
 */

const coverObjectURLMap = new Map();

export default class FlayFetch {
  /**
   *
   * @param {string} opus
   * @returns
   */
  static async getFlayActress(opus) {
    return await fetch(`/flay/${opus}/fully`).then((res) => res.json());
  }

  /**
   *
   * @param {string} opus
   * @returns
   */
  static async getFlay(opus) {
    return await fetch(`/flay/${opus}`).then((res) => res.json());
  }

  /**
   *
   * @param {string} name
   * @returns
   */
  static async getActress(name) {
    return await fetch(`/info/actress/${name}`).then((res) => res.json());
  }

  static async getScore(opus) {
    return await fetch(`/flay/${opus}/score`).then((res) => res.text());
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

  /**
   *
   * @param {string} name
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
