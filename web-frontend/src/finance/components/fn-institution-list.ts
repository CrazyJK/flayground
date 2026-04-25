import { Account, Institution, deleteAccount, deleteInstitution, fetchAllAccounts, fetchInstitutions, fmtKrw, updateAccountAmount } from '../domain/financial-note';

const INST_ICON: Record<string, string> = { bank: '🏦', insurance: '🛡', stock: '📈' };
const INST_LABEL: Record<string, string> = { bank: '은행', insurance: '보험', stock: '증권' };

/**
 * 금융기관 목록 + 계좌 목록 커스텀 엘리먼트.
 * 기관별 계좌 목록과 합계, 총 자산을 표시한다.
 * 계좌 금액을 인라인으로 수정할 수 있다.
 */
export class FnInstitutionList extends HTMLElement {
  #institutions: Institution[] = [];
  #accounts: Account[] = [];

  connectedCallback(): void {
    this.classList.add('fn-institution-list');
    this.load();
  }

  /** 서버에서 데이터를 로드하고 렌더링한다 */
  async load(): Promise<void> {
    [this.#institutions, this.#accounts] = await Promise.all([fetchInstitutions(), fetchAllAccounts()]);
    this.render();
  }

  /** 외부에서 새로고침 트리거 */
  refresh(): void {
    this.load();
  }

  /** 증권 계좌 평가금액을 Naver API로 갱신한다 */
  async refreshStockAmounts(): Promise<void> {
    const stockAccounts = this.#accounts.filter((a) => {
      const inst = this.#institutions.find((i) => i.id === a.institutionId);
      return inst?.type === 'stock';
    });
    // 종목별 현재가를 가져오기 위해 fn-stock-items 이벤트를 통해 합산된 값을 받음
    // 간단하게 각 stock 계좌에 대해 계산 요청 이벤트를 발생
    this.dispatchEvent(new CustomEvent('fn:refresh-stock', { bubbles: true, detail: { accounts: stockAccounts } }));
  }

  private render(): void {
    // 기관별 계좌 그룹화
    const grouped = new Map<number, Account[]>();
    for (const inst of this.#institutions) {
      grouped.set(
        inst.id,
        this.#accounts.filter((a) => a.institutionId === inst.id)
      );
    }

    let totalAsset = 0;
    for (const acc of this.#accounts) totalAsset += acc.amount;

    const instHtml = this.#institutions
      .map((inst) => {
        const accounts = grouped.get(inst.id) ?? [];
        const subtotal = accounts.reduce((s, a) => s + a.amount, 0);
        const icon = INST_ICON[inst.type] ?? '🏛';
        const label = INST_LABEL[inst.type] ?? inst.type;
        const accountsHtml = accounts
          .map(
            (acc) => /* html */ `
              <div class="fn-account-row" data-id="${acc.id}">
                <span class="fn-account-name">${acc.name}</span>
                <input class="fn-amount-input" type="text" value="${fmtKrw(acc.amount)}"
                  data-raw="${acc.amount}" data-id="${acc.id}"
                  ${inst.type === 'stock' ? 'readonly title="증권 계좌는 종목 편집에서 평가금액이 자동 계산됩니다"' : ''}
                />
                <button class="fn-btn fn-btn-edit-stock" data-id="${acc.id}" data-inst-type="${inst.type}"
                  style="${inst.type !== 'stock' ? 'display:none' : ''}">종목</button>
                <button class="fn-btn fn-btn-del-account" data-id="${acc.id}">✕</button>
              </div>`
          )
          .join('');

        return /* html */ `
          <div class="fn-institution-block" data-inst-id="${inst.id}">
            <div class="fn-institution-header">
              <span class="fn-inst-icon">${icon}</span>
              <span class="fn-inst-name">${inst.name}</span>
              <span class="fn-inst-type-badge">${label}</span>
              <button class="fn-btn fn-btn-del-inst" data-id="${inst.id}">삭제</button>
            </div>
            <div class="fn-accounts">${accountsHtml}</div>
            <div class="fn-subtotal">소계: <strong>${fmtKrw(subtotal)}</strong> 원</div>
          </div>`;
      })
      .join('');

    this.innerHTML = /* html */ `
      <div class="fn-total-asset">총 자산: <strong class="fn-total-value">${fmtKrw(totalAsset)}</strong> 원</div>
      <div class="fn-institutions">${instHtml}</div>`;

    this.#bindEvents();
  }

  #bindEvents(): void {
    // 금액 입력 포커스 → 콤마 제거
    this.querySelectorAll<HTMLInputElement>('.fn-amount-input').forEach((input) => {
      input.addEventListener('focus', () => {
        input.value = input.dataset.raw ?? '0';
      });
      input.addEventListener('blur', async () => {
        const raw = parseFloat(input.value.replace(/,/g, '')) || 0;
        const id = Number(input.dataset.id);
        input.dataset.raw = String(raw);
        input.value = fmtKrw(raw);
        await updateAccountAmount(id, raw);
        this.#updateTotals();
        this.dispatchEvent(new CustomEvent('fn:data-changed', { bubbles: true }));
      });
      input.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
      });
    });

    // 기관 삭제
    this.querySelectorAll<HTMLButtonElement>('.fn-btn-del-inst').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('기관과 모든 계좌를 삭제합니다. 계속하겠습니까?')) return;
        await deleteInstitution(Number(btn.dataset.id));
        await this.load();
        this.dispatchEvent(new CustomEvent('fn:data-changed', { bubbles: true }));
      });
    });

    // 계좌 삭제
    this.querySelectorAll<HTMLButtonElement>('.fn-btn-del-account').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('계좌를 삭제합니다. 계속하겠습니까?')) return;
        await deleteAccount(Number(btn.dataset.id));
        await this.load();
        this.dispatchEvent(new CustomEvent('fn:data-changed', { bubbles: true }));
      });
    });

    // 증권 종목 편집
    this.querySelectorAll<HTMLButtonElement>('.fn-btn-edit-stock').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('fn:edit-stock', { bubbles: true, detail: { accountId: Number(btn.dataset.id) } }));
      });
    });
  }

  /** 합계만 재계산하여 DOM 업데이트 (서버 재로드 없이) */
  #updateTotals(): void {
    let total = 0;
    this.querySelectorAll<HTMLInputElement>('.fn-amount-input').forEach((input) => {
      total += parseFloat(input.dataset.raw ?? '0') || 0;
    });

    this.#institutions.forEach((inst) => {
      const block = this.querySelector<HTMLElement>(`.fn-institution-block[data-inst-id="${inst.id}"]`);
      if (!block) return;
      let sub = 0;
      block.querySelectorAll<HTMLInputElement>('.fn-amount-input').forEach((input) => {
        sub += parseFloat(input.dataset.raw ?? '0') || 0;
      });
      const el = block.querySelector<HTMLElement>('.fn-subtotal strong');
      if (el) el.textContent = fmtKrw(sub);
    });

    const totalEl = this.querySelector<HTMLElement>('.fn-total-value');
    if (totalEl) totalEl.textContent = fmtKrw(total);
  }

  /** 증권 계좌 금액을 외부에서 갱신 (fn-stock-items 콜백) */
  async updateStockAmount(accountId: number, evalAmount: number): Promise<void> {
    await updateAccountAmount(accountId, evalAmount);
    const input = this.querySelector<HTMLInputElement>(`.fn-amount-input[data-id="${accountId}"]`);
    if (input) {
      input.dataset.raw = String(evalAmount);
      input.value = fmtKrw(evalAmount);
    }
    this.#updateTotals();
  }
}

customElements.define('fn-institution-list', FnInstitutionList);
