import NanoDB from '@flay/idb/nano/db/NanoDB';

const storeName = 'Nano';

export default class NanoStore extends NanoDB {
  async select(opus: string) {
    await this.init();
    return await this.get(storeName, opus);
  }

  async update(opus: string, date: number) {
    await this.init();
    const record = {
      opus: opus,
      date: date,
    };
    await this.put(storeName, record);
    return record;
  }

  async remove(opus: string) {
    await this.init();
    await this.delete(storeName, opus);
  }

  async removeAll() {
    await this.init();
    await this.clear(storeName);
  }
}
