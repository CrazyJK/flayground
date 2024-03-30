import { OpusProvider } from './OpusProvider';

export class FlayProvider extends OpusProvider {
  opus;

  constructor() {
    super();
    this.opus = null;
  }

  async #returnData() {
    const fully = await fetch(`/flay/${this.opus}/fully`).then((res) => res.json());
    return {
      index: this.opusIndex,
      total: this.opusList.length,
      opus: this.opus,
      flay: fully.flay,
      actress: fully.actress,
    };
  }

  async get(opus) {
    const index = this.getIndex(opus);
    this.opus = this.getOpus(index);
    return await this.#returnData();
  }

  async random() {
    this.opus = this.getRandomOpus();
    return await this.#returnData();
  }

  async next() {
    this.opus = this.getNextOpus();
    return await this.#returnData();
  }

  async prev() {
    this.opus = this.getPrevOpus();
    return await this.#returnData();
  }
}
