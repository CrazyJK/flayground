import FlayIndexedDB from './FlayIndexedDB';

const dbName = 'flay-play-time-db';
const dbVersion = 3;
const storeName = 'FlayTime';
const dbSchema = [
  {
    name: storeName,
    keyPath: 'opus',
    index: [{ key: 'time', unique: false }],
  },
];

export default class FlayPlayTimeDB extends FlayIndexedDB {
  constructor() {
    super();
  }

  async openDB() {
    await this.open(dbName, dbVersion, dbSchema);
  }

  async select(opus) {
    return await this.get(storeName, opus);
  }

  async update(value) {
    await this.put(storeName, value);
  }
}
