import { showConfirm } from '@lib/components/FlayDialog';
import { Account, Institution, InstitutionType, deleteAccount, deleteInstitution, fetchAllAccounts, fetchInstitutions, fmtKrw, updateAccountAmount } from '../domain/financial-note';

const INST_ICON: Record<InstitutionType, string> = { bank: '🏦', insurance: '🛡', stock: '📈' };
const INST_LABEL: Record<InstitutionType, string> = { bank: '은행', insurance: '보험', stock: '증권' };

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
    void this.load();
  }

  /**
   * 서버에서 데이터를 로드하고 렌더링한다.
   * @returns {Promise<void>} 완료 Promise
   */
  async load(): Promise<void> {
    [this.#institutions, this.#accounts] = await Promise.all([fetchInstitutions(), fetchAllAccounts()]);
    this.render();
  }

  /**
   * 외부에서 새로고침을 트리거한다.
   * @returns {void}
   */
  refresh(): void {
    void this.load();
  }

  /**
   * 기관/계좌 목록을 렌더링한다.
   * @returns {void}
   */
  private render(): void {
    const grouped = this.#groupAccountsByInstitution();

    const totalAsset = this.#accounts.reduce((sum, account) => sum + account.amount, 0);

    const instHtml = this.#institutions
      .map((inst) => {
        const accounts = grouped.get(inst.id) ?? [];
        const subtotal = accounts.reduce((s, a) => s + a.amount, 0);
        const icon = INST_ICON[inst.type];
        const label = INST_LABEL[inst.type];
        const accountsHtml = accounts
          .map(
            (acc) => /* html */ `
              <div class="fn-account-row" data-id="${acc.id}">
                <span class="fn-account-name">${acc.name}</span>
                <input class="fn-amount-input" type="text" value="${fmtKrw(acc.amount)}"
                  data-raw="${acc.amount}" data-id="${acc.id}"
                />
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

  /**
   * 기관별 계좌 그룹 맵을 생성한다.
   * @returns {Map<number, Account[]>} 기관 ID 기준 계좌 목록
   */
  #groupAccountsByInstitution(): Map<number, Account[]> {
    const grouped = new Map<number, Account[]>();
    for (const inst of this.#institutions) {
      grouped.set(
        inst.id,
        this.#accounts.filter((account) => account.institutionId === inst.id)
      );
    }
    return grouped;
  }

  /**
   * 금액 입력 문자열을 숫자로 파싱한다.
   * @param {string} value 입력 문자열
   * @returns {number} 파싱된 금액
   */
  #parseAmount(value: string): number {
    return parseFloat(value.replace(/,/g, '')) || 0;
  }

  /**
   * 계좌 금액을 내부 상태와 입력 DOM에 동기화한다.
   * @param {number} accountId 계좌 ID
   * @param {number} amount 금액
   * @returns {void}
   */
  #syncAccountAmount(accountId: number, amount: number): void {
    const account = this.#accounts.find((item) => item.id === accountId);
    if (account) account.amount = amount;

    const input = this.querySelector<HTMLInputElement>(`.fn-amount-input[data-id="${accountId}"]`);
    if (!input) return;
    input.dataset.raw = String(amount);
    input.value = fmtKrw(amount);
  }

  /**
   * 데이터 변경 이벤트를 상위로 전달한다.
   * @returns {void}
   */
  #emitDataChanged(): void {
    this.dispatchEvent(new CustomEvent('fn:data-changed', { bubbles: true }));
  }

  /**
   * 사용자 액션 이벤트를 바인딩한다.
   * @returns {void}
   */
  #bindEvents(): void {
    // 금액 입력 포커스 → 콤마 제거
    this.querySelectorAll<HTMLInputElement>('.fn-amount-input').forEach((input) => {
      input.addEventListener('focus', () => {
        input.value = input.dataset.raw ?? '0';
      });
      input.addEventListener('blur', async () => {
        const raw = this.#parseAmount(input.value);
        const id = Number(input.dataset.id);
        await updateAccountAmount(id, raw);
        this.#syncAccountAmount(id, raw);
        this.#updateTotals();
        this.#emitDataChanged();
      });
      input.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
      });
    });

    // 기관 삭제
    this.querySelectorAll<HTMLButtonElement>('.fn-btn-del-inst').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!(await showConfirm('기관과 모든 계좌를 삭제합니다. 계속하겠습니까?'))) return;
        await deleteInstitution(Number(btn.dataset.id));
        await this.load();
        this.#emitDataChanged();
      });
    });

    // 계좌 삭제
    this.querySelectorAll<HTMLButtonElement>('.fn-btn-del-account').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!(await showConfirm('계좌를 삭제합니다. 계속하겠습니까?'))) return;
        await deleteAccount(Number(btn.dataset.id));
        await this.load();
        this.#emitDataChanged();
      });
    });
  }

  /**
   * 합계만 재계산하여 DOM을 업데이트한다.
   * @returns {void}
   */
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
}

customElements.define('fn-institution-list', FnInstitutionList);
