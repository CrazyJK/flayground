import FlayGroundDB from '@flay/idb/ground/db/FlayGroundDB';
import FlayFetch, { Flay, Tag } from '@lib/FlayFetch';

const storeName = 'Flay';

export default class FlayStore extends FlayGroundDB {
  constructor() {
    super();
  }

  async insert(...flayList: Flay[]) {
    await this.init();
    for (const flay of flayList) await this.add(storeName, flay);
  }

  async update(...flayList: Flay[]) {
    await this.init();
    for (const flay of flayList) await this.put(storeName, flay);
  }

  async remove(...opusList: string[]) {
    await this.init();
    for (const opus of opusList) await this.delete(storeName, opus);
  }

  async removeAll() {
    await this.init();
    await this.clear(storeName);
  }

  async select(opus: string): Promise<Flay | undefined> {
    await this.init();
    return await this.get(storeName, opus);
  }

  async selectAll() {
    await this.init();
    return await this.getAll(storeName);
  }

  async findByStudio(name: string) {
    await this.init();
    return await this.find(storeName, 'studio', name);
  }

  async findLikeTitle(title: string) {
    await this.init();
    return await this.findLike(storeName, 'title', title);
  }

  async findIncludeActress(name: string) {
    await this.init();
    return await this.findLike(storeName, 'actressList', name);
  }

  async findByRelease(release: string) {
    await this.init();
    return await this.find(storeName, 'release', release);
  }

  async findByArchive(isArchive: boolean) {
    await this.init();
    return (await this.selectAll()).filter((flay: Flay) => flay.archive === isArchive);
  }

  async findByRank(rank: number) {
    await this.init();
    return await this.find(storeName, 'video.rank', rank);
  }

  async findByPlay(play: number) {
    await this.init();
    return await this.find(storeName, 'video.play', play);
  }

  async findByTagId(id: number) {
    await this.init();
    return (await this.selectAll()).filter((flay: Flay) => flay.video.tags?.filter((tag: Tag) => tag.id === id).length > 0);
  }

  async findByTagName(name: string) {
    await this.init();
    return (await this.selectAll()).filter((flay: Flay) => flay.video.tags?.filter((tag) => tag.name === name).length > 0);
  }

  async findByLikesLength(n = 0) {
    await this.init();
    return (await this.selectAll()).filter((flay: Flay) => flay.video.likes?.length > n);
  }
}

export const loadFlayDB = async () => {
  const flayDB = new FlayStore();

  await flayDB.removeAll();

  await Promise.all([FlayFetch.getFlayAll().then((list) => flayDB.update(...list)), FlayFetch.getArchiveAll().then((list) => flayDB.update(...list))]);
};
