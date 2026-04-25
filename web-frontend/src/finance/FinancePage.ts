import BalancePanel from './BalancePanel.js';
import './FinancePage.scss';
import TransactionPanel from './TransactionPanel.js';

/**
 * 금융 계좌 조회 페이지 커스텀 엘리먼트.
 * 잔고 탭과 거래내역 탭으로 구성된다.
 */
export default class FinancePage extends HTMLElement {
  connectedCallback(): void {
    this.innerHTML = /* html */ `
      <header class="finance-header sticky">
        <div class="head-group">
          <h1>📈 금융 계좌 조회</h1>
          <span class="institution-badge">미래에셋증권</span>
        </div>
        <nav class="tab-nav" role="tablist">
          <button class="tab-btn active" role="tab" data-tab="balance">잔고</button>
          <button class="tab-btn" role="tab" data-tab="transaction">거래내역</button>
        </nav>
      </header>
      <main class="finance-main">
        <section class="tab-panel" id="tab-balance">
          <finance-balance></finance-balance>
        </section>
        <section class="tab-panel hidden" id="tab-transaction">
          <finance-transaction></finance-transaction>
        </section>
      </main>
    `;

    this.querySelectorAll<HTMLButtonElement>('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset['tab']!;
        this.#switchTab(tab);
      });
    });
  }

  #switchTab(tab: string): void {
    this.querySelectorAll('.tab-btn').forEach((btn) => btn.classList.toggle('active', (btn as HTMLElement).dataset['tab'] === tab));
    this.querySelectorAll<HTMLElement>('.tab-panel').forEach((panel) => panel.classList.toggle('hidden', panel.id !== `tab-${tab}`));
  }
}

customElements.define('finance-page', FinancePage);

// 사용하지 않는 변수 억제: 커스텀 엘리먼트 사이드이펙트 등록 목적
void BalancePanel;
void TransactionPanel;
