import FlayIndexedDB from './FlayIndexedDB';

const dbName = 'flay-ground-db';
const dbVersion = 6;
const storeName = 'FlayList';
const dbSchema = [
  {
    name: storeName,
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
];

export default class FlayDB extends FlayIndexedDB {
  constructor() {
    super();
  }

  async openDB() {
    await this.open(dbName, dbVersion, dbSchema);
  }

  async insert(...flayList) {
    for (const flay of flayList) await this.add(storeName, flay);
  }

  async update(...flayList) {
    for (const flay of flayList) await this.put(storeName, flay);
  }

  async remove(...opusList) {
    for (const opus of opusList) await this.delete(storeName, opus);
  }

  async deleteAll() {
    await this.clear(storeName);
  }

  async select(opus) {
    return await this.get(storeName, opus);
  }

  async selectAll() {
    return await this.getAll(storeName);
  }

  async findByStudio(name) {
    return await this.find(storeName, 'studio', name);
  }

  async findLikeTitle(title) {
    return await this.findLike(storeName, 'title', title);
  }

  async findIncludeActress(name) {
    return await this.findLike(storeName, 'actressList', name);
  }

  async findByRelease(release) {
    return await this.find(storeName, 'release', release);
  }

  async findByArchive(isArchive) {
    return (await this.selectAll()).filter((flay) => flay.archive === isArchive);
  }

  async findByRank(rank) {
    return await this.find(storeName, 'video.rank', rank);
  }

  async findByPlay(play) {
    return await this.find(storeName, 'video.play', play);
  }

  async findByTagId(id) {
    return (await this.selectAll()).filter((flay) => flay.video.tags?.filter((tag) => tag.id === id).length > 0);
  }

  async findByTagName(name) {
    return (await this.selectAll()).filter((flay) => flay.video.tags?.filter((tag) => tag.name === name).length > 0);
  }

  async findByLikesLength(n = 0) {
    return (await this.selectAll()).filter((flay) => flay.video.likes?.length > n);
  }
}

export const loadFlayDB = async () => {
  const flayDB = new FlayDB();
  await flayDB.openDB();

  await flayDB.deleteAll();

  await Promise.all([
    fetch('/flay')
      .then((res) => res.json())
      .then((list) => flayDB.update(...list)),
    fetch('/archive')
      .then((res) => res.json())
      .then((list) => flayDB.update(...list)),
  ]);
};
