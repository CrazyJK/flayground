import FlayGroundDB from '@flay/idb/ground/db/FlayGroundDB';

const storeName = 'Cover';

export default class CoverStore extends FlayGroundDB {
  constructor() {
    super();
  }

  async select(opus) {
    await this.init();
    return await this.get(storeName, opus);
  }

  async update(opus, blob) {
    await this.init();
    const record = {
      opus: opus,
      blob: blob,
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
