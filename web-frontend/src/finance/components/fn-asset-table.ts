import { Account, Institution, SnapshotEntry, fetchAllAccounts, fetchInstitutions, fetchSnapshot, fetchSnapshotDates, fmtKrw, saveSnapshot, updateAccountAmount } from '../domain/financial-note';

const INST_ICON: Record<string, string> = { bank: '🏦', insurance: '🛡', stock: '📈' };
const INST_TYPE_CLASS: Record<string, string> = { bank: 'fn-inst-bank', insurance: 'fn-inst-insurance', stock: 'fn-inst-stock' };

/**
 * 기관/계좌 목록과 스냅샷을 엑셀처럼 한 테이블로 보여주는 커스텀 엘리먼트.
 * - 행: 계좌 (기관별 그룹 + 소계)
 * - 열: 현재 금액(수정 가능) + 최근 스냅샷 날짜들(읽기 전용)
 * - 상단 툴바: 스냅샷 저장
 */
export class FnAssetTable extends HTMLElement {
  #institutions: Institution[] = [];
  #accounts: Account[] = [];
  #snapDates: string[] = [];
  /** date → accountId → amount */
  #snapData = new Map<string, Map<number, number>>();
  #tdWidth: number = 100;

  connectedCallback(): void {
    this.classList.add('fn-asset-table');
    void this.load();
  }

  /** 서버에서 전체 데이터를 로드하고 렌더링한다 */
  async load(): Promise<void> {
    const [institutions, accounts, dates] = await Promise.all([fetchInstitutions(), fetchAllAccounts(), fetchSnapshotDates()]);
    this.#institutions = institutions;
    this.#accounts = accounts;
    // 모든 스냅샷을 오름차순으로 표시
    this.#snapDates = [...dates].sort();

    this.#snapData.clear();
    await Promise.all(
      this.#snapDates.map(async (date) => {
        const snap = await fetchSnapshot(date);
        const m = new Map<number, number>();
        for (const e of snap.entries) m.set(e.accountId, e.amount);
        this.#snapData.set(date, m);
      })
    );

    // --td-width CSS 변수로 tdWidth 설정. fn-sticky-col 클래스의 left 위치 계산에 사용한다.
    const style = getComputedStyle(this);
    const tdWidthStr = style.getPropertyValue('--td-width').trim();
    const tdWidthNum = parseInt(tdWidthStr);
    if (!isNaN(tdWidthNum)) this.#tdWidth = tdWidthNum;

    this.render();
  }

  /** 외부에서 새로고침 트리거 */
  refresh(): void {
    void this.load();
  }

  /** 증권 계좌 평가금액을 외부에서 업데이트한다 */
  updateStockAmount(accountId: number, evalAmount: number): void {
    const input = this.querySelector<HTMLInputElement>(`.fn-amount-input[data-id="${accountId}"]`);
    if (input) {
      input.dataset.raw = String(evalAmount);
      input.value = fmtKrw(evalAmount);
      const acc = this.#accounts.find((a) => a.id === accountId);
      if (acc) acc.amount = evalAmount;
      this.#updateTotals();
    }
  }

  private render(): void {
    const today = new Date().toISOString().slice(0, 10);

    // 기관별 계좌 그룹화
    const grouped = new Map<number, Account[]>();
    for (const inst of this.#institutions) {
      grouped.set(
        inst.id,
        this.#accounts.filter((a) => a.institutionId === inst.id)
      );
    }

    // sticky left 위치 계산 (px): this.#tdWidth (날짜) + this.#tdWidth (소계) * instIndex
    const subLefts = this.#institutions.map((_, i) => this.#tdWidth + i * this.#tdWidth);
    const grandLeft = this.#tdWidth + this.#institutions.length * this.#tdWidth;

    // 마지막 스냅샷 총합계 → .fn-total-value 표시
    const lastDate = this.#snapDates[this.#snapDates.length - 1];
    let lastSnapTotal = 0;
    if (lastDate) {
      const lastSnap = this.#snapData.get(lastDate);
      if (lastSnap) for (const amt of lastSnap.values()) lastSnapTotal += amt;
    }

    // ── 헤더 행 1: Date(rowspan=2) + 기관소계(rowspan=2) + 총합계(rowspan=2) + 오른쪽 기관그룹 ──
    let headerRow1 = `<tr><th rowspan="2" class="fn-th-date fn-sticky-col" style="left:0">Date</th>`;
    this.#institutions.forEach((inst, i) => {
      const colorClass = INST_TYPE_CLASS[inst.type] ?? 'fn-inst-other';
      const icon = INST_ICON[inst.type] ?? '🏛';
      headerRow1 += `<th rowspan="2" class="fn-th-sub fn-sticky-col fn-num ${colorClass}" style="left:${subLefts[i]}px">${icon} ${inst.name}</th>`;
    });
    headerRow1 += `<th rowspan="2" class="fn-th-grand-total fn-sticky-col fn-num" style="left:${grandLeft}px">총 합계</th>`;
    let firstRight = true;
    for (const inst of this.#institutions) {
      const accounts = grouped.get(inst.id) ?? [];
      if (accounts.length === 0) continue;
      const colorClass = INST_TYPE_CLASS[inst.type] ?? 'fn-inst-other';
      const icon = INST_ICON[inst.type] ?? '🏛';
      const secClass = firstRight ? ' fn-section-start' : '';
      firstRight = false;
      headerRow1 += `<th colspan="${accounts.length}" class="fn-th-inst-group ${colorClass}${secClass}"><span class="fn-inst-group-name">${icon} ${inst.name}</span></th>`;
    }
    headerRow1 += '</tr>';

    // ── 헤더 행 2: 오른쪽 계좌명 (좌우 sticky 없음) ──
    let headerRow2 = '<tr>';
    let firstAcc = true;
    for (const inst of this.#institutions) {
      for (const acc of grouped.get(inst.id) ?? []) {
        const secClass = firstAcc ? 'fn-section-start' : '';
        firstAcc = false;
        headerRow2 += `<th class="fn-th-acc ${secClass}"><span class="fn-acc-name">${acc.name}</span></th>`;
      }
    }
    headerRow2 += '</tr>';

    // ── 스냅샷 행들 ──
    let snapRows = '';
    for (const date of this.#snapDates) {
      const snapMap = this.#snapData.get(date);
      let rowTotal = 0;
      let leftCells = '';
      let rightCells = '';
      let firstRightCell = true;
      this.#institutions.forEach((inst, i) => {
        const accounts = grouped.get(inst.id) ?? [];
        let instSub = 0;
        for (const acc of accounts) {
          const amt = snapMap?.get(acc.id) ?? 0;
          rowTotal += amt;
          instSub += amt;
          const secClass = firstRightCell ? ' fn-section-start' : '';
          firstRightCell = false;
          rightCells += `<td class="fn-snap-cell fn-num${secClass}${amt < 0 ? ' fn-negative' : ''}">${amt !== 0 ? fmtKrw(amt) : '-'}</td>`;
        }
        leftCells += `<td class="fn-snap-subtotal fn-num fn-sticky-col${instSub < 0 ? ' fn-negative' : ''}" style="left:${subLefts[i]}px">${fmtKrw(instSub)}</td>`;
      });
      snapRows += `<tr class="fn-snap-tr">
        <td class="fn-date-cell fn-sticky-col" style="left:0">${date}</td>
        ${leftCells}
        <td class="fn-snap-grand fn-num fn-sticky-col${rowTotal < 0 ? ' fn-negative' : ''}" style="left:${grandLeft}px">${fmtKrw(rowTotal)}</td>
        ${rightCells}
      </tr>`;
    }

    // ── 현재 행 (오늘 날짜, 직접 입력 가능) ──
    let currentLeftCells = '';
    let currentRightCells = '';
    let currentTotal = 0;
    let firstCurrentRight = true;
    this.#institutions.forEach((inst, i) => {
      const accounts = grouped.get(inst.id) ?? [];
      let instSub = 0;
      for (const acc of accounts) {
        currentTotal += acc.amount;
        instSub += acc.amount;
        const secClass = firstCurrentRight ? ' fn-section-start' : '';
        firstCurrentRight = false;
        currentRightCells += `<td class="fn-current-cell${secClass}" title="${inst.name}: ${acc.name}">
          <span class="fn-current-cell-inner">
            <input class="fn-amount-input${acc.amount < 0 ? ' fn-negative' : ''}" type="text"
              value="${fmtKrw(acc.amount)}" data-raw="${acc.amount}"
              data-id="${acc.id}" data-inst-id="${inst.id}"
            />
          </span>
        </td>`;
      }
      currentLeftCells += `<td class="fn-subtotal-cell fn-num fn-sticky-col${instSub < 0 ? ' fn-negative' : ''}" data-inst-subtotal="${inst.id}" style="left:${subLefts[i]}px">${fmtKrw(instSub)}</td>`;
    });

    const negLastSnap = lastSnapTotal < 0 ? ' fn-negative' : '';
    this.innerHTML = /* html */ `
      <div class="fn-asset-toolbar">
        <span class="fn-total-badge">총 자산: <strong class="fn-total-value${negLastSnap}">${fmtKrw(lastSnapTotal)}</strong> 원 <small class="fn-total-date">(${lastDate ?? '-'})</small></span>
        <button id="fn-save-snap-btn" class="fn-btn fn-btn-primary">💾 스냅샷 저장 (${today})</button>
        <span id="fn-snap-save-result" class="fn-save-result"></span>
        <button id="fn-table-collapse-btn" class="fn-btn fn-btn-xs">▼ 접기</button>
      </div>
      <div class="fn-table-wrapper">
        <table class="fn-asset-tbl">
          <thead>
            ${headerRow1}
            ${headerRow2}
          </thead>
          <tbody>
            ${snapRows}
            <tr class="fn-current-tr">
              <td class="fn-date-cell fn-current-label fn-sticky-col" style="left:0">${today}</td>
              ${currentLeftCells}
              <td class="fn-total-now fn-num fn-sticky-col${currentTotal < 0 ? ' fn-negative' : ''}" id="fn-grand-total" style="left:${grandLeft}px">${fmtKrw(currentTotal)}</td>
              ${currentRightCells}
            </tr>
          </tbody>
        </table>
      </div>`;

    this.#bindEvents();
  }

  #bindEvents(): void {
    // 금액 입력 처리
    this.querySelectorAll<HTMLInputElement>('.fn-amount-input').forEach((input) => {
      input.addEventListener('focus', () => {
        input.value = input.dataset.raw ?? '0';
        input.select();
      });
      input.addEventListener('blur', async () => {
        const raw = parseFloat(input.value.replace(/,/g, '')) || 0;
        const id = Number(input.dataset.id);
        input.dataset.raw = String(raw);
        input.value = fmtKrw(raw);
        await updateAccountAmount(id, raw);
        const acc = this.#accounts.find((a) => a.id === id);
        if (acc) acc.amount = raw;
        this.#updateTotals();
        this.dispatchEvent(new CustomEvent('fn:data-changed', { bubbles: true }));
      });
      input.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
      });
    });

    // 스냅샷 저장 (항상 오늘 날짜)
    this.querySelector('#fn-save-snap-btn')?.addEventListener('click', async () => {
      const resultEl = this.querySelector<HTMLSpanElement>('#fn-snap-save-result')!;
      const date = new Date().toISOString().slice(0, 10);
      try {
        const instMap = new Map<number, Institution>(this.#institutions.map((i) => [i.id, i]));
        const entries: SnapshotEntry[] = this.#accounts
          .filter((a) => a.amount !== 0)
          .map((a) => {
            const inst = instMap.get(a.institutionId)!;
            return { accountId: a.id, name: a.name, amount: a.amount, instName: inst.name, instType: inst.type };
          });
        await saveSnapshot(date, entries);
        resultEl.textContent = `${date} 저장 완료`;
        await this.load();
        this.dispatchEvent(new CustomEvent('fn:snapshot-saved', { bubbles: true }));
      } catch {
        resultEl.textContent = '저장 실패';
      }
    });

    // 테이블 접기/펼치기
    const collapseBtn = this.querySelector<HTMLButtonElement>('#fn-table-collapse-btn')!;
    collapseBtn?.addEventListener('click', () => {
      const collapsed = this.classList.toggle('fn-table-collapsed');
      collapseBtn.textContent = collapsed ? '▲ 펼치기' : '▼ 접기';
    });
  }

  /** 합계/소계 DOM만 재계산 (서버 재로드 없이) */
  #updateTotals(): void {
    let total = 0;
    const instTotals = new Map<number, number>();

    this.querySelectorAll<HTMLInputElement>('.fn-amount-input').forEach((input) => {
      const raw = parseFloat(input.dataset.raw ?? '0') || 0;
      total += raw;
      const instId = Number(input.dataset.instId);
      instTotals.set(instId, (instTotals.get(instId) ?? 0) + raw);
    });

    const totalValueEl = this.querySelector<HTMLElement>('.fn-total-value');
    if (totalValueEl) totalValueEl.textContent = fmtKrw(total);
    const grandTotalEl = this.querySelector<HTMLElement>('#fn-grand-total');
    if (grandTotalEl) grandTotalEl.textContent = fmtKrw(total);

    instTotals.forEach((sub, instId) => {
      const el = this.querySelector<HTMLElement>(`[data-inst-subtotal="${instId}"]`);
      if (el) {
        el.textContent = fmtKrw(sub);
        el.classList.toggle('fn-negative', sub < 0);
      }
    });
    const grandTotalClassEl = this.querySelector<HTMLElement>('#fn-grand-total');
    if (grandTotalClassEl) grandTotalClassEl.classList.toggle('fn-negative', total < 0);
  }
}

customElements.define('fn-asset-table', FnAssetTable);
