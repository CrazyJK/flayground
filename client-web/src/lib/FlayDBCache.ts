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
import FlayFetch, { Actress } from '@lib/FlayFetch';

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
  static async getFlayActress(opus: string) {
    const flay = await FlayDBCache.getFlay(opus);
    const actressList = [];
    for (const name of flay.actressList) {
      actressList.push(await FlayDBCache.getActress(name));
    }
    return { flay: flay, actress: actressList };
  }

  /**
   *
   * @param opus
   * @returns
   */
  static async getFlay(opus: string) {
    let flay = await flayStore.select(opus);
    if (!flay) {
      flay = (await FlayFetch.getFlay(opus)) ?? undefined;
      if (!flay) {
        throw new Error(`Flay not found: ${opus}`);
      }
      await flayStore.update(flay);
      console.debug('[FlayDBCache] update flay', opus);
    }
    return flay;
  }

  /**
   *
   * @param name
   * @returns
   */
  static async getActress(name: string): Promise<Actress | undefined> {
    let actress = await actressStore.select(name);
    if (!actress) {
      actress = (await FlayFetch.getActress(name)) ?? undefined;
      if (!actress) {
        throw new Error(`Actress not found: ${name}`);
      }
      await actressStore.update(actress);
      console.debug('[FlayDBCache] update actress', name);
    }
    return actress;
  }

  static async getScore(opus: string) {
    let record = await scoreStore.select(opus);
    if (!record) {
      const score = await FlayFetch.getScore(opus);
      record = await scoreStore.update(opus, score);
      console.debug('[FlayDBCache] update score', opus);
    }
    return record.score;
  }

  /**
   *
   * @param opus
   * @returns
   */
  static async getCover(opus: string) {
    if (!coverObjectURLMap.has(opus)) {
      let cover = await coverStore.select(opus);
      if (!cover) {
        const blob = await FlayFetch.getCoverBlob(opus);
        if (!blob) {
          throw new Error(`Cover not found for opus: ${opus}`);
        }
        cover = await coverStore.update(opus, blob);
        console.debug('[FlayDBCache] update cover', opus);
      }
      coverObjectURLMap.set(opus, URL.createObjectURL(cover.blob));
    }
    return coverObjectURLMap.get(opus);
  }

  /**
   *
   * @param opus
   * @returns
   */
  static async getHistories(opus: string) {
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
   * @param name
   * @returns
   */
  static async getCountOfFlay(name: string) {
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
   * @param opus
   */
  static async clear(opus: string) {
    const flay = await flayStore.select(opus);
    if (flay)
      for (const name of flay.actressList) {
        void actressFlayCountStore.remove(name);
        void actressStore.remove(name);
      }
    void flayStore.remove(opus);
    void coverStore.remove(opus);
    void historyStore.remove(opus);
    console.log('[FlayDBCache] clear', opus);
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
