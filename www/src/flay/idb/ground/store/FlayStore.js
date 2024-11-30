import FlayGroundDB from '../db/FlayGroundDB';

const storeName = 'Flay';

export default class FlayStore extends FlayGroundDB {
  constructor() {
    super();
  }

  async insert(...flayList) {
    await this.init();
    for (const flay of flayList) await this.add(storeName, flay);
  }

  async update(...flayList) {
    await this.init();
    for (const flay of flayList) await this.put(storeName, flay);
  }

  async remove(...opusList) {
    await this.init();
    for (const opus of opusList) await this.delete(storeName, opus);
  }

  async removeAll() {
    await this.init();
    await this.clear(storeName);
  }

  async select(opus) {
    await this.init();
    return await this.get(storeName, opus);
  }

  async selectAll() {
    await this.init();
    return await this.getAll(storeName);
  }

  async findByStudio(name) {
    await this.init();
    return await this.find(storeName, 'studio', name);
  }

  async findLikeTitle(title) {
    await this.init();
    return await this.findLike(storeName, 'title', title);
  }

  async findIncludeActress(name) {
    await this.init();
    return await this.findLike(storeName, 'actressList', name);
  }

  async findByRelease(release) {
    await this.init();
    return await this.find(storeName, 'release', release);
  }

  async findByArchive(isArchive) {
    await this.init();
    return (await this.selectAll()).filter((flay) => flay.archive === isArchive);
  }

  async findByRank(rank) {
    await this.init();
    return await this.find(storeName, 'video.rank', rank);
  }

  async findByPlay(play) {
    await this.init();
    return await this.find(storeName, 'video.play', play);
  }

  async findByTagId(id) {
    await this.init();
    return (await this.selectAll()).filter((flay) => flay.video.tags?.filter((tag) => tag.id === id).length > 0);
  }

  async findByTagName(name) {
    await this.init();
    return (await this.selectAll()).filter((flay) => flay.video.tags?.filter((tag) => tag.name === name).length > 0);
  }

  async findByLikesLength(n = 0) {
    await this.init();
    return (await this.selectAll()).filter((flay) => flay.video.likes?.length > n);
  }
}

export const loadFlayDB = async () => {
  const flayDB = new FlayStore();

  await flayDB.removeAll();

  await Promise.all([
    fetch('/flay')
      .then((res) => res.json())
      .then((list) => flayDB.update(...list)),
    fetch('/archive')
      .then((res) => res.json())
      .then((list) => flayDB.update(...list)),
  ]);
};
