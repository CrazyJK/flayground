import FlayGroundDB from '@flay/idb/ground/db/FlayGroundDB';

const storeName = 'History';

export default class HistoryStore extends FlayGroundDB {
  constructor() {
    super();
  }

  async select(opus) {
    await this.init();
    return await this.get(storeName, opus);
  }

  async update(opus, histories) {
    await this.init();
    const record = {
      opus: opus,
      histories: histories,
    };
    await this.put(storeName, record);
    return record;
  }

  async remove(opus) {
    await this.init();
    await this.delete(storeName, opus);
  }

  async removeAll() {
    await this.init();
    await this.clear(storeName);
  }
}
