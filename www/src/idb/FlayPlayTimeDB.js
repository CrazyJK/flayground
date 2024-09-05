import FlayIndexedDB from './FlayIndexedDB';

const dbName = 'flay-play-time-db';
const dbVersion = 5;
const storeName = 'FlayTime';
const dbSchema = [
  {
    name: storeName,
    keyPath: 'opus',
    index: [
      { key: 'time', unique: false },
      { key: 'duration', unique: false },
      { key: 'lastPlayed', unique: true },
    ],
  },
];

export default class FlayPlayTimeDB extends FlayIndexedDB {
  constructor() {
    super();
  }

  async #openDB() {
    await this.open(dbName, dbVersion, dbSchema);
  }

  async select(opus) {
    if (!this.db) await this.#openDB();
    return await this.get(storeName, opus);
  }

  async update(opus, time, duration) {
    if (!this.db) await this.#openDB();
    const record = {
      opus: opus,
      time: time,
      duration: duration,
      lastPlayed: Date.now(),
    };
    await this.put(storeName, record);
  }

  async listByLastPlayed() {
    if (!this.db) await this.#openDB();
    return await this.getAllByIndex(storeName, 'lastPlayed', false);
  }
}
