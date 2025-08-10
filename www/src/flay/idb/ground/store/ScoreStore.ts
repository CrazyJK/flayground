import FlayGroundDB from '@flay/idb/ground/db/FlayGroundDB';

const storeName = 'Score';

export default class ScoreStore extends FlayGroundDB {
  async select(opus: string): Promise<{ opus: string; score: number } | undefined> {
    await this.init();
    return await this.get(storeName, opus);
  }

  async update(opus: string, score: number) {
    await this.init();
    const record = {
      opus: opus,
      score: score,
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
