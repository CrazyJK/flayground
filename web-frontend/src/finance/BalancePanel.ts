import { BalanceResult, fetchBalance, formatCurrency, formatRate, StockItem } from './FinanceApi.js';
import './BalancePanel.scss';

/**
 * 주식잔고 패널 커스텀 엘리먼트.
 * 미래에셋증권 주식잔고를 조회하여 포트폴리오 요약 카드와 종목별 잔고 테이블을 표시한다.
 */
export default class BalancePanel extends HTMLElement {
  connectedCallback(): void {
    this.innerHTML = /* html */ `
      <div class="balance-summary">
        <div class="summary-card loading" id="summary">
          <div class="skeleton-row"><span class="skeleton-label"></span><span class="skeleton-value"></span></div>
          <div class="skeleton-row"><span class="skeleton-label"></span><span class="skeleton-value"></span></div>
        </div>
      </div>
      <div class="balance-table-wrap">
        <p class="loading-msg">잔고 데이터를 불러오는 중...</p>
      </div>
    `;

    this.#load();
  }

  async #load(): Promise<void> {
    try {
      const data = await fetchBalance();
      this.#render(data);
    } catch (err) {
      this.#renderError(err instanceof Error ? err.message : String(err));
    }
  }

  #render(data: BalanceResult): void {
    const items = Array.isArray(data.resItemList) ? data.resItemList : [];

    // 포트폴리오 집계
    const totalPurchase = items.reduce((s, i) => s + Number(i.resPurchaseAmount || 0), 0);
    const totalValuation = items.reduce((s, i) => s + Number(i.resValuationAmt || 0), 0);
    const totalPL = totalValuation - totalPurchase;
    const totalRate = totalPurchase > 0 ? ((totalPL / totalPurchase) * 100).toFixed(2) : '0.00';
    const rateClass = totalPL >= 0 ? 'profit' : 'loss';

    this.innerHTML = /* html */ `
      <div class="balance-summary">
        <div class="summary-cards">
          <div class="summary-card">
            <span class="label">예수금</span>
            <span class="value">${formatCurrency(data.resDepositReceived)}</span>
          </div>
          <div class="summary-card">
            <span class="label">총 매입금액</span>
            <span class="value">${totalPurchase.toLocaleString('ko-KR')}원</span>
          </div>
          <div class="summary-card">
            <span class="label">총 평가금액</span>
            <span class="value">${totalValuation.toLocaleString('ko-KR')}원</span>
          </div>
          <div class="summary-card">
            <span class="label">총 평가손익</span>
            <span class="value ${rateClass}">${totalPL >= 0 ? '+' : ''}${totalPL.toLocaleString('ko-KR')}원</span>
          </div>
          <div class="summary-card">
            <span class="label">총 수익률</span>
            <span class="value ${rateClass}">${totalPL >= 0 ? '+' : ''}${totalRate}%</span>
          </div>
        </div>
      </div>
      <div class="balance-table-wrap">
        ${items.length === 0 ? '<p class="empty-msg">보유 종목이 없습니다.</p>' : this.#buildTable(items)}
      </div>
    `;
  }

  #buildTable(items: StockItem[]): string {
    const rows = items
      .map((item) => {
        const rate = parseFloat(item.resEarningsRate || '0');
        const rateClass = rate >= 0 ? 'profit' : 'loss';
        return /* html */ `
        <tr>
          <td>${item.resItemName}</td>
          <td class="mono">${item.resItemCode}</td>
          <td class="right">${Number(item.resQuantity).toLocaleString('ko-KR')}</td>
          <td class="right">${formatCurrency(item.resPresentAmt)}</td>
          <td class="right">${formatCurrency(item.resPurchaseAmount)}</td>
          <td class="right">${formatCurrency(item.resValuationAmt)}</td>
          <td class="right ${rateClass}">${Number(item.resValuationPL) >= 0 ? '+' : ''}${Number(item.resValuationPL).toLocaleString('ko-KR')}원</td>
          <td class="right ${rateClass}">${formatRate(item.resEarningsRate)}</td>
        </tr>`;
      })
      .join('');

    return /* html */ `
      <table class="balance-table">
        <thead>
          <tr>
            <th>종목명</th>
            <th>코드</th>
            <th class="right">수량</th>
            <th class="right">현재가</th>
            <th class="right">매입금액</th>
            <th class="right">평가금액</th>
            <th class="right">평가손익</th>
            <th class="right">수익률</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`;
  }

  #renderError(message: string): void {
    this.innerHTML = /* html */ `<p class="error-msg">잔고 조회 오류: ${message}</p>`;
  }
}

customElements.define('finance-balance', BalancePanel);
