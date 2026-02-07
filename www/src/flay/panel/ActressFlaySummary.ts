import GroundFlay from '@base/GroundFlay';
import FlayMarker from '@flay/domain/FlayMarker';
import FlayFetch, { type Actress, type Flay } from '@lib/FlayFetch';
import { popupActress } from '@lib/FlaySearch';
import NumberUtils from '@lib/NumberUtils';
import favoriteSVG from '@svg/favorite';
import ApiClient from '../../lib/ApiClient';
import './ActressFlaySummary.scss';

/**
 * 배우별 Flay 집계 데이터 타입
 */
interface ActressFlayData {
  name: string;
  favorite: boolean;
  age: number;
  flayTotalCount: number;
  flayLikesCount: number;
  flayLikesSum: number;
  flayScoreSum: number;
  flayRankAvg: number;
  flayList: Flay[];
  firstFlay: Flay;
}

/**
 * 정렬 기준 타입
 */
type SortBy = 'count' | 'likes' | 'likes-sum' | 'rank' | 'score' | 'name' | 'age' | 'favorite';

/**
 * Unknown 배우 상수
 */
const UNKNOWN_ACTRESS: Actress = {
  name: 'Unknown',
  favorite: false,
  localName: 'Unknown',
  otherNames: [],
  birth: '',
  body: '',
  height: 0,
  debut: 0,
  comment: '',
  lastModified: 0,
  coverSize: 0,
};

/**
 * 기본 정렬 기준
 */
const DEFAULT_SORT_BY: SortBy = 'count';

/**
 * 에러 메시지
 */
const ERROR_MESSAGE = '데이터를 불러오는데 실패했습니다.';

/**
 * ActressFlaySummary 커스텀 엘리먼트 - 배우별 Flay 요약 정보를 제공하는 컴포넌트
 *
 * 배우별로 Flay 개수, 좋아요 수, 점수 등을 집계하여 정렬된 리스트 형태로 표시합니다.
 * 배우 이름을 클릭하면 해당 배우의 상세 정보 팝업이 표시됩니다.
 *
 * @class ActressFlaySummary
 * @extends {GroundFlay}
 *
 * @features
 * - 배우별 Flay 통계 (총 개수, 좋아요 개수, 좋아요 합계, 점수 합계, 평균 랭크)
 * - 정렬 기준 선택 가능 (총 개수, 좋아요 개수, 좋아요 합계, 평균 랭크, 점수 합계)
 * - Flay 정보가 없는 항목은 'Unknown' 배우로 분류
 * - FlayMarker를 통한 시각적 Flay 표시
 * - 배우 이름 클릭 시 배우 상세 정보 팝업
 * - 커버 이미지 토글 기능
 *
 * @example 기본 사용법
 * ```html
 * <actress-flay-summary></actress-flay-summary>
 * ```
 *
 * @customElement actress-flay-summary
 *
 * @since 2026
 * @author CrazyJK
 * @version 1.0.0
 */
export class ActressFlaySummary extends GroundFlay {
  /** 배우별 Flay 집계 데이터 */
  #actressFlayData: ActressFlayData[] = [];

  /**
   * DOM에 연결될 때 호출되는 Web Component 라이프사이클 메서드
   *
   * @override
   */
  connectedCallback(): void {
    this.#createMainContainer();
    void this.#prepareData();
  }

  /**
   * 메인 컨테이너 생성 및 이벤트 리스너 등록
   *
   * @private
   */
  #createMainContainer(): void {
    this.innerHTML = `
      <ul>
        <li class="header">
          <span class="name">
            <input type="radio" name="sorting" id="name" value="name" title="이름 기준 정렬" /><label for="name">Name</label>
            <span id="toggleCover">Cover</span>
          </span>
          <span class="favorite">
            <input type="radio" name="sorting" id="favorite" value="favorite" title="즐겨찾기 기준 정렬" /><label for="favorite">Fav.</label>
          </span>
          <span class="age">
            <input type="radio" name="sorting" id="age" value="age" title="나이 기준 정렬" /><label for="age">Age</label>
          </span>
          <span class="count">
            <input type="radio" name="sorting" id="count" value="count" title="총 개수 기준 정렬" checked /><label for="count">Total</label>
          </span>
          <span class="likes">
            <input type="radio" name="sorting" id="likes" value="likes" title="좋아요 개수 기준 정렬" /><label for="likes">Shot</label>
          </span>
          <span class="likes-sum">
            <input type="radio" name="sorting" id="likes-sum" value="likes-sum" title="좋아요 합계 기준 정렬" /><label for="likes-sum">Shots</label>
          </span>
          <span class="rank">
            <input type="radio" name="sorting" id="rank" value="rank" title="평균 랭크 기준 정렬" /><label for="rank">Rank</label>
          </span>
          <span class="score">
            <input type="radio" name="sorting" id="score" value="score" title="점수 합계 기준 정렬" /><label for="score">Score</label>
          </span>
          <span class="flay-marker">Flay</span>
        </li>
      </ul>`;

    // Cover 토글 이벤트
    this.querySelector('#toggleCover')!.addEventListener('click', () => {
      this.querySelector('ul')!.classList.toggle('cover');
    });

    // 소팅 라디오 이벤트
    this.querySelectorAll<HTMLInputElement>('input[name="sorting"]').forEach((radio) => {
      radio.addEventListener('change', () => {
        if (radio.checked) {
          this.#sortAndRender(radio.value as SortBy);
        }
      });
    });
  }

  /**
   * 에러 메시지 표시
   *
   * @private
   * @param {string} message - 에러 메시지
   */
  #showError(message: string): void {
    this.querySelector('ul')!.innerHTML = `<li class="error">${message}</li>`;
  }

  /**
   * 배우별 Flay 데이터 집계
   *
   * @private
   */
  async #prepareData(): Promise<void> {
    try {
      const fullyFlayList = await FlayFetch.getFullyFlayList();

      // 배우별로 Flay 그룹화 및 데이터 구축
      const actressFlayMap = fullyFlayList
        .flatMap(({ actress, flay }) => (actress.length > 0 ? actress.map((a) => ({ actress: a, flay })) : [{ actress: UNKNOWN_ACTRESS, flay }]))
        .reduce((map, { actress, flay }) => {
          const existing = map.get(actress.name);
          if (existing) {
            existing.flayList.push(flay);
          } else {
            map.set(actress.name, { actress, flayList: [flay] });
          }
          return map;
        }, new Map<string, { actress: Actress; flayList: Flay[] }>());

      this.#actressFlayData = Array.from(actressFlayMap.entries(), ([name, { actress, flayList }]) => {
        // Flay 정렬
        const sortedFlayList = flayList.sort((a, b) => {
          let diff = 0;
          if (diff === 0) diff = (b.video.likes?.length > 0 ? 1 : 0) - (a.video.likes?.length > 0 ? 1 : 0);
          if (diff === 0) diff = a.actressList.length - b.actressList.length;
          if (diff === 0) diff = b.score - a.score;
          if (diff === 0) diff = (b.video.likes?.length || 0) - (a.video.likes?.length || 0);
          if (diff === 0) diff = b.release.localeCompare(a.release);
          return diff;
        });

        const currentYear = new Date().getFullYear();
        const birthYear = parseInt((actress.birth || String(currentYear)).substring(0, 4));

        return {
          name,
          favorite: actress.favorite,
          age: currentYear - birthYear,
          flayTotalCount: sortedFlayList.length,
          flayLikesCount: sortedFlayList.filter((flay) => flay.video.likes?.length > 0).length,
          flayLikesSum: sortedFlayList.reduce((sum, flay) => sum + (flay.video.likes?.length || 0), 0),
          flayScoreSum: sortedFlayList.reduce((sum, flay) => sum + (flay.score || 0), 0),
          flayRankAvg: sortedFlayList.reduce((sum, flay) => sum + (flay.video.rank || 0), 0) / sortedFlayList.length,
          flayList: sortedFlayList,
          firstFlay: sortedFlayList[0]!,
        };
      });

      this.#sortAndRender(DEFAULT_SORT_BY);
    } catch (error) {
      console.error('Failed to prepare data:', error);
      this.#showError(ERROR_MESSAGE);
    }
  }

  /**
   * 정렬 기준에 따라 데이터를 정렬하고 렌더링
   *
   * @private
   * @param {SortBy} sortBy - 정렬 기준
   */
  #sortAndRender(sortBy: SortBy): void {
    // 배우 데이터 정렬
    this.#actressFlayData.sort((a, b) => {
      // 선택된 기준을 최우선으로
      let diff = 0;
      switch (sortBy) {
        case 'count':
          diff = b.flayTotalCount - a.flayTotalCount;
          break;
        case 'likes':
          diff = b.flayLikesCount - a.flayLikesCount;
          break;
        case 'likes-sum':
          diff = b.flayLikesSum - a.flayLikesSum;
          break;
        case 'rank':
          diff = b.flayRankAvg - a.flayRankAvg;
          break;
        case 'score':
          diff = b.flayScoreSum - a.flayScoreSum;
          break;
        case 'name':
          diff = a.name.localeCompare(b.name);
          break;
        case 'age':
          diff = b.age - a.age;
          break;
        case 'favorite':
          diff = Number(b.favorite) - Number(a.favorite);
          break;
      }

      // 나머지 기준들로 2차 정렬
      if (diff === 0) diff = b.flayScoreSum - a.flayScoreSum;
      if (diff === 0) diff = b.flayLikesSum - a.flayLikesSum;
      if (diff === 0) diff = b.flayLikesCount - a.flayLikesCount;
      if (diff === 0) diff = b.flayRankAvg - a.flayRankAvg;
      if (diff === 0) diff = b.flayTotalCount - a.flayTotalCount;
      if (diff === 0) diff = Number(b.favorite) - Number(a.favorite);
      if (diff === 0) diff = a.name.localeCompare(b.name);

      return diff;
    });

    this.#renderList();
  }

  /**
   * 배우 목록 렌더링
   *
   * @private
   */
  #renderList(): void {
    const ul = this.querySelector('ul')!;

    // 기존 리스트 항목 제거 (헤더 제외)
    ul.querySelectorAll('li:not(.header)').forEach((item) => item.remove());

    // 배우 목록 렌더링
    const fragment = document.createDocumentFragment();
    this.#actressFlayData.forEach((data) => {
      const { name, favorite, age, flayTotalCount, flayLikesCount, flayLikesSum, flayRankAvg, flayScoreSum, firstFlay, flayList } = data;

      const row = document.createElement('li');
      row.innerHTML = `
        <span class="name">${name}
          <img class="actress-cover" src="${ApiClient.buildUrl('/static/cover/' + firstFlay.opus)}" alt="${name} Cover" loading="lazy" />
        </span>
        <span class="favorite ${favorite ? 'favorite-true' : ''}">${favoriteSVG}</span>
        <span class="age">${age}</span>
        <span class="count">${NumberUtils.formatWithCommas(flayTotalCount)}</span>
        <span class="likes">${NumberUtils.formatWithCommas(flayLikesCount)}</span>
        <span class="likes-sum">${NumberUtils.formatWithCommas(flayLikesSum)}</span>
        <span class="rank">${flayRankAvg.toFixed(1)}</span>
        <span class="score">${NumberUtils.formatWithCommas(flayScoreSum)}</span>
        <span class="flay-marker"></span>`;

      // FlayMarker 생성 및 추가
      const flayMarkers = flayList.map((flay) => new FlayMarker(flay));
      row.querySelector('.flay-marker')!.append(...flayMarkers);

      // 배우 이름 클릭 이벤트
      row.querySelector('.name')!.addEventListener('click', () => popupActress(name));

      fragment.appendChild(row);
    });

    ul.appendChild(fragment);
  }
}

customElements.define('actress-flay-summary', ActressFlaySummary);
