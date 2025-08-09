import FlayGroundDB from '@flay/idb/ground/db/FlayGroundDB';
import { Actress } from '../../../../lib/FlayFetch';

const storeName = 'Actress';

export default class ActressStore extends FlayGroundDB {
  constructor() {
    super();
  }

  async select(name: string): Promise<Actress | undefined> {
    await this.init();
    return await this.get(storeName, name);
  }

  async update(actress: Actress) {
    await this.init();
    await this.put(storeName, actress);
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
