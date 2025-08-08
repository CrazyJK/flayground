import FlayFetch, { Flay, SearchCondition } from '@lib/FlayFetch';
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
  rank: [0],
  sort: 'RELEASE',
} as Partial<SearchCondition>;

const RANKs = [0, 1, 2, 3, 4, 5] as const;
const SORTs = ['STUDIO', 'OPUS', 'TITLE', 'ACTRESS', 'RELEASE', 'PLAY', 'RANK', 'LASTPLAY', 'LASTACCESS', 'LASTMODIFIED', 'SCORE', 'LENGTH', 'SHOT'] as const;
const ifTrue = (condition: boolean, text: string): string => (condition ? text : '');

export default class FlayCondition extends HTMLElement {
  /** 조건에 맞는 opus 목록 */
  opusList: string[] = [];

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
        ${RANKs.map((r) => `<input type="checkbox" name="rank" value="${r}" id="rank${r}" ${ifTrue(condition.rank.includes(r), 'checked')}><label for="rank${r}" title="Rank ${r}">${rankSVG[r + 1]}</label>`).join('')}
      </div>
      <div>
        <select id="sort" title="Sort method">
          ${SORTs.map((opt) => `<option value="${opt}" ${ifTrue(condition.sort === opt, 'selected')}>${opt.replace(/LAST/gi, 'LAST ').toLowerCase()}</option>`).join('')}
        </select>
      </div>
    `;
    const searchInput = this.querySelector('#search') as HTMLInputElement;
    searchInput?.addEventListener('keyup', (e: KeyboardEvent) => e.stopPropagation());
    this.addEventListener('change', () => this.#fetch());
  }

  connectedCallback() {
    this.#fetch();
  }

  /**
   * 조건에 맞는 opus 목록
   */
  async #fetch(): Promise<void> {
    const searchInput = this.querySelector('#search') as HTMLInputElement;
    const subtitlesInput = this.querySelector('#withSubtitles') as HTMLInputElement;
    const favoriteInput = this.querySelector('#withFavorite') as HTMLInputElement;
    const noFavoriteInput = this.querySelector('#withNoFavorite') as HTMLInputElement;
    const rankInputs = Array.from(this.querySelectorAll('[name="rank"]:checked')) as HTMLInputElement[];
    const sortSelect = this.querySelector('#sort') as HTMLSelectElement;

    const condition: Partial<SearchCondition> = {
      search: searchInput?.value || '',
      withSubtitles: subtitlesInput?.checked || false,
      withFavorite: favoriteInput?.checked || false,
      withNoFavorite: noFavoriteInput?.checked || false,
      rank: rankInputs.map((rank: HTMLInputElement) => Number(rank.value)),
      sort: sortSelect?.value || 'RELEASE',
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
  updateSearchItem(flay: Flay): void {
    if (!flay) return;

    flay.video?.tags?.forEach((tag) => this.#addSearchItem(tag.name));
    flay.actressList?.forEach((name) => this.#addSearchItem(name));

    if (flay.release) {
      this.#addSearchItem(flay.release.substring(0, 4));
    }

    if (flay.opus) {
      const studioCode = flay.opus.split('-').shift();
      if (studioCode) {
        this.#addSearchItem(studioCode);
      }
    }

    if (flay.studio) {
      this.#addSearchItem(flay.studio);
    }
  }

  /**
   * datalist에 option 채우기
   * @param {string} item
   */
  #addSearchItem(item: string): void {
    if (!item || item.trim() === '') return;

    this.querySelector(`#search-items option[value="${item}"]`)?.remove();

    const option = document.createElement('option');
    option.value = item;
    const searchItems = this.querySelector('#search-items') as HTMLDataListElement;
    searchItems?.prepend(option);

    const options = Array.from(this.querySelectorAll('#search-items option')) as HTMLOptionElement[];
    options.forEach((option, i) => i > 30 && option.remove());
  }
}

customElements.define('flay-condition', FlayCondition);
