import { StockItem, addStockItem, deleteStockItem, fetchStockItems, fetchStockPrice, fmtKrw } from '../domain/financial-note';
import './fn-stock-items.scss';

/**
 * 증권 계좌 종목 편집 커스텀 엘리먼트.
 * 종목코드, 매입단가, 매입수량을 입력하면 현재가를 API로 조회하여 평가금액을 계산한다.
 */
export class FnStockItems extends HTMLElement {
  #accountId: number = 0;
  #items: StockItem[] = [];

  /**
   * 관찰할 attribute 목록을 반환한다.
   * @returns {string[]} 관찰 attribute 목록
   */
  static get observedAttributes(): string[] {
    return ['account-id'];
  }

  /**
   * account-id 변경 시 내부 상태를 동기화한다.
   * @param {string} name 변경된 attribute 이름
   * @param {string} _old 이전 값
   * @param {string} val 새 값
   * @returns {void}
   */
  attributeChangedCallback(name: string, _old: string, val: string): void {
    if (name === 'account-id') {
      this.#accountId = Number(val);
      if (this.isConnected) void this.load();
    }
  }

  /**
   * 컴포넌트 연결 시 초기 렌더링을 수행한다.
   * @returns {void}
   */
  connectedCallback(): void {
    this.classList.add('fn-stock-items');
    if (this.#accountId) void this.load();
    else this.renderEmpty();
  }

  /**
   * 계좌 미선택 상태 UI를 렌더링한다.
   * @returns {void}
   */
  private renderEmpty(): void {
    this.innerHTML = '<p class="fn-empty">계좌를 선택하세요</p>';
  }

  /**
   * 종목 목록을 로드하고 렌더링한다.
   * @returns {Promise<void>} 완료 Promise
   */
  async load(): Promise<void> {
    if (!this.#accountId) return;
    this.#items = await fetchStockItems(this.#accountId);
    this.render();
  }

  /**
   * 테이블과 입력 폼을 렌더링한다.
   * @returns {void}
   */
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
    void this.#refreshPrices();
  }

  /**
   * 데이터 변경 이벤트를 상위로 전달한다.
   * @returns {void}
   */
  #emitDataChanged(): void {
    this.dispatchEvent(new CustomEvent('fn:data-changed', { bubbles: true }));
  }

  /**
   * 숫자 입력값을 number로 변환한다.
   * @param {string} value 입력 문자열
   * @returns {number} 변환 결과
   */
  #toNumber(value: string): number {
    return parseFloat(value) || 0;
  }

  /**
   * 추가 입력 폼 값을 초기화한다.
   * @returns {void}
   */
  #resetAddForm(): void {
    const codeEl = this.querySelector<HTMLInputElement>('#fn-item-code');
    const nameEl = this.querySelector<HTMLInputElement>('#fn-item-name');
    const priceEl = this.querySelector<HTMLInputElement>('#fn-item-buy-price');
    const qtyEl = this.querySelector<HTMLInputElement>('#fn-item-buy-qty');
    if (codeEl) codeEl.value = '';
    if (nameEl) nameEl.value = '';
    if (priceEl) priceEl.value = '';
    if (qtyEl) qtyEl.value = '';
  }

  /**
   * 종목 현재가를 조회해 평가금액과 합계를 갱신한다.
   * @returns {Promise<void>} 완료 Promise
   */
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

  /**
   * 사용자 액션 이벤트를 바인딩한다.
   * @returns {void}
   */
  #bindEvents(): void {
    this.querySelector('#fn-refresh-prices-btn')?.addEventListener('click', () => {
      void this.#refreshPrices();
    });

    this.querySelector('#fn-add-item-btn')?.addEventListener('click', async () => {
      const codeEl = this.querySelector<HTMLInputElement>('#fn-item-code')!;
      const nameEl = this.querySelector<HTMLInputElement>('#fn-item-name')!;
      const priceEl = this.querySelector<HTMLInputElement>('#fn-item-buy-price')!;
      const qtyEl = this.querySelector<HTMLInputElement>('#fn-item-buy-qty')!;
      const code = codeEl.value.trim();
      const name = nameEl.value.trim();
      const buyPrice = this.#toNumber(priceEl.value);
      const buyQty = this.#toNumber(qtyEl.value);
      if (!code) {
        alert('종목코드를 입력하세요');
        return;
      }
      await addStockItem(this.#accountId, code, name, buyPrice, buyQty);
      this.#resetAddForm();
      await this.load();
      this.#emitDataChanged();
    });

    this.querySelectorAll<HTMLButtonElement>('.fn-btn-del-item').forEach((btn) => {
      btn.addEventListener('click', async () => {
        await deleteStockItem(Number(btn.dataset.id));
        await this.load();
        this.#emitDataChanged();
      });
    });
  }
}

customElements.define('fn-stock-items', FnStockItems);
