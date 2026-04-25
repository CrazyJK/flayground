import { InstitutionType, addAccount, addInstitution, fetchInstitutions, importInstitutionsCsv, importSnapshotsCsv } from '../domain/financial-note';

/**
 * 금융기관/계좌 추가 폼 및 CSV import 커스텀 엘리먼트.
 */
export class FnInstitutionForm extends HTMLElement {
  connectedCallback(): void {
    this.classList.add('fn-institution-form');
    this.render();
  }

  private render(): void {
    this.innerHTML = /* html */ `
      <details class="fn-form-section" open>
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
      </details>`;

    this.#bindEvents();
    this.#loadInstitutions();
  }

  async #loadInstitutions(): Promise<void> {
    const institutions = await fetchInstitutions();
    const sel = this.querySelector<HTMLSelectElement>('#fn-acc-inst-sel')!;
    sel.innerHTML = '<option value="">-- 기관 선택 --</option>' + institutions.map((i) => `<option value="${i.id}">${i.name}</option>`).join('');
  }

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
      await addInstitution(name, typeEl.value as InstitutionType);
      nameEl.value = '';
      this.dispatchEvent(new CustomEvent('fn:data-changed', { bubbles: true }));
      await this.#loadInstitutions();
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
      await addAccount(institutionId, name, numEl.value.trim());
      nameEl.value = '';
      numEl.value = '';
      this.dispatchEvent(new CustomEvent('fn:data-changed', { bubbles: true }));
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
        this.dispatchEvent(new CustomEvent('fn:data-changed', { bubbles: true }));
        await this.#loadInstitutions();
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
        this.dispatchEvent(new CustomEvent('fn:data-changed', { bubbles: true }));
      } catch {
        resultEl.textContent = 'import 실패';
      }
    });
  }
}

customElements.define('fn-institution-form', FnInstitutionForm);
