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

export default class PlayTimeDB extends FlayIndexedDB {
  constructor() {
    super();
  }

  async #init() {
    await this.open(dbName, dbVersion, dbSchema);
  }

  async select(opus) {
    await this.#init();
    return await this.get(storeName, opus);
  }

  async update(opus, time, duration) {
    await this.#init();
    const record = {
      opus: opus,
      time: time,
      duration: duration,
      lastPlayed: Date.now(),
    };
    await this.put(storeName, record);
  }

  async listByLastPlayed() {
    await this.#init();
    return await this.getAllByIndex(storeName, 'lastPlayed', false);
  }
}
