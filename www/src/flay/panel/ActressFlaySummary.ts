import GroundFlay from '@base/GroundFlay';
import FlayMarker from '@flay/domain/FlayMarker';
import FlayFetch, { type Actress, type Flay } from '@lib/FlayFetch';
import { popupActress } from '@lib/FlaySearch';
import NumberUtils from '@lib/NumberUtils';
import favoriteSVG from '@svg/favorite';
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
  /**
   * DOM에 연결될 때 호출되는 Web Component 라이프사이클 메서드
   * 컴포넌트 초기화, 데이터 로드 및 렌더링을 순차적으로 실행합니다.
   *
   * @override
   * @memberof ActressFlaySummary
   */
  connectedCallback(): void {
    void this.#initialize();
  }

  /**
   * 컴포넌트 초기화 및 데이터 로드
   *
   * @private
   */
  async #initialize(): Promise<void> {
    try {
      const fullyFlayList = await FlayFetch.getFullyFlayList();
      this.#render(fullyFlayList);
    } catch (error) {
      console.error('Failed to load flay list:', error);
      this.innerHTML = '<div class="error">데이터를 불러오는데 실패했습니다.</div>';
    }
  }

  /**
   * ActressFlaySummary 렌더링
   *
   * @private
   * @param {Array<{actress: Actress[], flay: Flay}>} fullyFlayList - 배우와 Flay 정보를 포함한 전체 목록
   */
  #render(fullyFlayList: Array<{ actress: Actress[]; flay: Flay }>): void {
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

    // 메인 컨테이너 생성
    this.innerHTML = `
      <table>
        <thead>
          <tr>
            <th class="name">Actress</th>
            <th class="favorite">Fav.</th>
            <th class="age">Age</th>
            <th class="count">Total</th>
            <th class="likes">Shot</th>
            <th class="likes-sum">Shots</th>
            <th class="score">Score</th>
            <th class="flay-marker">Flay</th>
          </tr>
        </thead>
        <tbody>
        </tbody>
      </table>`;

    // 배우별로 Flay 집계
    const actressFlayData = Array.from(
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
      ([name, { actress, flayList }]) => ({
        name,
        favorite: actress.favorite,
        age: new Date().getFullYear() - parseInt((actress.birth || String(new Date().getFullYear())).substring(0, 4)),
        flayTotalCount: flayList.length,
        flayLikesCount: flayList.filter((flay) => flay.video.likes?.length > 0).length,
        flayLikesSum: flayList.reduce((sum, flay) => sum + (flay.video.likes?.length || 0), 0),
        flayScoreSum: flayList.reduce((sum, flay) => sum + (flay.score || 0), 0),
        flayList,
      })
    );

    // 정렬: 점수 합계 > 좋아요 합계 > 좋아요 개수 > 총 개수 > 즐겨찾기 > 이름
    actressFlayData.sort((a, b) => {
      let diff = 0;
      if (diff === 0) diff = b.flayScoreSum - a.flayScoreSum;
      if (diff === 0) diff = b.flayLikesSum - a.flayLikesSum;
      if (diff === 0) diff = b.flayLikesCount - a.flayLikesCount;
      if (diff === 0) diff = b.flayTotalCount - a.flayTotalCount;
      if (diff === 0) diff = Number(b.favorite) - Number(a.favorite);
      if (diff === 0) diff = a.name.localeCompare(b.name);
      return diff;
    });

    // DocumentFragment 생성
    const fragment = document.createDocumentFragment();

    // 테이블 행 생성
    actressFlayData.forEach(({ name, favorite, age, flayTotalCount, flayLikesCount, flayLikesSum, flayScoreSum, flayList }) => {
      // Flay 정렬
      const sortedFlayList = flayList.sort((a, b) => {
        let diff = 0;
        if (diff === 0) diff = (b.video.likes?.length > 0 ? 1 : 0) - (a.video.likes?.length > 0 ? 1 : 0);
        if (diff === 0) diff = a.actressList.length - b.actressList.length;
        if (diff === 0) diff = b.score - a.score;
        if (diff === 0) diff = (b.video.likes?.length || 0) - (a.video.likes?.length || 0);
        if (diff === 0) diff = a.release.localeCompare(b.release);
        return diff;
      });

      // FlayMarker 생성
      const flayMarkers = sortedFlayList.map((flay) => new FlayMarker(flay));

      // 테이블 행 생성
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="name">${name}</td>
        <td class="favorite" style="${favorite ? 'color: var(--color-checked)' : ''}">${favoriteSVG}</td>
        <td class="age">${age}</td>
        <td class="count">${NumberUtils.formatWithCommas(flayTotalCount)}</td>
        <td class="likes">${NumberUtils.formatWithCommas(flayLikesCount)}</td>
        <td class="likes-sum">${NumberUtils.formatWithCommas(flayLikesSum)}</td>
        <td class="score">${NumberUtils.formatWithCommas(flayScoreSum)}</td>
        <td class="flay-marker"></td>`;

      // FlayMarker 추가
      tr.querySelector('.flay-marker')!.append(...flayMarkers);

      // 배우 이름 클릭 이벤트
      tr.querySelector('.name')!.addEventListener('click', () => popupActress(name));

      // DocumentFragment에 행 추가
      fragment.appendChild(tr);
    });

    // tbody에 DocumentFragment 추가
    this.querySelector('tbody')!.appendChild(fragment);
  }
}

customElements.define('actress-flay-summary', ActressFlaySummary);
