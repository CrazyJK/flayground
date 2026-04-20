import FlayGroundDB from '@flay/idb/ground/db/FlayGroundDB';
import { FlayHistory } from '@lib/FlayFetch';

const storeName = 'History';

export default class HistoryStore extends FlayGroundDB {
  async select(opus: string): Promise<{ opus: string; histories: FlayHistory[] } | undefined> {
    await this.init();
    return await this.get(storeName, opus);
  }

  async update(opus: string, histories: FlayHistory[]) {
    await this.init();
    const record = {
      opus: opus,
      histories: histories,
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
