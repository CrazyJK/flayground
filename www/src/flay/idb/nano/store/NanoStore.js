import NanoDB from '@flay/idb/nano/db/NanoDB';

const storeName = 'Nano';

export default class NanoStore extends NanoDB {
  constructor() {
    super();
  }

  async select(opus) {
    await this.init();
    return await this.get(storeName, opus);
  }

  async update(opus, date) {
    await this.init();
    const record = {
      opus: opus,
      date: date,
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
