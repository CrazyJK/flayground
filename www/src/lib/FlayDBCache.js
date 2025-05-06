/**
 * opus를 키로 캐싱
 * - flay object
 * - cover image
 * - history
 * - flay count of actress
 */

import ActressFlayCountStore from '@flay/idb/ground/store/ActressFlayCountStore';
import ActressStore from '@flay/idb/ground/store/ActressStore';
import CoverStore from '@flay/idb/ground/store/CoverStore';
import FlayStore from '@flay/idb/ground/store/FlayStore';
import HistoryStore from '@flay/idb/ground/store/HistoryStore';
import ScoreStore from '@flay/idb/ground/store/ScoreStore';
import FlayFetch from './FlayFetch';

const flayStore = new FlayStore();
const coverStore = new CoverStore();
const scoreStore = new ScoreStore();
const historyStore = new HistoryStore();
const actressStore = new ActressStore();
const actressFlayCountStore = new ActressFlayCountStore();

const coverObjectURLMap = new Map();

export default class FlayDBCache {
  /**
   *
   * @param {string} opus
   * @returns
   */
  static async getFlayActress(opus) {
    const flay = await FlayDBCache.getFlay(opus);
    const actressList = [];
    for (const name of flay.actressList) {
      actressList.push(await FlayDBCache.getActress(name));
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
      flay = await FlayFetch.getFlay(opus);
      if (!flay) {
        throw new Error(`Flay not found: ${opus}`);
      }
      if (flay.error) {
        throw new Error(flay.message);
      }
      await flayStore.update(flay);
      console.debug('[FlayDBCache] update flay', opus);
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
      actress = await FlayFetch.getActress(name);
      if (!actress) {
        throw new Error(`Actress not found: ${name}`);
      }
      if (actress.error) {
        throw new Error(actress.message);
      }
      await actressStore.update(actress);
      console.debug('[FlayDBCache] update actress', name);
    }
    return actress;
  }

  static async getScore(opus) {
    let record = await scoreStore.select(opus);
    if (!record) {
      const score = await FlayFetch.getScore(opus);
      if (score.error) {
        throw new Error(score.message);
      }
      record = await scoreStore.update(opus, score);
      console.debug('[FlayDBCache] update score', opus);
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
        const blob = await FlayFetch.getCover(opus);
        cover = await coverStore.update(opus, blob);
        console.debug('[FlayDBCache] update cover', opus);
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
      const histories = await FlayFetch.getHistories(opus);
      record = await historyStore.update(opus, histories);
      console.debug('[FlayDBCache] update history', opus);
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
      const flayCount = await FlayFetch.getCountOfFlay(name);
      record = await actressFlayCountStore.update(name, flayCount);
      console.debug('[FlayDBCache] update actressFlayCount', name);
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
    console.log('[FlayDBCache] cleae', opus);
  }

  static async clearAll() {
    await flayStore.removeAll();
    await coverStore.removeAll();
    await historyStore.removeAll();
    await actressStore.removeAll();
    await actressFlayCountStore.removeAll();
    console.log('[FlayDBCache] clearAll');
  }
}
