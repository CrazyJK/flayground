import { StockItem, addStockItem, deleteStockItem, fetchStockItems, fetchStockPrice, fmtKrw } from '../domain/financial-note';

/**
 * 증권 계좌 종목 편집 커스텀 엘리먼트.
 * 종목코드, 매입단가, 매입수량을 입력하면 현재가를 API로 조회하여 평가금액을 계산한다.
 */
export class FnStockItems extends HTMLElement {
  #accountId: number = 0;
  #items: StockItem[] = [];

  static get observedAttributes(): string[] {
    return ['account-id'];
  }

  attributeChangedCallback(name: string, _old: string, val: string): void {
    if (name === 'account-id') {
      this.#accountId = Number(val);
      if (this.isConnected) this.load();
    }
  }

  connectedCallback(): void {
    this.classList.add('fn-stock-items');
    if (this.#accountId) this.load();
    else this.renderEmpty();
  }

  private renderEmpty(): void {
    this.innerHTML = '<p class="fn-empty">계좌를 선택하세요</p>';
  }

  async load(): Promise<void> {
    if (!this.#accountId) return;
    this.#items = await fetchStockItems(this.#accountId);
    this.render();
  }

  private render(): void {
    const rowsHtml = this.#items
      .map(
        (item) => /* html */ `
          <tr data-id="${item.id}">
            <td>${item.code}</td>
            <td>${item.name}</td>
            <td class="fn-num">${fmtKrw(item.buyPrice)}</td>
            <td class="fn-num">${item.buyQty}</td>
            <td class="fn-current-price fn-num" data-code="${item.code}">-</td>
            <td class="fn-eval-amount fn-num">-</td>
            <td><button class="fn-btn fn-btn-del-item" data-id="${item.id}">✕</button></td>
          </tr>`
      )
      .join('');

    this.innerHTML = /* html */ `
      <div class="fn-stock-header">
        <span>증권 종목 편집 (계좌 ID: ${this.#accountId})</span>
        <button id="fn-refresh-prices-btn" class="fn-btn">현재가 갱신</button>
      </div>
      <table class="fn-stock-table">
        <thead>
          <tr>
            <th>종목코드</th><th>종목명</th><th>매입단가</th><th>매입수량</th>
            <th>현재가</th><th>평가금액</th><th></th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      <div class="fn-stock-eval-total">평가 합계: <strong id="fn-eval-total">-</strong></div>
      <div class="fn-form-row fn-add-item-row">
        <input id="fn-item-code" type="text" placeholder="종목코드 (6자리)" maxlength="6" />
        <input id="fn-item-name" type="text" placeholder="종목명" />
        <input id="fn-item-buy-price" type="number" placeholder="매입단가" min="0" />
        <input id="fn-item-buy-qty" type="number" placeholder="매입수량" min="0" step="0.01" />
        <button id="fn-add-item-btn" class="fn-btn fn-btn-primary">추가</button>
      </div>`;

    this.#bindEvents();
    this.#refreshPrices();
  }

  async #refreshPrices(): Promise<void> {
    const codes = [...new Set(this.#items.map((i) => i.code).filter(Boolean))];
    const priceMap = new Map<string, number>();

    await Promise.all(
      codes.map(async (code) => {
        try {
          const res = await fetchStockPrice(code);
          priceMap.set(code, res.price);
        } catch {
          priceMap.set(code, 0);
        }
      })
    );

    let evalTotal = 0;
    this.#items.forEach((item) => {
      const price = priceMap.get(item.code) ?? 0;
      const evalAmt = price * item.buyQty;
      evalTotal += evalAmt;

      const row = this.querySelector<HTMLTableRowElement>(`tr[data-id="${item.id}"]`);
      if (!row) return;
      const priceCell = row.querySelector<HTMLTableCellElement>('.fn-current-price');
      const evalCell = row.querySelector<HTMLTableCellElement>('.fn-eval-amount');
      if (priceCell) priceCell.textContent = fmtKrw(price);
      if (evalCell) evalCell.textContent = fmtKrw(evalAmt);
    });

    const totalEl = this.querySelector<HTMLElement>('#fn-eval-total');
    if (totalEl) totalEl.textContent = `${fmtKrw(evalTotal)} 원`;

    // 상위 fn-institution-list에 평가금액 업데이트 전달
    this.dispatchEvent(
      new CustomEvent('fn:stock-eval-updated', {
        bubbles: true,
        detail: { accountId: this.#accountId, evalAmount: evalTotal },
      })
    );
  }

  #bindEvents(): void {
    this.querySelector('#fn-refresh-prices-btn')?.addEventListener('click', () => this.#refreshPrices());

    this.querySelector('#fn-add-item-btn')?.addEventListener('click', async () => {
      const codeEl = this.querySelector<HTMLInputElement>('#fn-item-code')!;
      const nameEl = this.querySelector<HTMLInputElement>('#fn-item-name')!;
      const priceEl = this.querySelector<HTMLInputElement>('#fn-item-buy-price')!;
      const qtyEl = this.querySelector<HTMLInputElement>('#fn-item-buy-qty')!;
      const code = codeEl.value.trim();
      const name = nameEl.value.trim();
      const buyPrice = parseFloat(priceEl.value) || 0;
      const buyQty = parseFloat(qtyEl.value) || 0;
      if (!code) {
        alert('종목코드를 입력하세요');
        return;
      }
      await addStockItem(this.#accountId, code, name, buyPrice, buyQty);
      codeEl.value = '';
      nameEl.value = '';
      priceEl.value = '';
      qtyEl.value = '';
      await this.load();
      this.dispatchEvent(new CustomEvent('fn:data-changed', { bubbles: true }));
    });

    this.querySelectorAll<HTMLButtonElement>('.fn-btn-del-item').forEach((btn) => {
      btn.addEventListener('click', async () => {
        await deleteStockItem(Number(btn.dataset.id));
        await this.load();
        this.dispatchEvent(new CustomEvent('fn:data-changed', { bubbles: true }));
      });
    });
  }
}

customElements.define('fn-stock-items', FnStockItems);
