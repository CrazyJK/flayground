import GroundFlay from '@base/GroundFlay';
import FlayFetch, { Flay, SearchCondition } from '@lib/FlayFetch';
import FlayStorage from '@lib/FlayStorage';
import favoriteSVG from '@svg/favorite';
import noFavoriteSVG from '@svg/noFavorite';
import rankSVG from '@svg/ranks';
import subtitlesSVG from '@svg/subtitles';
import './FlayCondition.scss';

// 타입 정의 추가
declare global {
  interface Window {
    emitMessage?: (...datas: unknown[]) => void;
  }
}

const CONDITION_KEY = 'FlayCondition.condition';
const CONDITION_VALUE_DEFAULT = {
  search: '',
  withSubtitles: false,
  withFavorite: false,
  withNoFavorite: false,
  rank: [0],
  sort: 'RELEASE',
} as SearchCondition;

const RANKs = [0, 1, 2, 3, 4, 5] as const;
const SORTs = ['STUDIO', 'OPUS', 'TITLE', 'ACTRESS', 'RELEASE', 'PLAY', 'RANK', 'LASTPLAY', 'LASTACCESS', 'LASTMODIFIED', 'SCORE', 'LENGTH', 'SHOT'] as const;
const ifTrue = (condition: boolean, text: string): string => (condition ? text : '');

export default class FlayCondition extends GroundFlay {
  /** 조건에 맞는 opus 목록 */
  opusList: string[] = [];

  constructor() {
    super();

    const condition = FlayStorage.local.getObject(CONDITION_KEY, CONDITION_VALUE_DEFAULT);

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
    this.#fetch().catch((error: unknown) => {
      console.error('Error fetching conditions:', error);
    });
  }

  /**
   * 조건에 맞는 opus 목록
   */
  async #fetch(): Promise<void> {
    const searchInput = this.querySelector('#search') as HTMLInputElement;
    const subtitlesInput = this.querySelector('#withSubtitles') as HTMLInputElement;
    const favoriteInput = this.querySelector('#withFavorite') as HTMLInputElement;
    const noFavoriteInput = this.querySelector('#withNoFavorite') as HTMLInputElement;
    const rankInputs = Array.from(this.querySelectorAll('input[name="rank"]:checked'));
    const sortSelect = this.querySelector('#sort') as HTMLSelectElement;

    if (!searchInput || !subtitlesInput || !favoriteInput || !noFavoriteInput || !sortSelect) {
      console.error('Required form elements not found');
      return;
    }

    const condition: Partial<SearchCondition> = {
      search: searchInput.value || '',
      withSubtitles: subtitlesInput.checked || false,
      withFavorite: favoriteInput.checked || false,
      withNoFavorite: noFavoriteInput.checked || false,
      rank: rankInputs.map((rank) => Number((rank as HTMLInputElement).value)),
      sort: sortSelect.value || 'RELEASE',
    };

    this.opusList = await FlayFetch.getOpusList(condition);

    if (this.opusList.length === 0) {
      // not found flay
      this.animate([{ backgroundColor: '#f00' }, { backgroundColor: 'transparent' }], { duration: 1000, iterations: 1 });
      if (window.emitMessage) {
        window.emitMessage('검색 결과가 없습니다.');
      } else {
        console.warn('검색 결과가 없습니다.');
      }
    }

    FlayStorage.local.set(CONDITION_KEY, JSON.stringify(condition));
    this.dispatchEvent(new CustomEvent('fetch'));
    this.#setDatalist();
  }

  /**
   * 검색 자동완성을 위한 datalist 설정
   */
  #setDatalist(): void {
    const searchItems = this.querySelector('#search-items') as HTMLDataListElement;
    if (!searchItems) return;
    searchItems.textContent = '';

    FlayFetch.getFlayList(...this.opusList)
      .then((flayList) => {
        const actressCount = this.#extractActressCount(flayList);
        const tagCount = this.#extractTagCount(flayList);

        this.#populateDatalistOptions(searchItems, actressCount);
        this.#populateDatalistOptions(searchItems, tagCount);
      })
      .catch(console.error);
  }

  /**
   * Flay 목록에서 배우별 작품 수를 추출
   * @param flayList - Flay 목록
   * @returns 배우별 작품 수 객체
   */
  #extractActressCount(flayList: Flay[]): Record<string, number> {
    return flayList.reduce(
      (actressCount, flay) => {
        flay.actressList?.forEach((actress) => {
          actressCount[actress] = (actressCount[actress] ?? 0) + 1;
        });
        return actressCount;
      },
      {} as Record<string, number>
    );
  }

  /**
   * Flay 목록에서 태그별 작품 수를 추출
   * @param flayList - Flay 목록
   * @returns 태그별 작품 수 객체
   */
  #extractTagCount(flayList: Flay[]): Record<string, number> {
    return flayList.reduce(
      (tagCount, flay) => {
        flay.video?.tags?.forEach((tag) => {
          tagCount[tag.name] = (tagCount[tag.name] ?? 0) + 1;
        });
        return tagCount;
      },
      {} as Record<string, number>
    );
  }

  /**
   * datalist에 옵션을 추가
   * @param searchItems - datalist 요소
   * @param itemCount - 아이템별 개수 객체
   */
  #populateDatalistOptions(searchItems: HTMLDataListElement, itemCount: Record<string, number>): void {
    Object.entries(itemCount).forEach(([name, _count]) => {
      const option = document.createElement('option');
      option.value = name;
      // option.label = `${name} (${count})`;
      searchItems.appendChild(option);
    });
  }
}

customElements.define('flay-condition', FlayCondition);
