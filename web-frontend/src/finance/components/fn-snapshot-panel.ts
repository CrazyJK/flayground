import { Account, Institution, SnapshotEntry, fetchAllAccounts, fetchInstitutions, fetchSnapshot, fetchSnapshotDates, fmtKrw, saveSnapshot } from '../domain/financial-note';

/**
 * 스냅샷 저장/조회 패널 커스텀 엘리먼트.
 * 현재 계좌 정보를 특정 날짜에 스냅샷으로 저장하고, 저장된 스냅샷을 조회한다.
 */
export class FnSnapshotPanel extends HTMLElement {
  connectedCallback(): void {
    this.classList.add('fn-snapshot-panel');
    this.render();
    this.#loadDates();
  }

  /** 외부에서 날짜 목록 새로고침 */
  refresh(): void {
    this.#loadDates();
  }

  private render(): void {
    const today = new Date().toISOString().slice(0, 10);
    this.innerHTML = /* html */ `
      <div class="fn-snapshot-save">
        <h4>스냅샷 저장</h4>
        <div class="fn-form-row">
          <input id="fn-snap-date" type="date" value="${today}" />
          <button id="fn-save-snap-btn" class="fn-btn fn-btn-primary">저장</button>
        </div>
        <span id="fn-snap-save-result" class="fn-save-result"></span>
      </div>
      <div class="fn-snapshot-list-wrap">
        <h4>저장된 스냅샷</h4>
        <ul id="fn-snap-dates" class="fn-snap-date-list"></ul>
      </div>
      <div id="fn-snap-detail" class="fn-snap-detail" style="display:none">
        <div class="fn-snap-detail-header">
          <h4 id="fn-snap-detail-title"></h4>
          <button id="fn-snap-detail-close" class="fn-btn">닫기</button>
        </div>
        <div id="fn-snap-detail-content"></div>
      </div>`;

    this.#bindEvents();
  }

  async #loadDates(): Promise<void> {
    const dates = await fetchSnapshotDates();
    const list = this.querySelector<HTMLUListElement>('#fn-snap-dates')!;
    if (dates.length === 0) {
      list.innerHTML = '<li class="fn-empty">저장된 스냅샷 없음</li>';
      return;
    }
    list.innerHTML = dates
      .map(
        (d) => /* html */ `
          <li class="fn-snap-date-item" data-date="${d}">
            <button class="fn-snap-date-btn">${d}</button>
          </li>`
      )
      .join('');

    list.querySelectorAll<HTMLButtonElement>('.fn-snap-date-btn').forEach((btn) => {
      btn.addEventListener('click', () => this.#showDetail(btn.closest('li')!.dataset.date!));
    });
  }

  async #showDetail(date: string): Promise<void> {
    const snap = await fetchSnapshot(date);
    const detailEl = this.querySelector<HTMLElement>('#fn-snap-detail')!;
    const titleEl = this.querySelector<HTMLElement>('#fn-snap-detail-title')!;
    const contentEl = this.querySelector<HTMLElement>('#fn-snap-detail-content')!;

    titleEl.textContent = `${date} 스냅샷`;

    // 기관별 그룹화
    const groups = new Map<string, { instType: string; entries: typeof snap.entries }>();
    for (const entry of snap.entries) {
      if (!groups.has(entry.instName)) groups.set(entry.instName, { instType: entry.instType, entries: [] });
      groups.get(entry.instName)!.entries.push(entry);
    }

    let total = 0;
    let groupHtml = '';
    for (const [instName, { entries }] of groups) {
      const sub = entries.reduce((s, e) => s + e.amount, 0);
      total += sub;
      const rows = entries.map((e) => `<tr><td>${e.name}</td><td class="fn-num">${fmtKrw(e.amount)}</td></tr>`).join('');
      groupHtml += /* html */ `
        <div class="fn-snap-group">
          <div class="fn-snap-group-name">${instName}</div>
          <table class="fn-snap-table"><tbody>${rows}</tbody></table>
          <div class="fn-snap-subtotal">소계: ${fmtKrw(sub)} 원</div>
        </div>`;
    }

    contentEl.innerHTML = `<div class="fn-snap-total">총 자산: <strong>${fmtKrw(total)}</strong> 원</div>${groupHtml}`;
    detailEl.style.display = '';
  }

  #bindEvents(): void {
    // 스냅샷 저장
    this.querySelector('#fn-save-snap-btn')?.addEventListener('click', async () => {
      const dateEl = this.querySelector<HTMLInputElement>('#fn-snap-date')!;
      const resultEl = this.querySelector<HTMLSpanElement>('#fn-snap-save-result')!;
      const date = dateEl.value;
      if (!date) {
        alert('날짜를 선택하세요');
        return;
      }

      try {
        // 현재 계좌 정보 + 기관 정보를 가져와서 스냅샷 생성
        const [accounts, institutions] = await Promise.all([fetchAllAccounts(), fetchInstitutions()]);
        const instMap = new Map<number, Institution>(institutions.map((i) => [i.id, i]));
        const entries: SnapshotEntry[] = accounts
          .filter((a) => a.amount !== 0)
          .map((a: Account) => {
            const inst = instMap.get(a.institutionId)!;
            return { accountId: a.id, name: a.name, amount: a.amount, instName: inst.name, instType: inst.type };
          });

        await saveSnapshot(date, entries);
        resultEl.textContent = `${date} 저장 완료`;
        await this.#loadDates();
        this.dispatchEvent(new CustomEvent('fn:snapshot-saved', { bubbles: true }));
      } catch {
        resultEl.textContent = '저장 실패';
      }
    });

    // 상세 닫기
    this.querySelector('#fn-snap-detail-close')?.addEventListener('click', () => {
      const detailEl = this.querySelector<HTMLElement>('#fn-snap-detail')!;
      detailEl.style.display = 'none';
    });
  }
}

customElements.define('fn-snapshot-panel', FnSnapshotPanel);
