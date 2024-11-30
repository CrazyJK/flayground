import FlayGroundDB from '../db/FlayGroundDB';

const storeName = 'Score';

export default class ScoreStore extends FlayGroundDB {
  constructor() {
    super();
  }

  async select(opus) {
    await this.init();
    return await this.get(storeName, opus);
  }

  async update(opus, score) {
    await this.init();
    const record = {
      opus: opus,
      score: score,
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
