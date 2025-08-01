import FlayGroundDB from '@flay/idb/ground/db/FlayGroundDB';

const storeName = 'Actress';

export default class ActressStore extends FlayGroundDB {
  constructor() {
    super();
  }

  async select(name) {
    await this.init();
    return await this.get(storeName, name);
  }

  async update(actress) {
    await this.init();
    await this.put(storeName, actress);
  }

  async remove(name) {
    await this.init();
    await this.delete(storeName, name);
  }

  async removeAll() {
    await this.init();
    await this.clear(storeName);
  }
}
