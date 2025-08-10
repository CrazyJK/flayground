import FlayGroundDB from '@flay/idb/ground/db/FlayGroundDB';

const storeName = 'Cover';

export default class CoverStore extends FlayGroundDB {
  async select(opus: string): Promise<{ opus: string; blob: Blob } | undefined> {
    await this.init();
    return await this.get(storeName, opus);
  }

  async update(opus: string, blob: Blob) {
    await this.init();
    const record = {
      opus: opus,
      blob: blob,
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
