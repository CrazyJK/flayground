import FlayIndexedDB from '../../FlayIndexedDB';

const dbName = 'nano-db';
const dbVersion = 1;
const dbSchema = [{ name: 'Nano', keyPath: 'opus' }];

export default class NanoDB extends FlayIndexedDB {
  constructor() {
    super();
  }

  async init() {
    await this.open(dbName, dbVersion, dbSchema);
  }
}
