import FlayIndexedDB from '@flay/idb/FlayIndexedDB';

const dbName = 'flay-ground-db';
const dbVersion = 12;
const dbSchema = [
  {
    name: 'Flay',
    keyPath: 'opus',
    index: [
      { key: 'studio', unique: false },
      { key: 'title', unique: false },
      { key: 'actressList', unique: false },
      { key: 'release', unique: false },
      { key: 'archive', unique: false },
      { key: 'video.rank', unique: false },
      { key: 'video.play', unique: false },
      { key: 'video.tags', unique: false },
      { key: 'video.likes', unique: false },
    ],
  },
  { name: 'Cover', keyPath: 'opus' },
  { name: 'Score', keyPath: 'opus' },
  { name: 'History', keyPath: 'opus' },
  { name: 'Actress', keyPath: 'name' },
  { name: 'ActressFlayCount', keyPath: 'name' },
];

export default class FlayGroundDB extends FlayIndexedDB {
  constructor() {
    super();
  }

  async init() {
    await this.open(dbName, dbVersion, dbSchema);
  }
}
