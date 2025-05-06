import FlayFetch from '@lib/FlayFetch';
import FlayStorage from '@lib/FlayStorage';
import favoriteSVG from '@svg/favorite';
import noFavoriteSVG from '@svg/noFavorite';
import rankSVG from '@svg/ranks';
import subtitlesSVG from '@svg/subtitles';
import './FlayCondition.scss';

const CONDITION_KEY = 'FlayCondition.condition';
const CONDITION_VALUE_DEFAULT = {
  search: '',
  withSubtitles: false,
  withFavorite: false,
  withNoFavorite: false,
  rank: ['0'],
  sort: 'RELEASE',
};
const RANKs = [0, 1, 2, 3, 4, 5];
const SORTs = ['STUDIO', 'OPUS', 'TITLE', 'ACTRESS', 'RELEASE', 'PLAY', 'RANK', 'LASTPLAY', 'LASTACCESS', 'LASTMODIFIED', 'SCORE', 'LENGTH', 'SHOT'];
const ifTrue = (condition, text) => (condition ? text : '');

export default class FlayCondition extends HTMLDivElement {
  opusList = [];

  constructor() {
    super();

    const condition = FlayStorage.local.getObject(CONDITION_KEY, CONDITION_VALUE_DEFAULT);

    this.classList.add('flay-condition', 'flay-div');
    this.innerHTML = `
      <div>
        <input type="search" id="search" list="search-items" placeholder="Search" spellcheck="false" autocomplete="off">
        <datalist id="search-items"></datalist>
      </div>
      <div>
        <input type="checkbox" id="withSubtitles" ${ifTrue(condition.withSubtitles, 'checked')}><label for="withSubtitles" title="with Subtitles">${subtitlesSVG}</label>
      </div>
      <div>
        <input type="checkbox" id="withFavorite" ${ifTrue(condition.withFavorite, 'checked')}><label for="withFavorite" title="with Favorite">${favoriteSVG}</label>
        <input type="checkbox" id="withNoFavorite" ${ifTrue(condition.withNoFavorite, 'checked')}><label for="withNoFavorite" title="with No Favorite">${noFavoriteSVG}</label>
      </div>
      <div>
        ${RANKs.map((r) => `<input type="checkbox" name="rank" value="${r}" id="rank${r}" ${ifTrue(condition.rank.includes(String(r)), 'checked')}><label for="rank${r}" title="Rank ${r}">${rankSVG[r + 1]}</label>`).join('')}
      </div>
      <div>
        <select id="sort" title="Sort method">
          ${SORTs.map((opt) => `<option value="${opt}" ${ifTrue(condition.sort === opt, 'selected')}>${opt.replace(/LAST/gi, 'LAST ').toLowerCase()}</option>`).join('')}
        </select>
      </div>
    `;
    this.querySelector('#search').addEventListener('keyup', (e) => e.stopPropagation());
    this.addEventListener('change', () => this.#fetch());
  }

  connectedCallback() {
    this.#fetch();
  }

  /**
   * 조건에 맞는 opus 목록
   */
  async #fetch() {
    const condition = {
      search: this.querySelector('#search').value,
      withSubtitles: this.querySelector('#withSubtitles').checked,
      withFavorite: this.querySelector('#withFavorite').checked,
      withNoFavorite: this.querySelector('#withNoFavorite').checked,
      rank: Array.from(this.querySelectorAll('[name="rank"]:checked')).map((rank) => rank.value),
      sort: this.querySelector('#sort').value,
    };
    this.opusList = await FlayFetch.getOpusList(condition);
    if (this.opusList.length === 0) {
      // not found flay
      this.animate([{ backgroundColor: '#f00' }, { backgroundColor: 'transparent' }], { duration: 1000, iterations: 1 });
      window.emitMessage('검색 결과가 없습니다.');
    }
    FlayStorage.local.set(CONDITION_KEY, JSON.stringify(condition));
    this.dispatchEvent(new CustomEvent('fetch'));
  }

  /**
   * 검색을 위한 datalist option 추가
   * @param {Flay} flay
   */
  updateSearchItem(flay) {
    flay.video.tags?.forEach((tag) => this.#addSearchItem(tag.name));
    flay.actressList?.forEach((name) => this.#addSearchItem(name));
    this.#addSearchItem(flay.release.substring(0, 4));
    this.#addSearchItem(flay.opus.split('-').shift());
    // this.#addSearchItem(flay.opus);
    this.#addSearchItem(flay.studio);
  }

  /**
   * datalist에 option 채우기
   * @param {string} item
   */
  #addSearchItem(item) {
    this.querySelector(`#search-items option[value="${item}"]`)?.remove();

    const option = document.createElement('option');
    option.value = item;
    this.querySelector('#search-items').prepend(option);

    this.querySelectorAll('#search-items option').forEach((option, i) => i > 30 && option.remove());
  }
}

customElements.define('flay-condition', FlayCondition, { extends: 'div' });
