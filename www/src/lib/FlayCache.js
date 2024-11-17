/**
 * opus를 키로 캐싱
 * - flay object
 * - cover image
 * - history
 * - flay count of actress
 */

import ActressFlayCountStore from '../idb/ground/store/ActressFlayCountStore';
import ActressStore from '../idb/ground/store/ActressStore';
import CoverStore from '../idb/ground/store/CoverStore';
import FlayStore from '../idb/ground/store/FlayStore';
import HistoryStore from '../idb/ground/store/HistoryStore';
import ScoreStore from '../idb/ground/store/ScoreStore';

const flayStore = new FlayStore();
const coverStore = new CoverStore();
const scoreStore = new ScoreStore();
const historyStore = new HistoryStore();
const actressStore = new ActressStore();
const actressFlayCountStore = new ActressFlayCountStore();

const coverObjectURLMap = new Map();

export default class FlayCache {
  /**
   *
   * @param {string} opus
   * @returns
   */
  static async getFlayActress(opus) {
    const flay = await FlayCache.getFlay(opus);
    const actressList = [];
    for (const name of flay.actressList) {
      actressList.push(await FlayCache.getActress(name));
    }
    return { flay: flay, actress: actressList };
  }

  /**
   *
   * @param {string} opus
   * @returns
   */
  static async getFlay(opus) {
    let flay = await flayStore.select(opus);
    if (!flay) {
      flay = await fetch(`/flay/${opus}`).then((res) => res.json());
      if (flay.error) {
        throw new Error(flay.message);
      }
      await flayStore.update(flay);
      console.debug('[FlayCache] update flay', opus);
    }
    return flay;
  }

  /**
   *
   * @param {string} name
   * @returns
   */
  static async getActress(name) {
    let actress = await actressStore.select(name);
    if (!actress) {
      actress = await fetch(`/info/actress/${name}`).then((res) => res.json());
      if (actress.error) {
        throw new Error(actress.message);
      }
      await actressStore.update(actress);
      console.debug('[FlayCache] update actress', name);
    }
    return actress;
  }

  static async getScore(opus) {
    let record = await scoreStore.select(opus);
    if (!record) {
      const score = await fetch(`/flay/${opus}/score`).then((res) => res.text());
      if (score.error) {
        throw new Error(score.message);
      }
      record = await scoreStore.update(opus, score);
      console.debug('[FlayCache] update score', opus);
    }
    return record.score;
  }

  /**
   *
   * @param {string} opus
   * @returns
   */
  static async getCover(opus) {
    if (!coverObjectURLMap.has(opus)) {
      let cover = await coverStore.select(opus);
      if (!cover) {
        const blob = await fetch(`/static/cover/${opus}`).then((res) => res.blob());
        cover = await coverStore.update(opus, blob);
        console.debug('[FlayCache] update cover', opus);
      }
      coverObjectURLMap.set(opus, URL.createObjectURL(cover.blob));
    }
    return coverObjectURLMap.get(opus);
  }

  /**
   *
   * @param {string} opus
   * @returns
   */
  static async getHistories(opus) {
    let record = await historyStore.select(opus);
    if (!record) {
      const histories = await fetch(`/info/history/find/${opus}`).then((res) => res.json());
      record = await historyStore.update(opus, histories);
      console.debug('[FlayCache] update history', opus);
    }
    return record.histories;
  }

  /**
   *
   * @param {string} name
   * @returns
   */
  static async getCountOfFlay(name) {
    let record = await actressFlayCountStore.select(name);
    if (!record) {
      const flayCount = await fetch(`/flay/count/actress/${name}`).then((res) => res.text());
      record = await actressFlayCountStore.update(name, flayCount);
      console.debug('[FlayCache] update actressFlayCount', name);
    }
    return record.flayCount;
  }

  /**
   *
   * @param {string} opus
   */
  static async clear(opus) {
    let flay = await flayStore.select(opus);
    if (flay)
      for (let name of flay.actressList) {
        actressFlayCountStore.remove(name);
        actressStore.remove(name);
      }
    flayStore.remove(opus);
    coverStore.remove(opus);
    historyStore.remove(opus);
    console.log('[FlayCache] cleae', opus);
  }

  static async clearAll() {
    await flayStore.removeAll();
    await coverStore.removeAll();
    await historyStore.removeAll();
    await actressStore.removeAll();
    await actressFlayCountStore.removeAll();
    console.log('[FlayCache] clearAll');
  }
}
