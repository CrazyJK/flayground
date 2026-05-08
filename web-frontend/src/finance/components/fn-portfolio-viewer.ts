import './fn-portfolio-viewer.scss';

/** 포트폴리오 종목 항목 타입 */
interface PortfolioItem {
  market: string;
  stockCode: string;
  stockName: string;
  averagePrice: number;
  quantityHeld: number;
  currentPrice?: number; // TDF용 현재가 (평가 금액 계산 시 사용)
}

/** 종목코드 기준 현재가 맵 */
type PriceMap = Map<string, number>;

/** 국내 주식 포트폴리오 */
const DOMESTIC: PortfolioItem[] = [
  { market: 'KS', stockCode: '066570', stockName: 'LG전자', averagePrice: 144000, quantityHeld: 1 },
  { market: 'KS', stockCode: '069500', stockName: 'KODEX 200', averagePrice: 79033, quantityHeld: 2 },
  { market: 'KS', stockCode: '395160', stockName: 'KODEX AI반도체', averagePrice: 27350, quantityHeld: 4866 },
  { market: 'RP', stockCode: 'RP1', stockName: '현금성 자산', averagePrice: 1, quantityHeld: 41962 },
];

/** 퇴직연금 포트폴리오 */
const PENSION: PortfolioItem[] = [
  { market: 'TDF', stockCode: 'TDF', stockName: 'TDF2050', averagePrice: 500015, quantityHeld: 1, currentPrice: 783353 },
  { market: 'KS', stockCode: '0162Z0', stockName: 'RISE 삼성전자SK하이닉스채권혼합50', averagePrice: 10437, quantityHeld: 4172 },
  { market: 'KS', stockCode: '0163Y0', stockName: 'KoAct 코스닥액티브', averagePrice: 12684, quantityHeld: 1182 },
  { market: 'KS', stockCode: '102110', stockName: 'TIGER 200', averagePrice: 85087, quantityHeld: 987 },
  { market: 'RP', stockCode: 'RP2', stockName: '현금성 자산', averagePrice: 1, quantityHeld: 7286 },
];

/**
 * 주식 및 퇴직연금 포트폴리오 현재 정보를 보여주는 커스텀 엘리먼트.
 * connectedCallback 시점에 현재가를 API에서 조회하여 렌더링한다.
 */
export class FnPortfolioViewer extends HTMLElement {
  /**
   * 컴포넌트 연결 시 초기 렌더링 후 데이터를 로드한다.
   * @returns {void}
   */
  connectedCallback(): void {
    this.classList.add('fn-portfolio-viewer');
    this.render(null);
    void this.load();
  }

  /**
   * 종목 현재가를 조회한다.
   * @param {string} stockCode 종목 코드
   * @param {string} market 시장 코드
   * @returns {Promise<number>} 현재가
   */
  async #fetchPrice(stockCode: string, market: string): Promise<number> {
    try {
      const res = await fetch(`/api/v1/stock-price/${stockCode}/${market}`);
      if (!res.ok) return NaN;
      const data = (await res.json()) as { price?: number };
      return data.price ?? NaN;
    } catch {
      return NaN;
    }
  }

  /**
   * 포트폴리오 목록의 현재가 맵을 생성한다.
   * - RP, TDF는 API 조회 없이 현재가 1로 설정
   * @param {PortfolioItem[]} items 조회 대상 목록
   * @returns {Promise<PriceMap>} 종목코드 기준 현재가 맵
   */
  async #buildPriceMap(items: PortfolioItem[]): Promise<PriceMap> {
    const requiredFetchItems = items.filter((item) => !['RP', 'TDF'].includes(item.market));
    const priceFetchPromises = requiredFetchItems.map((item) => this.#fetchPrice(item.stockCode, item.market));
    const resolvedPrices = await Promise.all(priceFetchPromises);
    const priceMap: PriceMap = new Map<string, number>();
    requiredFetchItems.forEach((item, index) => {
      priceMap.set(item.stockCode, resolvedPrices[index] ?? NaN);
    });
    // RP, TDF는 API 조회 없이 현재가 1로 설정
    const nonFetchItems = items.filter((item) => ['RP', 'TDF'].includes(item.market));
    nonFetchItems.forEach((item) => {
      if (item.market === 'TDF' && item.currentPrice !== undefined) {
        priceMap.set(item.stockCode, item.currentPrice);
      } else {
        priceMap.set(item.stockCode, 1);
      }
    });
    return priceMap;
  }

  /**
   * 현재가 API를 병렬 조회한 뒤 렌더링한다.
   * @returns {Promise<void>} 완료 Promise
   */
  private async load(): Promise<void> {
    const all = [...DOMESTIC, ...PENSION];
    const priceMap = await this.#buildPriceMap(all);

    this.render(priceMap);
  }

  /**
   * 가격 데이터를 받아 테이블을 렌더링한다.
   * @param {PriceMap | null} priceMap 가격 맵, null이면 로딩 상태
   * @returns {void}
   */
  private render(priceMap: PriceMap | null): void {
    const fmtNum = (n: number) => (isNaN(n) ? '조회 실패' : n.toLocaleString());
    const loading = '<span class="fn-pv-loading">...</span>';

    const buildRows = (list: PortfolioItem[]) =>
      list
        .map((item) => {
          const isRP = item.market === 'RP';
          const isTDF = item.market === 'TDF';
          const price = priceMap?.get(item.stockCode) ?? NaN;
          const returnRate = isRP ? NaN : priceMap ? ((price - item.averagePrice) / item.averagePrice) * 100 : NaN;
          const evalAmt = price * item.quantityHeld;
          return `
            <tr>
              <td title="${item.stockCode}">${item.stockName}</td>
              <td class="fn-num">${isRP ? '' : item.averagePrice.toLocaleString()}</td>
              <td class="fn-num">${isRP || isTDF ? '' : item.quantityHeld.toLocaleString()}</td>
              <td class="fn-num ${isNaN(price) ? 'fn-pv-fail' : ''}">${isRP ? '' : priceMap ? fmtNum(price) : loading}</td>
              <td class="fn-num ${isNaN(returnRate) ? 'fn-pv-fail' : ''}">${isRP ? '' : priceMap ? returnRate.toFixed(2) : loading}</td>
              <td class="fn-num ${isNaN(evalAmt) ? 'fn-pv-fail' : ''}">${priceMap ? fmtNum(evalAmt) : loading}</td>
            </tr>`;
        })
        .join('');

    /**
     * 총 평가 금액 계산: 각 종목의 (현재가 * 보유 수량)의 합
     * @param list
     * @returns
     */
    const buildEvalTotal = (list: PortfolioItem[]) => {
      if (!priceMap) return loading;
      const total = list.reduce((sum, item) => {
        const price = priceMap.get(item.stockCode) ?? NaN;
        const evalAmt = price * item.quantityHeld;
        return sum + (isNaN(evalAmt) ? 0 : evalAmt);
      }, 0);
      return total.toLocaleString();
    };

    /**
     * 전체 손익률 계산: (총 평가 금액 / 총 매수 금액) * 100
     * - 총 평가 금액: 각 종목의 (현재가 * 보유 수량)의 합
     * - 총 매수 금액: 각 종목의 (평균 단가 * 보유 수량)의 합
     * - RP, TDF는 평가 금액과 매수 금액 모두 0으로 처리하여 손익률 계산에서 제외
     */
    const buildReturnRateTotal = (list: PortfolioItem[]) => {
      if (!priceMap) return loading;
      let totalEvalAmt = 0;
      let totalBuyAmt = 0;
      list.forEach((item) => {
        const price = priceMap.get(item.stockCode) ?? NaN;
        const evalAmt = price * item.quantityHeld;
        const buyAmt = item.averagePrice * item.quantityHeld;
        if (!isNaN(evalAmt) && !isNaN(buyAmt)) {
          totalEvalAmt += evalAmt;
          totalBuyAmt += buyAmt;
        }
      });
      if (totalBuyAmt === 0) return 'N/A';
      return ((totalEvalAmt / totalBuyAmt - 1) * 100).toFixed(2);
    };

    const buildTable = (title: string, list: PortfolioItem[]) =>
      `<h3 class="fn-pv-section-title">${title}</h3>
      <table class="fn-pv-table">
        <thead>
          <tr>
            <th>종목명</th>
            <th>평균 단가</th>
            <th>보유 수량</th>
            <th>현재가</th>
            <th>손익률(%)</th>
            <th>평가 금액</th>
          </tr>
        </thead>
        <tbody>${buildRows(list)}</tbody>
        <tfoot>
          <tr>
            <th colspan="4"></th>
            <th class="fn-num">${buildReturnRateTotal(list)}</th>
            <th class="fn-num">${buildEvalTotal(list)}</th>
          </tr>
        </tfoot>
      </table>`;

    this.innerHTML = `<div class="fn-pv-wrap">` + buildTable('📈 국내 주식', DOMESTIC) + buildTable('🏦 퇴직연금', PENSION) + `</div>`;
    this.querySelectorAll('.fn-num').forEach((el) => {
      if (parseFloat(el.textContent) < 0) {
        el.classList.add('fn-num-minus');
      }
    });

    if (priceMap) {
      const grandTotal = [...DOMESTIC, ...PENSION].reduce((sum, item) => {
        const price = priceMap.get(item.stockCode) ?? NaN;
        const evalAmt = price * item.quantityHeld;
        return sum + (isNaN(evalAmt) ? 0 : evalAmt);
      }, 0);
      this.dispatchEvent(new CustomEvent('fn:total-loaded', { detail: { total: grandTotal }, bubbles: true }));
    }
  }
}

customElements.define('fn-portfolio-viewer', FnPortfolioViewer);
