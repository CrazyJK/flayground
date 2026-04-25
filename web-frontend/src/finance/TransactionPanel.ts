import { daysAgoStr, fetchTransactions, formatCurrency, formatDate, formatTime, todayStr, TransactionItem, TransactionResult } from './FinanceApi.js';
import './TransactionPanel.scss';

/**
 * 거래내역 패널 커스텀 엘리먼트.
 * 날짜 범위 필터를 통해 미래에셋증권 주식계좌 거래내역을 조회하고 테이블로 표시한다.
 */
export default class TransactionPanel extends HTMLElement {
  connectedCallback(): void {
    const today = todayStr();
    const monthAgo = daysAgoStr(30);

    this.innerHTML = /* html */ `
      <div class="transaction-filter">
        <label>시작일 <input type="date" id="startDate" value="${this.#toInputDate(monthAgo)}" /></label>
        <label>종료일 <input type="date" id="endDate" value="${this.#toInputDate(today)}" /></label>
        <label>정렬
          <select id="orderBy">
            <option value="0">최신순</option>
            <option value="1">과거순</option>
          </select>
        </label>
        <button type="button" id="searchBtn">조회</button>
      </div>
      <div class="transaction-result">
        <p class="info-msg">날짜를 선택하고 조회 버튼을 누르세요.</p>
      </div>
    `;

    this.querySelector('#searchBtn')!.addEventListener('click', () => this.#search());
  }

  async #search(): Promise<void> {
    const startInput = (this.querySelector('#startDate') as HTMLInputElement).value;
    const endInput = (this.querySelector('#endDate') as HTMLInputElement).value;
    const orderBy = (this.querySelector('#orderBy') as HTMLSelectElement).value;

    if (!startInput || !endInput) {
      alert('시작일과 종료일을 선택하세요.');
      return;
    }

    const startDate = startInput.replace(/-/g, '');
    const endDate = endInput.replace(/-/g, '');

    const resultEl = this.querySelector('.transaction-result')!;
    resultEl.innerHTML = '<p class="loading-msg">거래내역을 불러오는 중...</p>';

    try {
      const data = await fetchTransactions(startDate, endDate, orderBy);
      this.#render(data);
    } catch (err) {
      resultEl.innerHTML = `<p class="error-msg">거래내역 조회 오류: ${err instanceof Error ? err.message : String(err)}</p>`;
    }
  }

  #render(data: TransactionResult): void {
    const items = Array.isArray(data.resTrHistoryList) ? data.resTrHistoryList : [];
    const resultEl = this.querySelector('.transaction-result')!;

    const summaryHtml = /* html */ `
      <div class="tx-summary">
        <span>계좌: <strong>${data.resAccount}</strong></span>
        <span>예금주: <strong>${data.resAccountHolder}</strong></span>
        <span>계좌명: <strong>${data.resAccountName}</strong></span>
        <span>현재잔액: <strong>${formatCurrency(data.resAccountBalance)}</strong></span>
        <span>총 ${items.length}건</span>
      </div>
    `;

    if (items.length === 0) {
      resultEl.innerHTML = summaryHtml + '<p class="empty-msg">조회된 거래내역이 없습니다.</p>';
      return;
    }

    const rows = items.map((item: TransactionItem) => this.#buildRow(item)).join('');

    resultEl.innerHTML =
      summaryHtml +
      /* html */ `
      <div class="table-wrap">
        <table class="tx-table">
          <thead>
            <tr>
              <th>거래일자</th>
              <th>거래시각</th>
              <th>거래구분</th>
              <th>적요</th>
              <th class="right">입금금액</th>
              <th class="right">출금금액</th>
              <th class="right">거래후 잔액</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }

  #buildRow(item: TransactionItem): string {
    const inAmt = Number(item.resAccountIn || 0);
    const outAmt = Number(item.resAccountOut || 0);
    return /* html */ `
      <tr>
        <td class="mono">${formatDate(item.resAccountTrDate)}</td>
        <td class="mono">${formatTime(item.resAccountTrTime)}</td>
        <td>${item.resAccountDesc2 || '-'}</td>
        <td>${item.resAccountDesc3 || item.resAccountDesc1 || '-'}</td>
        <td class="right ${inAmt > 0 ? 'in' : ''}">${inAmt > 0 ? formatCurrency(item.resAccountIn) : '-'}</td>
        <td class="right ${outAmt > 0 ? 'out' : ''}">${outAmt > 0 ? formatCurrency(item.resAccountOut) : '-'}</td>
        <td class="right mono">${formatCurrency(item.resAfterTranBalance)}</td>
      </tr>`;
  }

  /** "YYYYMMDD" → "YYYY-MM-DD" (input[type=date] value 형식) */
  #toInputDate(d: string): string {
    if (!d || d.length !== 8) return '';
    return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
  }
}

customElements.define('finance-transaction', TransactionPanel);
