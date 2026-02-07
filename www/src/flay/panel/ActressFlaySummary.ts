import GroundFlay from '@base/GroundFlay';
import FlayMarker from '@flay/domain/FlayMarker';
import FlayFetch, { type Actress, type Flay } from '@lib/FlayFetch';
import { popupActress } from '@lib/FlaySearch';
import NumberUtils from '@lib/NumberUtils';
import favoriteSVG from '@svg/favorite';
import ApiClient from '../../lib/ApiClient';
import './ActressFlaySummary.scss';

/**
 * ActressFlaySummary 커스텀 엘리먼트 - 배우별 Flay 요약 정보를 제공하는 컴포넌트
 *
 * 배우별로 Flay 개수, 좋아요 수, 점수 등을 집계하여 정렬된 테이블 형태로 표시합니다.
 * 배우 이름을 클릭하면 해당 배우의 상세 정보 팝업이 표시됩니다.
 *
 * @class ActressFlaySummary
 * @extends {GroundFlay}
 *
 * @features
 * - 배우별 Flay 통계 (총 개수, 좋아요 개수, 좋아요 합계, 점수 합계)
 * - 정렬 기준: 점수 합계 > 좋아요 합계 > 좋아요 개수 > 총 개수 > 즐겨찾기 > 이름
 * - Flay 정보가 없는 항목은 'Unknown' 배우로 분류
 * - FlayMarker를 통한 시각적 Flay 표시
 * - 배우 이름 클릭 시 배우 상세 정보 팝업
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
  #actressFlayData: Array<{
    name: string;
    favorite: boolean;
    age: number;
    flayTotalCount: number;
    flayLikesCount: number;
    flayLikesSum: number;
    flayScoreSum: number;
    flayRankAvg: number;
    flayList: Flay[];
  }> = [];

  /**
   * DOM에 연결될 때 호출되는 Web Component 라이프사이클 메서드
   * 컴포넌트 초기화, 데이터 로드 및 렌더링을 순차적으로 실행합니다.
   *
   * @override
   * @memberof ActressFlaySummary
   */
  connectedCallback(): void {
    this.#createMainContainer();
    void this.#initialize();
  }

  /**
   * 메인 컨테이너 생성
   *
   * @private
   */
  #createMainContainer(): void {
    this.innerHTML = `
      <ul>
        <li class="header">
          <span class="name">Actress <span id="toggleCover">Cover</span></span>
          <span class="favorite">Fav.</span>
          <span class="age">Age</span>
          <span class="count">Total</span>
          <span class="likes">Shot</span>
          <span class="likes-sum">Shots</span>
          <span class="rank">Rank</span>
          <span class="score">Score</span>
          <span class="flay-marker">Flay
            <input type="radio" name="sorting" id="count" value="count" title="총 개수 기준 정렬" checked /><label for="count">Total</label>
            <input type="radio" name="sorting" id="likes" value="likes" title="좋아요 개수 기준 정렬" /><label for="likes">Shot</label>
            <input type="radio" name="sorting" id="likes-sum" value="likes-sum" title="좋아요 합계 기준 정렬" /><label for="likes-sum">Shots</label>
            <input type="radio" name="sorting" id="rank" value="rank" title="평균 랭크 기준 정렬" /><label for="rank">Rank</label>
            <input type="radio" name="sorting" id="score" value="score" title="점수 합계 기준 정렬" /><label for="score">Score</label>
          </span>
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
          this.#sortAndRender(radio.value as 'count' | 'likes' | 'likes-sum' | 'rank' | 'score');
        }
      });
    });
  }

  /**
   * 컴포넌트 초기화 및 데이터 로드
   *
   * @private
   */
  async #initialize(): Promise<void> {
    try {
      const fullyFlayList = await FlayFetch.getFullyFlayList();
      this.#prepareData(fullyFlayList);
      this.#sortAndRender('count'); // 기본 정렬 기준
    } catch (error) {
      console.error('Failed to load flay list:', error);
      this.querySelector('ul')!.innerHTML = '<li class="error">데이터를 불러오는데 실패했습니다.</li>';
    }
  }

  /**
   * 배우별 Flay 데이터 집계
   *
   * @private
   * @param {Array<{actress: Actress[], flay: Flay}>} fullyFlayList - 배우와 Flay 정보를 포함한 전체 목록
   */
  #prepareData(fullyFlayList: Array<{ actress: Actress[]; flay: Flay }>): void {
    // Unknown 배우 정의
    const unknownActress: Actress = {
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

    // 배우별로 Flay 집계
    this.#actressFlayData = Array.from(
      fullyFlayList
        .flatMap(({ actress, flay }) => (actress.length > 0 ? actress.map((a) => ({ actress: a, flay })) : [{ actress: unknownActress, flay }]))
        .reduce((map, { actress, flay }) => {
          const existing = map.get(actress.name);
          if (existing) {
            existing.flayList.push(flay);
          } else {
            map.set(actress.name, { actress, flayList: [flay] });
          }
          return map;
        }, new Map<string, { actress: Actress; flayList: Flay[] }>())
        .entries(),
      ([name, { actress, flayList }]) => {
        // Flay 정렬 (한 번만 수행)
        const sortedFlayList = flayList.sort((a, b) => {
          let diff = 0;
          if (diff === 0) diff = (b.video.likes?.length > 0 ? 1 : 0) - (a.video.likes?.length > 0 ? 1 : 0);
          if (diff === 0) diff = a.actressList.length - b.actressList.length;
          if (diff === 0) diff = b.score - a.score;
          if (diff === 0) diff = (b.video.likes?.length || 0) - (a.video.likes?.length || 0);
          if (diff === 0) diff = a.release.localeCompare(b.release);
          return diff;
        });

        return {
          name,
          favorite: actress.favorite,
          age: new Date().getFullYear() - parseInt((actress.birth || String(new Date().getFullYear())).substring(0, 4)),
          flayTotalCount: sortedFlayList.length,
          flayLikesCount: sortedFlayList.filter((flay) => flay.video.likes?.length > 0).length,
          flayLikesSum: sortedFlayList.reduce((sum, flay) => sum + (flay.video.likes?.length || 0), 0),
          flayScoreSum: sortedFlayList.reduce((sum, flay) => sum + (flay.score || 0), 0),
          flayRankAvg: sortedFlayList.reduce((sum, flay) => sum + (flay.video.rank || 0), 0) / sortedFlayList.length,
          flayList: sortedFlayList,
        };
      }
    );
  }

  /**
   * 정렬 기준에 따라 데이터를 정렬하고 렌더링
   *
   * @private
   * @param {'count' | 'likes' | 'likes-sum' | 'rank' | 'score'} sortBy - 정렬 기준
   */
  #sortAndRender(sortBy: 'count' | 'likes' | 'likes-sum' | 'rank' | 'score'): void {
    // 정렬
    this.#actressFlayData.sort((a, b) => {
      let diff = 0;

      // 선택된 기준을 최우선으로
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
    // 기존 리스트 항목 제거 (헤더 제외)
    const ul = this.querySelector('ul')!;
    const items = ul.querySelectorAll('li:not(.header)');
    items.forEach((item) => item.remove());

    // DocumentFragment 생성
    const fragment = document.createDocumentFragment();

    // 테이블 행 생성
    this.#actressFlayData.forEach(({ name, favorite, age, flayTotalCount, flayLikesCount, flayLikesSum, flayScoreSum, flayRankAvg, flayList }) => {
      // 대표 Flay 선택
      const firstFlay = flayList[0]!;
      // FlayMarker 생성
      const flayMarkers = flayList.map((flay) => new FlayMarker(flay));

      // 테이블 행 생성
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

      // FlayMarker 추가
      row.querySelector('.flay-marker')!.append(...flayMarkers);

      // 배우 이름 클릭 이벤트
      row.querySelector('.name')!.addEventListener('click', () => popupActress(name));

      // DocumentFragment에 행 추가
      fragment.appendChild(row);
    });

    // ul에 DocumentFragment 추가
    ul.appendChild(fragment);
  }
}

customElements.define('actress-flay-summary', ActressFlaySummary);
