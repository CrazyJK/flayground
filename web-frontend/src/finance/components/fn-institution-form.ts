import { Account, Institution, InstitutionType, addAccount, addInstitution, deleteAccount, deleteInstitution, fetchAllAccounts, fetchInstitutions, importInstitutionsCsv, importSnapshotsCsv, resetAll } from '../domain/financial-note';
import './fn-institution-form.scss';

const INST_ICON: Record<InstitutionType, string> = { bank: '🏦', insurance: '🛡', stock: '📈' };
const INST_LABEL: Record<InstitutionType, string> = { bank: '은행', insurance: '보험', stock: '증권' };

/**
 * 금융기관/계좌 추가 폼 및 CSV import, 기관/계좌 관리 커스텀 엘리먼트.
 */
export class FnInstitutionForm extends HTMLElement {
  #institutions: Institution[] = [];
  #accounts: Account[] = [];

  connectedCallback(): void {
    this.classList.add('fn-institution-form');
    this.render();
  }

  /**
   * 컴포넌트 초기 DOM을 렌더링한다.
   * @returns {void}
   */
  private render(): void {
    this.innerHTML = /* html */ `
      <details class="fn-form-section" open>
        <summary>기관/계좌 목록</summary>
        <div id="fn-inst-mgmt-list" class="fn-inst-mgmt-list">불러오는 중...</div>
      </details>

      <details class="fn-form-section">
        <summary>금융기관 추가</summary>
        <div class="fn-form-row">
          <input id="fn-inst-name" type="text" placeholder="금융기관명" />
          <select id="fn-inst-type">
            <option value="bank">🏦 은행</option>
            <option value="insurance">🛡 보험</option>
            <option value="stock">📈 증권</option>
          </select>
          <button id="fn-add-inst-btn" class="fn-btn fn-btn-primary">추가</button>
        </div>
      </details>

      <details class="fn-form-section">
        <summary>계좌 추가</summary>
        <div class="fn-form-row">
          <select id="fn-acc-inst-sel">
            <option value="">-- 기관 선택 --</option>
          </select>
          <input id="fn-acc-name" type="text" placeholder="계좌명" />
          <input id="fn-acc-number" type="text" placeholder="계좌번호 (선택)" />
          <button id="fn-add-acc-btn" class="fn-btn fn-btn-primary">추가</button>
        </div>
      </details>

      <details class="fn-form-section">
        <summary>CSV Import</summary>
        <div class="fn-import-row">
          <label>기관/계좌 CSV</label>
          <input type="file" id="fn-import-inst-file" accept=".csv" />
          <button id="fn-import-inst-btn" class="fn-btn">import</button>
          <span id="fn-import-inst-result" class="fn-import-result"></span>
        </div>
        <div class="fn-import-row">
          <label>스냅샷 CSV</label>
          <input type="file" id="fn-import-snap-file" accept=".csv" />
          <button id="fn-import-snap-btn" class="fn-btn">import</button>
          <span id="fn-import-snap-result" class="fn-import-result"></span>
        </div>
      </details>

      <div class="fn-reset-section">
        <button id="fn-reset-all-btn" class="fn-btn fn-btn-danger">🗑 전체 초기화</button>
        <span class="fn-reset-desc">기관 · 계좌 · 스냅샷 모두 삭제</span>
      </div>`;

    this.#bindEvents();
    void this.#loadAll();
  }

  /**
   * 기관/계좌 데이터를 로드하고 화면을 갱신한다.
   * @returns {Promise<void>} 완료 Promise
   */
  async #loadAll(): Promise<void> {
    [this.#institutions, this.#accounts] = await Promise.all([fetchInstitutions(), fetchAllAccounts()]);
    this.#renderInstList();
    this.#refreshInstSelect();
  }

  /**
   * 계좌 추가용 기관 선택 박스를 갱신한다.
   * @returns {void}
   */
  #refreshInstSelect(): void {
    const sel = this.querySelector<HTMLSelectElement>('#fn-acc-inst-sel')!;
    if (sel) sel.innerHTML = '<option value="">-- 기관 선택 --</option>' + this.#institutions.map((i) => `<option value="${i.id}">${i.name}</option>`).join('');
  }

  /**
   * 기관별 계좌 그룹 맵을 생성한다.
   * @returns {Map<number, Account[]>} 기관 ID 기준 계좌 그룹
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
   * 데이터 변경 이벤트를 상위로 전달한다.
   * @returns {void}
   */
  #emitDataChanged(): void {
    this.dispatchEvent(new CustomEvent('fn:data-changed', { bubbles: true }));
  }

  /**
   * 변경 작업 후 공통 후처리를 수행한다.
   * @param {() => Promise<void>} action 변경 작업
   * @returns {Promise<void>} 완료 Promise
   */
  async #runMutation(action: () => Promise<void>): Promise<void> {
    await action();
    this.#emitDataChanged();
    await this.#loadAll();
  }

  /**
   * 기관/계좌 관리 목록을 렌더링한다.
   * @returns {void}
   */
  #renderInstList(): void {
    const container = this.querySelector<HTMLElement>('#fn-inst-mgmt-list');
    if (!container) return;

    if (this.#institutions.length === 0) {
      container.innerHTML = '<div class="fn-empty">등록된 기관이 없습니다.</div>';
      return;
    }

    const grouped = this.#groupAccountsByInstitution();

    container.innerHTML = this.#institutions
      .map((inst) => {
        const accounts = grouped.get(inst.id) ?? [];
        const icon = INST_ICON[inst.type];
        const label = INST_LABEL[inst.type];
        const accRows = accounts
          .map(
            (acc) => `<div class="fn-mgmt-acc-row">
              <span class="fn-mgmt-acc-name">${acc.name}${acc.accountNumber ? ` <small>${acc.accountNumber}</small>` : ''}</span>
              <button class="fn-btn fn-btn-xs fn-btn-danger fn-mgmt-del-acc" data-id="${acc.id}" data-name="${acc.name}">삭제</button>
            </div>`
          )
          .join('');
        return `<div class="fn-mgmt-inst-block">
          <div class="fn-mgmt-inst-header">
            <span class="fn-mgmt-inst-name">${icon} ${inst.name} <small class="fn-inst-type-badge">${label}</small></span>
            <span class="fn-mgmt-acc-count">${accounts.length}개 계좌</span>
            <button class="fn-btn fn-btn-xs fn-btn-danger fn-mgmt-del-inst" data-id="${inst.id}" data-name="${inst.name}">기관 삭제</button>
          </div>
          <div class="fn-mgmt-accs">${accRows || '<div class="fn-empty fn-empty-sm">계좌 없음</div>'}</div>
        </div>`;
      })
      .join('');

    // 기관 삭제
    container.querySelectorAll<HTMLButtonElement>('.fn-mgmt-del-inst').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm(`'${btn.dataset.name}' 기관과 모든 계좌를 삭제합니다. 계속하시겠습니까?`)) return;
        await this.#runMutation(() => deleteInstitution(Number(btn.dataset.id)));
      });
    });

    // 계좌 삭제
    container.querySelectorAll<HTMLButtonElement>('.fn-mgmt-del-acc').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm(`'${btn.dataset.name}' 계좌를 삭제합니다. 계속하시겠습니까?`)) return;
        await this.#runMutation(() => deleteAccount(Number(btn.dataset.id)));
      });
    });
  }

  /**
   * 사용자 액션 이벤트를 바인딩한다.
   * @returns {void}
   */
  #bindEvents(): void {
    // 기관 추가
    this.querySelector('#fn-add-inst-btn')?.addEventListener('click', async () => {
      const nameEl = this.querySelector<HTMLInputElement>('#fn-inst-name')!;
      const typeEl = this.querySelector<HTMLSelectElement>('#fn-inst-type')!;
      const name = nameEl.value.trim();
      if (!name) {
        alert('금융기관명을 입력하세요');
        return;
      }
      await this.#runMutation(() => addInstitution(name, typeEl.value as InstitutionType).then(() => undefined));
      nameEl.value = '';
    });

    // 계좌 추가
    this.querySelector('#fn-add-acc-btn')?.addEventListener('click', async () => {
      const instSel = this.querySelector<HTMLSelectElement>('#fn-acc-inst-sel')!;
      const nameEl = this.querySelector<HTMLInputElement>('#fn-acc-name')!;
      const numEl = this.querySelector<HTMLInputElement>('#fn-acc-number')!;
      const institutionId = Number(instSel.value);
      const name = nameEl.value.trim();
      if (!institutionId) {
        alert('기관을 선택하세요');
        return;
      }
      if (!name) {
        alert('계좌명을 입력하세요');
        return;
      }
      await this.#runMutation(() => addAccount(institutionId, name, numEl.value.trim()).then(() => undefined));
      nameEl.value = '';
      numEl.value = '';
    });

    // CSV import: 기관/계좌
    this.querySelector('#fn-import-inst-btn')?.addEventListener('click', async () => {
      const fileInput = this.querySelector<HTMLInputElement>('#fn-import-inst-file')!;
      const resultEl = this.querySelector<HTMLSpanElement>('#fn-import-inst-result')!;
      const file = fileInput.files?.[0];
      if (!file) {
        alert('CSV 파일을 선택하세요');
        return;
      }
      const csv = await file.text();
      resultEl.textContent = '처리 중...';
      try {
        const result = await importInstitutionsCsv(csv);
        resultEl.textContent = `완료: ${result.message}`;
        this.#emitDataChanged();
        await this.#loadAll();
      } catch {
        resultEl.textContent = 'import 실패';
      }
    });

    // CSV import: 스냅샷
    this.querySelector('#fn-import-snap-btn')?.addEventListener('click', async () => {
      const fileInput = this.querySelector<HTMLInputElement>('#fn-import-snap-file')!;
      const resultEl = this.querySelector<HTMLSpanElement>('#fn-import-snap-result')!;
      const file = fileInput.files?.[0];
      if (!file) {
        alert('CSV 파일을 선택하세요');
        return;
      }
      const csv = await file.text();
      resultEl.textContent = '처리 중...';
      try {
        const result = await importSnapshotsCsv(csv);
        resultEl.textContent = `완료: ${result.imported}건 저장, ${result.failed}건 실패`;
        this.#emitDataChanged();
      } catch {
        resultEl.textContent = 'import 실패';
      }
    });

    // 전체 초기화
    this.querySelector('#fn-reset-all-btn')?.addEventListener('click', async () => {
      if (!confirm('기관 · 계좌 · 스냅샷을 포함한 모든 데이터를 삭제합니다.\n정말 초기화하시겠습니까?')) return;
      await this.#runMutation(() => resetAll().then(() => undefined));
      alert('전체 초기화 완료');
    });
  }
}

customElements.define('fn-institution-form', FnInstitutionForm);
