import { getRandomInt } from '../util/randomNumber';

const DEFAULT_CONDITION = {
  search: '',
  withSubtitles: false,
  withFavorite: false,
  withNoFavorite: false,
  rank: [],
  sort: 'RELEASE',
};

export class OpusProvider {
  opusList;
  opusIndex;
  opusIndexes;
  condition;

  constructor(opts) {
    this.setCondition(opts);
  }

  setCondition(condition) {
    this.condition = Object.assign(DEFAULT_CONDITION, condition);
    this.setOpusList(null);
  }

  setOpusList(list) {
    console.log('setOpusList', list);
    this.opusList = list;
    this.opusIndex = -1;
    this.opusIndexes = [];
  }

  async #fetchOpusList() {
    console.log('fetchOpusList', this.opusList);
    if (this.opusList === null)
      this.opusList = await fetch('/flay/list/opus', {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.condition),
      }).then((res) => res.json());
  }

  async getRandomOpus() {
    await this.#fetchOpusList();
    if (this.opusIndexes.length === 0) {
      this.opusIndexes.push(...Array.from({ length: this.opusList.length }, (v, i) => i));
    }
    this.opusIndex = this.opusIndexes.splice(getRandomInt(0, this.opusIndexes.length), 1)[0];
    return this.opusList[this.opusIndex];
  }

  async getNextOpus() {
    await this.#fetchOpusList();
    ++this.opusIndex;
    if (this.opusIndex === this.opusList.length) {
      this.opusIndex = 0;
    }
    if (this.opusIndexes.includes(this.opusIndex)) {
      this.opusIndexes.splice(this.opusIndexes.indexOf(this.opusIndex), 1);
    }
    return this.opusList[this.opusIndex];
  }

  async getPrevOpus() {
    await this.#fetchOpusList();
    --this.opusIndex;
    if (this.opusIndex === -1) {
      this.opusIndex = this.opusList.length - 1;
    }
    if (this.opusIndexes.includes(this.opusIndex)) {
      this.opusIndexes.splice(this.opusIndexes.indexOf(this.opusIndex), 1);
    }
    return this.opusList[this.opusIndex];
  }

  async getcurrentOpus() {
    await this.#fetchOpusList();
    return this.opusList[this.opusIndex];
  }

  async getOpus(index) {
    await this.#fetchOpusList();
    this.opusIndex = Math.max(index, 0);
    this.opusIndex = Math.min(index, this.opusList.length - 1);
    return this.opusList[this.opusIndex];
  }

  async getIndex(opus) {
    await this.#fetchOpusList();
    if (this.opusList.includes(opus)) {
      this.opusIndex = this.opusList.indexOf(opus);
      return this.opusIndex;
    } else {
      return -1;
    }
  }

  get size() {
    return this.opusList.length;
  }
}
