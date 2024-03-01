import { getRandomInt } from '../util/randomNumber';

export class FlayProvider {
  constructor() {
    this.opusList = [];
    this.opusIndexes = [];
    this.opusIndex = -1;
    this.opus = null;
  }

  async init(condition) {
    this.condition = Object.assign(
      {
        search: '',
        withSubtitles: false,
        withFavorite: false,
        withNoFavorite: false,
        rank: [],
        sort: 'RELEASE',
      },
      condition
    );
    this.opusList = await fetch('/flay/list/opus', { method: 'post', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(this.condition) }).then((res) => res.json());
    this.opusIndex = getRandomInt(0, this.opusList.length);
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
    this.opusIndex = this.opusList.indexOf(opus);
    if (this.opusIndex === -1) {
      throw new Error('notfound opus: ' + opus);
    }
    if (this.opusIndexes.indexOf(this.opusIndex) > -1) {
      this.opusIndexes.splice(this.opusIndexes.indexOf(this.opusIndex), 1);
    }
    this.opus = this.opusList[this.opusIndex];
    return await this.#returnData();
  }

  async random() {
    if (this.opusIndexes.length === 0) this.opusIndexes.push(...Array.from({ length: this.opusList.length }, (v, i) => i));
    this.opusIndex = this.opusIndexes.splice(getRandomInt(0, this.opusIndexes.length), 1)[0];
    this.opus = this.opusList[this.opusIndex];
    return await this.#returnData();
  }

  async next() {
    ++this.opusIndex;
    if (this.opusIndex === this.opusList.length) {
      this.opusIndex = 0;
    }
    if (this.opusIndexes.indexOf(this.opusIndex) > -1) {
      this.opusIndexes.splice(this.opusIndexes.indexOf(this.opusIndex), 1);
    }
    this.opus = this.opusList[this.opusIndex];
    return await this.#returnData();
  }

  async prev() {
    --this.opusIndex;
    if (this.opusIndex < 0) {
      this.opusIndex = this.opusList.length - 1;
    }
    if (this.opusIndexes.indexOf(this.opusIndex) > -1) {
      this.opusIndexes.splice(this.opusIndexes.indexOf(this.opusIndex), 1);
    }
    this.opus = this.opusList[this.opusIndex];
    return await this.#returnData();
  }
}
