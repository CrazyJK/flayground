import FlayFetch from './FlayFetch';
import { OpusProvider } from './OpusProvider';

export class FlayProvider extends OpusProvider {
  opus;

  constructor(opts) {
    super(opts);
    this.opus = null;
  }

  async #returnData() {
    const { flay, actress } = await FlayFetch.getFlayActress(this.opus);
    return {
      index: this.opusIndex,
      total: this.opusList.length,
      opus: this.opus,
      flay: flay,
      actress: actress,
    };
  }

  async get(opus) {
    const index = await this.getIndex(opus);
    this.opus = await this.getOpus(index);
    return await this.#returnData();
  }

  async random() {
    this.opus = await this.getRandomOpus();
    return await this.#returnData();
  }

  async next() {
    this.opus = await this.getNextOpus();
    return await this.#returnData();
  }

  async prev() {
    this.opus = await this.getPrevOpus();
    return await this.#returnData();
  }
}
