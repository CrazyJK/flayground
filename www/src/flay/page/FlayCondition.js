import SVG from '../../svg/SVG';
import FlayStorage from '../../util/FlayStorage';
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
const SORTS = ['STUDIO', 'OPUS', 'TITLE', 'ACTRESS', 'RELEASE', 'PLAY', 'RANK', 'LASTPLAY', 'LASTACCESS', 'LASTMODIFIED', 'SCORE', 'LENGTH', 'SHOT'];

export default class FlayCondition extends HTMLElement {
  opusList = [];

  constructor() {
    super();

    this.attachShadow({ mode: 'open' });

    const link = this.shadowRoot.appendChild(document.createElement('link'));
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = 'style.css';

    const condition = FlayStorage.local.getObject('FlayCondition.condition', JSON.stringify(DEFAULT_CONDITION));
    const WRAPPER = this.shadowRoot.appendChild(document.createElement('div'));
    WRAPPER.classList.add(this.tagName.toLowerCase());
    WRAPPER.innerHTML = `
      <div>
        <input type="search" id="search" list="search-items" placeholder="Search" spellcheck="false">
        <datalist id="search-items"></datalist>
      </div>
      <div>
        <input type="checkbox" id="withSubtitles" ${condition.withSubtitles ? 'checked' : ''}>
        <label for="withSubtitles" title="with Subtitles">${SVG.subtitles}</label>
      </div>
      <div>
        <input type="checkbox" id="withFavorite" ${condition.withFavorite ? 'checked' : ''}>
        <label for="withFavorite" title="with Favorite">${SVG.favorite}</label>
        <input type="checkbox" id="withNoFavorite" ${condition.withNoFavorite ? 'checked' : ''}>
        <label for="withNoFavorite" title="with No Favorite">${SVG.noFavorite}</label>
      </div>
      <div>
        ${RANKS.map((r) => `<input type="checkbox" name="rank" value="${r}" id="rank${r}" ${condition.rank.includes(String(r)) ? 'checked' : ''}><label for="rank${r}" title="Rank ${r}">${SVG.rank[r + 1]}</label>`).join('')}
      </div>
      <div>
        <select id="sort" title="Sort method">
          ${SORTS.map((opt) => `<option value="${opt}" ${condition.sort === opt ? 'selected' : ''}>${opt.toLowerCase()}</option>`).join('')}
        </select>
      </div>
    `;
    WRAPPER.addEventListener('change', () => this.#fetch());
  }

  connectedCallback() {
    this.#fetch();
  }

  /**
   * 조건에 맞는 opus 목록
   */
  async #fetch() {
    const condition = {
      search: this.shadowRoot.querySelector('#search').value,
      withSubtitles: this.shadowRoot.querySelector('#withSubtitles').checked,
      withFavorite: this.shadowRoot.querySelector('#withFavorite').checked,
      withNoFavorite: this.shadowRoot.querySelector('#withNoFavorite').checked,
      rank: Array.from(this.shadowRoot.querySelectorAll('[name="rank"]'))
        .filter((rank) => rank.checked)
        .map((rank) => rank.value),
      sort: this.shadowRoot.querySelector('#sort').value,
    };
    this.opusList = await fetch('/flay/list/opus', { method: 'post', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(condition) }).then((res) => res.json());
    if (this.opusList.length === 0) {
      // not found flay
      this.shadowRoot.querySelector('.' + this.tagName.toLowerCase()).animate([{ backgroundColor: '#f00' }, { backgroundColor: 'transparent' }], { duration: 1000, iterations: 1 });
    }
    this.dispatchEvent(new Event('change'));
    FlayStorage.local.set('FlayCondition.condition', JSON.stringify(condition));
  }

  /**
   * 검색을 위한 datalist option 추가
   * @param {Flay} flay
   */
  updateSearchItem(flay) {
    this.#addSearchItem(flay.studio);
    this.#addSearchItem(flay.opus);
    this.#addSearchItem(flay.opus.split('-').shift());
    this.#addSearchItem(flay.release.substring(0, 4));

    flay.actressList?.forEach((name) => this.#addSearchItem(name));
    flay.video.tags?.forEach((tag) => this.#addSearchItem(tag.name));
  }

  #addSearchItem(item) {
    this.shadowRoot.querySelector(`#search-items option[value="${item}"]`)?.remove();

    const option = document.createElement('option');
    option.value = item;
    this.shadowRoot.querySelector('#search-items').prepend(option);
  }
}

customElements.define('flay-condition', FlayCondition);
