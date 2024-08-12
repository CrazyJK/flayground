import FlayIndexedDB from './FlayIndexedDB';

const dbName = 'flay-play-time-db';
const dbVersion = 3;
const storeName = 'FlayTime';
const dbSchema = [{ name: storeName, keyPath: 'opus', index: [{ key: 'time', unique: false }] }];

export default class FlayPlayTimeDB extends FlayIndexedDB {
  constructor() {
    super();
  }

  async #openDB() {
    await this.open(dbName, dbVersion, dbSchema);
  }

  /**
   *
   * @param {string} opus
   * @returns {Promise<{opus: string, time: number}>}
   */
  async select(opus) {
    if (!this.db) await this.#openDB();
    return await this.get(storeName, opus);
  }

  /**
   *
   * @param {{opus: string, time: number}} flayPlayTime
   */
  async update(flayPlayTime) {
    if (!this.db) await this.#openDB();
    await this.put(storeName, flayPlayTime);
  }
}
