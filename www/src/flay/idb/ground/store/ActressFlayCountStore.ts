import FlayGroundDB from '@flay/idb/ground/db/FlayGroundDB';

const storeName = 'ActressFlayCount';

export default class ActressFlayCountStore extends FlayGroundDB {
  constructor() {
    super();
  }

  async select(name: string) {
    await this.init();
    return await this.get(storeName, name);
  }

  async update(name: string, flayCount: number) {
    await this.init();
    const record = {
      name: name,
      flayCount: flayCount,
    };
    await this.put(storeName, record);
    return record;
  }

  async remove(name: string) {
    await this.init();
    await this.delete(storeName, name);
  }

  async removeAll() {
    await this.init();
    await this.clear(storeName);
  }
}
