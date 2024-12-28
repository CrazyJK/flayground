import FlayFetch from '../../lib/FlayFetch';
import FlayStorage from '../../lib/FlayStorage';
import favoriteSVG from '../../svg/favorite';
import noFavoriteSVG from '../../svg/noFavorite';
import rankSVG from '../../svg/ranks';
import subtitlesSVG from '../../svg/subtitles';
import './FlayCondition.scss';

const DEFAULT_CONDITION = {
  search: '',
  withSubtitles: false,
  withFavorite: false,
  withNoFavorite: false,
  rank: ['0'],
  sort: 'RELEASE',
};
const RANKS = [0, 1, 2, 3, 4, 5];
const SORTS = ['STUDIO', 'OPUS', 'TITLE', 'ACTRESS', 'RELEASE', 'PLAY', 'RANK', 'LAST PLAY', 'LAST ACCESS', 'LAST MODIFIED', 'SCORE', 'LENGTH', 'SHOT'];

export default class FlayCondition extends HTMLDivElement {
  opusList = [];

  constructor() {
    super();

    const condition = FlayStorage.local.getObject('FlayCondition.condition', JSON.stringify(DEFAULT_CONDITION));

    this.classList.add('flay-condition', 'flay-div');
    this.innerHTML = `
      <div>
        <input type="search" id="search" list="search-items" placeholder="Search" spellcheck="false" autocomplete="off">
        <datalist id="search-items"></datalist>
      </div>
      <div>
        <input type="checkbox" id="withSubtitles" ${condition.withSubtitles ? 'checked' : ''}>
        <label for="withSubtitles" title="with Subtitles">${subtitlesSVG}</label>
      </div>
      <div>
        <input type="checkbox" id="withFavorite" ${condition.withFavorite ? 'checked' : ''}>
        <label for="withFavorite" title="with Favorite">${favoriteSVG}</label>
        <input type="checkbox" id="withNoFavorite" ${condition.withNoFavorite ? 'checked' : ''}>
        <label for="withNoFavorite" title="with No Favorite">${noFavoriteSVG}</label>
      </div>
      <div>
        ${RANKS.map((r) => `<input type="checkbox" name="rank" value="${r}" id="rank${r}" ${condition.rank.includes(String(r)) ? 'checked' : ''}><label for="rank${r}" title="Rank ${r}">${rankSVG[r + 1]}</label>`).join('')}
      </div>
      <div>
        <select id="sort" title="Sort method">
          ${SORTS.map((opt) => `<option value="${opt.replace(/ /gi, '')}" ${condition.sort === opt ? 'selected' : ''}>${opt.toLowerCase()}</option>`).join('')}
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
      rank: Array.from(this.querySelectorAll('[name="rank"]'))
        .filter((rank) => rank.checked)
        .map((rank) => rank.value),
      sort: this.querySelector('#sort').value,
    };
    this.opusList = await FlayFetch.getOpusList(condition);
    if (this.opusList.length === 0) {
      // not found flay
      this.animate([{ backgroundColor: '#f00' }, { backgroundColor: 'transparent' }], { duration: 1000, iterations: 1 });
      window.emitMessage('검색 결과가 없습니다.');
    }
    this.dispatchEvent(new CustomEvent('fetch'));
    FlayStorage.local.set('FlayCondition.condition', JSON.stringify(condition));
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

  #addSearchItem(item) {
    this.querySelector(`#search-items option[value="${item}"]`)?.remove();

    const option = document.createElement('option');
    option.value = item;
    this.querySelector('#search-items').prepend(option);

    this.querySelectorAll('#search-items option').forEach((option, i) => i > 30 && option.remove());
  }
}

customElements.define('flay-condition', FlayCondition, { extends: 'div' });
