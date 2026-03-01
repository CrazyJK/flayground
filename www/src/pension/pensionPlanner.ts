/**
 * DC 퇴직연금 리밸런싱 플래너 모듈
 *
 * 위험자산 70% 한도 내에서 최적 포트폴리오를 자동 계산합니다.
 * - 현재 보유 자산 관리 (위험/안전자산, 현금)
 * - 투자 계획 및 자금 배분 (드래그 가능한 비율 스택 바)
 * - 리밸런싱 후 포트폴리오 시뮬레이션
 * - 파이 차트 기반 현재/리밸런싱 후 비교
 */

/* ========== 타입 정의 ========== */

/** 현재 보유 자산 행 데이터 */
interface CurrentAssetRow {
  name: string;
  eval: number;
}

/** 투자 계획 행 데이터 */
interface PlanRow {
  name: string;
  ratio: number;
}

/** FlayStorage 저장 데이터 구조 */
interface PlannerStorageData {
  cash: string;
  currentRisk: CurrentAssetRow[];
  currentSafe: CurrentAssetRow[];
  planRisk: PlanRow[];
  planSafe: PlanRow[];
}

/** 행 추가 시 기본값 옵션 */
interface AssetDefaults {
  name?: string;
  eval?: number;
  ratio?: number;
}

/* ========== 헬퍼 유틸 ========== */

/** 숫자를 한국어 천단위 콤마 포맷 문자열로 변환 */
const fmt = (n: number): string => Math.round(n).toLocaleString('ko-KR');

/** 두 값의 비율을 백분율 문자열로 변환 (예: "42.5%") */
const pct = (a: number, b: number): string => (b ? ((a / b) * 100).toFixed(1) + '%' : '0%');

/** 두 값의 비율을 백분율 숫자로 변환 */
const pctN = (a: number, b: number): number => (b ? (a / b) * 100 : 0);

/** 콤마가 포함된 문자열/숫자에서 순수 숫자값 파싱 */
const pv = (v: string | number): number => {
  const n = parseFloat(String(v).replace(/,/g, ''));
  return isNaN(n) ? 0 : n;
};

/**
 * DC 퇴직연금 리밸런싱 플래너
 *
 * HTML 템플릿의 DOM 요소를 기반으로 자산 관리, 비율 조정, 포트폴리오 계산을 수행합니다.
 * 인라인 이벤트 핸들러(onclick, oninput)를 위해 필요한 메서드를 window에 전역 등록합니다.
 */
export class PensionPlanner {
  /** localStorage 저장 키 */
  private static readonly STORAGE_KEY = 'pensionPlanner';

  private currentRiskId = 0;
  private currentSafeId = 0;
  private planRiskId = 0;
  private planSafeId = 0;

  constructor() {
    this.registerGlobalHandlers();
    this.initDefaults();
    this.updateRatioBars('risk');
    this.updateRatioBars('safe');
    this.calculate();
    console.log('PensionPlanner initialized');
  }

  /* ========== 전역 핸들러 등록 ========== */

  /**
   * HTML 인라인 이벤트 핸들러(onclick, oninput)에서 호출할 함수들을 window에 등록.
   * 모든 메서드는 this 바인딩된 상태로 등록됨
   */
  private registerGlobalHandlers(): void {
    Object.assign(window, {
      addCurrentRiskRow: (d?: AssetDefaults) => this.addCurrentRiskRow(d),
      addCurrentSafeRow: (d?: AssetDefaults) => this.addCurrentSafeRow(d),
      delCurrentRow: (id: string) => this.delCurrentRow(id),
      addPlanRiskRow: (d?: AssetDefaults) => this.addPlanRiskRow(d),
      addPlanSafeRow: (d?: AssetDefaults) => this.addPlanSafeRow(d),
      delPlanRow: (id: string) => this.delPlanRow(id),
      fmtEl: (el: HTMLInputElement) => this.fmtEl(el),
      calculate: () => this.calculate(),
      updateRatioBars: (type: string) => this.updateRatioBars(type),
      onRatioInputChange: (type: string, idx: number, val: number) => this.onRatioInputChange(type, idx, val),
    });
  }

  /* ========== 입력 포맷 ========== */

  /** 입력 요소의 값을 천단위 콤마 포맷으로 변환하고 재계산 트리거 */
  private fmtEl(el: HTMLInputElement): void {
    const r = el.value.replace(/[^0-9]/g, '');
    el.value = r ? parseInt(r).toLocaleString('ko-KR') : '';
    this.calculate();
  }

  /* ========== 현재 보유 자산 - 행 관리 ========== */

  /** 위험자산 보유 행 추가 */
  addCurrentRiskRow(d: AssetDefaults = {}): void {
    const id = ++this.currentRiskId;
    const tr = document.createElement('tr');
    tr.id = `cr-${id}`;
    tr.innerHTML = `
      <td><input type="text" value="${d.name || ''}" placeholder="ETF 상품명" onchange="calculate()"></td>
      <td><input type="text" value="${d.eval ? d.eval.toLocaleString('ko-KR') : ''}" placeholder="0" inputmode="numeric" style="text-align:right;" oninput="fmtEl(this)"></td>
      <td style="text-align:center"><button class="btn-del" onclick="delCurrentRow('cr-${id}')">×</button></td>`;
    document.getElementById('current-risk-body')!.appendChild(tr);
    this.calculate();
  }

  /** 안전자산 보유 행 추가 */
  addCurrentSafeRow(d: AssetDefaults = {}): void {
    const id = ++this.currentSafeId;
    const tr = document.createElement('tr');
    tr.id = `cs-${id}`;
    tr.innerHTML = `
      <td><input type="text" value="${d.name || ''}" placeholder="안전자산 상품명" onchange="calculate()"></td>
      <td><input type="text" value="${d.eval ? d.eval.toLocaleString('ko-KR') : ''}" placeholder="0" inputmode="numeric" style="text-align:right;" oninput="fmtEl(this)"></td>
      <td style="text-align:center"><button class="btn-del" onclick="delCurrentRow('cs-${id}')">×</button></td>`;
    document.getElementById('current-safe-body')!.appendChild(tr);
    this.calculate();
  }

  /** 보유 자산 행 삭제. 삭제된 평가금액은 현금에 복원 */
  private delCurrentRow(id: string): void {
    const el = document.getElementById(id);
    if (!el) return;

    const tds = el.querySelectorAll('td');
    const evalAmount = pv((tds[1]!.querySelector('input') as HTMLInputElement).value);
    if (evalAmount > 0) {
      const cashEl = document.getElementById('i-cash') as HTMLInputElement;
      const currentCash = pv(cashEl.value);
      cashEl.value = (currentCash + evalAmount).toLocaleString('ko-KR');
    }
    el.remove();
    this.calculate();
  }

  /* ========== 투자 계획 - 행 관리 ========== */

  /**
   * 투자 계획 행 추가 (위험/안전자산 공용).
   * 기존 항목이 있으면 비율을 자동 재분배하여 새 항목에 할당
   * @param type - 'risk' 또는 'safe'
   * @param d - 행 기본값
   */
  private addPlanRow(type: 'risk' | 'safe', d: AssetDefaults = {}): void {
    const isRisk = type === 'risk';
    const id = isRisk ? ++this.planRiskId : ++this.planSafeId;
    const prefix = isRisk ? 'pr' : 'ps';
    const planBody = document.getElementById(isRisk ? 'plan-risk-body' : 'plan-safe-body')!;
    const rows = Array.from(planBody.querySelectorAll('tr')) as HTMLTableRowElement[];
    const placeholder = isRisk ? 'KOSPI 추종 ETF' : '안전자산 상품명';
    const ratioClass = isRisk ? 'risk-ratio-input' : 'safe-ratio-input';
    let ratio = 100;
    let name = d.name;

    if (rows.length > 0) {
      // 기존 상품 비율에서 일정 비율만큼(각 항목의 1/(m+1)) 줄이고, 남은 비율을 새 상품에 할당
      const m = rows.length;
      const factor = m / (m + 1);
      let sumNew = 0;
      rows.forEach((row) => {
        const orig = Number(row.dataset.ratio) || Number((row.querySelector('input[type="number"]') as HTMLInputElement)?.value) || 0;
        let newVal = Math.round(orig * factor);
        if (newVal < 1) newVal = 1;
        row.dataset.ratio = String(newVal);
        const input = row.querySelector('input[type="number"]') as HTMLInputElement | null;
        if (input) input.value = String(newVal);
        sumNew += newVal;
      });
      let remain = 100 - sumNew;
      // 남은 값이 1 미만이면 마지막 기존 항목에서 보정
      if (remain < 1) {
        const last = rows[rows.length - 1]!;
        let lastVal = Number(last.dataset.ratio) || 1;
        const need = 1 - remain;
        lastVal = Math.max(1, lastVal - need);
        last.dataset.ratio = String(lastVal);
        const lastInput = last.querySelector('input[type="number"]') as HTMLInputElement | null;
        if (lastInput) lastInput.value = String(lastVal);
        sumNew = rows.reduce((s, r) => s + (Number(r.dataset.ratio) || 0), 0);
        remain = Math.max(1, 100 - sumNew);
      }
      ratio = remain;
      name = d.name || `신 상품${m + 1}`;
    } else {
      ratio = d.ratio !== undefined ? d.ratio : 100;
      name = d.name || '신 상품1';
    }

    const tr = document.createElement('tr');
    tr.id = `${prefix}-${id}`;
    tr.dataset.ratio = String(ratio);
    tr.innerHTML = `
      <td><input type="text" value="${name}" placeholder="${placeholder}" onchange="updateRatioBars('${type}');calculate();"></td>
      <td><input type="number" class="${ratioClass} ratio-input" min="1" max="100" value="${ratio}" style="width:60px;font-size:13px;text-align:right;"></td>
      <td style="text-align:right;font-weight:600;" class="alloc-amount">—</td>
      <td style="text-align:center"><button class="btn-del" onclick="delPlanRow('${prefix}-${id}')">×</button></td>`;
    planBody.appendChild(tr);
    const newInput = tr.querySelector('input[type="number"]') as HTMLInputElement | null;
    if (newInput) newInput.value = String(ratio);
    this.updateRatioBars(type);
    this.calculate();
  }

  /** 위험자산 계획 행 추가 */
  addPlanRiskRow(d: AssetDefaults = {}): void {
    this.addPlanRow('risk', d);
  }

  /** 안전자산 계획 행 추가 */
  addPlanSafeRow(d: AssetDefaults = {}): void {
    this.addPlanRow('safe', d);
  }

  /**
   * 투자 계획 행 삭제.
   * 남은 상품들의 비율을 기존 비중에 비례하여 자동 재분배
   */
  private delPlanRow(id: string): void {
    const el = document.getElementById(id);
    if (!el) return;

    const isRisk = id.startsWith('pr-');
    const planBody = document.getElementById(isRisk ? 'plan-risk-body' : 'plan-safe-body')!;
    el.remove();

    // 남은 상품 비율을 기존 비중에 비례하여 재분배
    const rows = Array.from(planBody.querySelectorAll('tr')) as HTMLTableRowElement[];
    const n = rows.length;
    if (n > 0) {
      const sumRem = rows.reduce((s, r) => s + (Number(r.dataset.ratio) || 0), 0) || 0;
      if (sumRem <= 0) {
        // 모두 0이면 균등 분배
        const even = Math.floor(100 / n);
        const lastRemain = 100 - even * (n - 1);
        rows.forEach((row, i) => {
          const val = i === n - 1 ? lastRemain : even;
          row.dataset.ratio = String(val);
          const input = row.querySelector('input[type="number"]') as HTMLInputElement | null;
          if (input) input.value = String(val);
        });
      } else {
        // 비례 재분배: 각 항목의 비중을 보존하면서 총합을 100으로 맞춤
        let sumNew = 0;
        rows.forEach((row) => {
          const orig = Number(row.dataset.ratio) || 0;
          let newVal = Math.round((orig / sumRem) * 100);
          if (newVal < 1) newVal = 1;
          row.dataset.ratio = String(newVal);
          const input = row.querySelector('input[type="number"]') as HTMLInputElement | null;
          if (input) input.value = String(newVal);
          sumNew += newVal;
        });
        // 합계가 100이 아닐 경우 마지막 항목에서 보정
        const diff = 100 - sumNew;
        if (diff !== 0) {
          const last = rows[rows.length - 1]!;
          let lastVal = Number(last.dataset.ratio) || 0;
          lastVal = Math.max(1, lastVal + diff);
          last.dataset.ratio = String(lastVal);
          const lastInput = last.querySelector('input[type="number"]') as HTMLInputElement | null;
          if (lastInput) lastInput.value = String(lastVal);
        }
      }
    }
    this.updateRatioBars(isRisk ? 'risk' : 'safe');
    this.calculate();
  }

  /* ========== 데이터 수집 ========== */

  /** 현재 보유 데이터 수집 (위험/안전 공용) */
  private getCurrentRows(bodyId: string): CurrentAssetRow[] {
    return Array.from(document.querySelectorAll(`#${bodyId} tr`))
      .map((tr) => {
        const inputs = tr.querySelectorAll('input') as NodeListOf<HTMLInputElement>;
        return {
          name: inputs[0]?.value.trim() || '',
          eval: pv(inputs[1]?.value || '0'),
        };
      })
      .filter((r) => r.eval > 0 || r.name);
  }

  /** 투자 계획 데이터 수집 (위험/안전 공용) */
  private getPlanRows(bodyId: string): PlanRow[] {
    return Array.from(document.querySelectorAll(`#${bodyId} tr`))
      .map((tr) => {
        const input = tr.querySelector('input') as HTMLInputElement | null;
        return {
          name: input?.value.trim() || '',
          ratio: parseFloat((tr as HTMLElement).dataset.ratio || '0') || 0,
        };
      })
      .filter((r) => r.name);
  }

  /* ========== 비율 바 UI ========== */

  /**
   * 인접한 두 세그먼트의 비율을 드래그/입력값 기준으로 조정.
   * 두 세그먼트의 합을 보존하면서 좌측 비율을 val%로 재분배
   * @param type - 'risk' 또는 'safe'
   * @param idx - 좌측 세그먼트 인덱스
   * @param val - 좌측 비율 (0-100 범위의 퍼센트)
   */
  private onRatioInputChange(type: string, idx: number, val: number): void {
    const bodyId = type === 'risk' ? 'plan-risk-body' : 'plan-safe-body';
    const rows = Array.from(document.querySelectorAll<HTMLTableRowElement>(`#${bodyId} tr`));

    if (rows.length < 2) {
      rows[0]!.dataset.ratio = '100';
      const input = rows[0]!.querySelector('input[type="number"]') as HTMLInputElement | null;
      if (input) input.value = '100';
      this.updateRatioBars(type);
      this.calculate();
      return;
    }

    const nextIdx = idx + 1;
    if (nextIdx >= rows.length) {
      return this.onRatioInputChange(type, idx - 1, val);
    }

    // 현재 두 세그먼트의 합을 보존하면서 좌측을 val%로 재분배
    const leftOrig = Number(rows[idx]!.dataset.ratio) || 0;
    const rightOrig = Number(rows[nextIdx]!.dataset.ratio) || 0;
    let pairTotal = leftOrig + rightOrig;
    if (pairTotal <= 0) pairTotal = 100;

    let percent = Math.round(Number(val) || 0);
    percent = Math.max(0, Math.min(100, percent));

    let leftAbs = Math.round((percent / 100) * pairTotal);
    leftAbs = Math.max(1, Math.min(pairTotal - 1, leftAbs));
    const rightAbs = pairTotal - leftAbs;

    rows[idx]!.dataset.ratio = String(leftAbs);
    rows[nextIdx]!.dataset.ratio = String(rightAbs);

    // 모든 행의 input value와 dataset.ratio 동기화
    rows.forEach((tr) => {
      const ratio = Number(tr.dataset.ratio) || 0;
      const input = tr.querySelector('input[type="number"]') as HTMLInputElement | null;
      if (input) input.value = String(ratio);
    });

    this.updateRatioBars(type);
    this.calculate();
  }

  /**
   * 스택 바 세그먼트에 드래그 디바이더 이벤트 바인딩.
   * 디바이더를 드래그하면 인접 세그먼트 비율이 실시간 조정됨
   */
  private initDragDividers(type: string): void {
    const stackedBar = document.getElementById('stacked-' + type);
    if (!stackedBar) return;

    const dividers = stackedBar.querySelectorAll('.ratio-divider');
    dividers.forEach((divider, idx) => {
      (divider as HTMLElement).onmousedown = (e: MouseEvent): void => {
        e.preventDefault();
        const leftSeg = (divider as HTMLElement).parentElement as HTMLElement;
        const rightSeg = leftSeg.nextElementSibling as HTMLElement;
        if (!leftSeg || !rightSeg) return;

        // 드래그 중 부드러운 동작을 위해 트랜지션 비활성화
        leftSeg.style.transition = 'none';
        rightSeg.style.transition = 'none';

        const leftRect = leftSeg.getBoundingClientRect();
        const rightRect = rightSeg.getBoundingClientRect();
        const pairLeft = leftRect.left;
        const pairWidth = leftRect.width + rightRect.width;

        const onMove = (ev: MouseEvent): void => {
          const px = Math.max(0, Math.min(ev.clientX - pairLeft, pairWidth));
          let leftPct = Math.round((px / pairWidth) * 100);
          leftPct = Math.max(1, Math.min(99, leftPct));
          this.onRatioInputChange(type, idx, leftPct);
        };

        const onUp = (): void => {
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
          leftSeg.style.transition = '';
          rightSeg.style.transition = '';
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      };
    });
  }

  /**
   * 비율 스택 바 UI 업데이트.
   * 투자 계획 행의 비율을 시각적 스택 바와 범례로 렌더링
   */
  updateRatioBars(type: string): void {
    const bodyId = type === 'risk' ? 'plan-risk-body' : 'plan-safe-body';
    const barsId = type === 'risk' ? 'risk-ratio-bars' : 'safe-ratio-bars';
    const rows = Array.from(document.querySelectorAll<HTMLTableRowElement>(`#${bodyId} tr`));
    const barsContainer = document.getElementById(barsId)!;

    if (rows.length === 0) {
      barsContainer.innerHTML = '<div style="text-align:center;color:var(--text2);padding:20px;">상품을 추가하세요</div>';
      return;
    }

    // 현재 비율 합계 계산 및 기본값 설정
    const currentSum = rows.reduce((sum, tr) => sum + (parseFloat(tr.dataset.ratio || '0') || 0), 0);
    rows.forEach((tr, idx) => {
      if (!tr.dataset.ratio || tr.dataset.ratio === '0') {
        const remaining = Math.max(0, 100 - currentSum);
        const defaultVal = idx === 0 && currentSum === 0 ? 100 : remaining;
        tr.dataset.ratio = String(defaultVal);
      }
    });

    // Stacked bar HTML 생성
    const colorVariants = ['0', '1', '2', '3', '4'];
    let barHtml = `<div class="ratio-stacked-bar" id="stacked-${type}">`;

    rows.forEach((tr, idx) => {
      const name = (tr.querySelector('input') as HTMLInputElement).value.trim() || `상품 ${idx + 1}`;
      const ratio = parseFloat(tr.dataset.ratio || '0') || 0;
      const colorClass = `${type}-${colorVariants[idx % colorVariants.length]}`;
      barHtml += `<div class="ratio-segment ${colorClass}" data-row-id="${tr.id}" style="flex:${ratio};">`;
      barHtml += `<span class="segment-label">${name} ${ratio.toFixed(0)}%</span>`;
      if (idx < rows.length - 1) {
        barHtml += `<div class="ratio-divider" data-index="${idx}"></div>`;
      }
      barHtml += '</div>';
    });

    barHtml += '</div>';
    barsContainer.innerHTML = barHtml;

    // 드래그 이벤트 바인딩
    this.initDragDividers(type);
  }

  /* ========== 포트폴리오 계산 ========== */

  /** 전체 포트폴리오 계산 및 UI 업데이트 */
  calculate(): void {
    const currentRisk = this.getCurrentRows('current-risk-body').filter((r) => r.eval > 0);
    const currentSafe = this.getCurrentRows('current-safe-body').filter((r) => r.eval > 0);
    const planRisk = this.getPlanRows('plan-risk-body');
    const planSafe = this.getPlanRows('plan-safe-body');
    const cashExist = pv((document.getElementById('i-cash') as HTMLInputElement).value);

    // 현재 자산 합계 업데이트
    const currentRiskSum = currentRisk.reduce((a, r) => a + r.eval, 0);
    const currentSafeSum = currentSafe.reduce((a, r) => a + r.eval, 0);
    document.getElementById('current-risk-sum')!.textContent = fmt(Math.round(currentRiskSum)) + '원';
    document.getElementById('current-safe-sum')!.textContent = fmt(Math.round(currentSafeSum)) + '원';
    document.getElementById('available-cash')!.textContent = fmt(cashExist) + ' 원';

    // 현재 포트폴리오 비율
    const curTotal = currentRiskSum + currentSafeSum + cashExist;
    const curRiskPct = pctN(currentRiskSum, curTotal);
    const curSafePct = pctN(currentSafeSum, curTotal);

    document.getElementById('current-total')!.textContent = fmt(Math.round(curTotal)) + ' 원';
    document.getElementById('current-risk-pct')!.textContent = curRiskPct.toFixed(1) + '%';
    document.getElementById('current-safe-pct')!.textContent = curSafePct.toFixed(1) + '%';
    document.getElementById('current-cash-pct')!.textContent = pctN(cashExist, curTotal).toFixed(1) + '%';

    // 현재 파이 차트 업데이트
    const currentPieEl = document.getElementById('current-pie')!;
    setTimeout(() => {
      if (curTotal > 0) {
        const riskEnd = curRiskPct;
        const safeEnd = riskEnd + curSafePct;
        currentPieEl.style.background = `conic-gradient(
          var(--orange) 0% ${riskEnd}%,
          var(--green) ${riskEnd}% ${safeEnd}%,
          #6c757d ${safeEnd}% 100%
        )`;
      } else {
        currentPieEl.style.background = '#e1e4e8';
      }
    }, 50);

    // 투자 계획 없으면 초기 상태 표시 후 종료
    if (planRisk.length === 0) {
      document.getElementById('err')!.style.display = 'block';
      document.getElementById('final-total')!.textContent = '—';
      document.getElementById('final-risk-pct')!.textContent = '—';
      document.getElementById('final-safe-pct')!.textContent = '—';
      document.getElementById('final-cash-pct')!.textContent = '—';
      document.getElementById('portfolio-body')!.innerHTML = '';
      document.getElementById('final-pie')!.style.background = '#e1e4e8';
      document.getElementById('risk-ratio-sum')!.textContent = '0%';
      document.getElementById('safe-ratio-sum')!.textContent = '0%';
      document.getElementById('risk-alloc-amount')!.textContent = '—';
      document.getElementById('safe-alloc-amount')!.textContent = '—';
      document.querySelectorAll('#plan-risk-body .alloc-amount').forEach((el) => (el.textContent = '—'));
      document.querySelectorAll('#plan-safe-body .alloc-amount').forEach((el) => (el.textContent = '—'));
      return;
    }
    document.getElementById('err')!.style.display = 'none';

    // 비율 합계 표시 및 100% 일치 경고
    const riskRatioSum = planRisk.reduce((sum, r) => sum + r.ratio, 0);
    const safeRatioSum = planSafe.reduce((sum, s) => sum + s.ratio, 0);

    this.updateRatioSumDisplay('risk-ratio-sum', 'risk-ratio-warn', riskRatioSum);
    this.updateRatioSumDisplay('safe-ratio-sum', 'safe-ratio-warn', safeRatioSum);

    // 자금 배분 (전체 자산 기준 70:30 리밸런싱)
    const totalAssets = currentRiskSum + currentSafeSum + cashExist;
    const targetRisk = totalAssets * 0.7;
    const targetSafe = totalAssets * 0.3;
    const riskAlloc = targetRisk - currentRiskSum;
    const safeAlloc = targetSafe - currentSafeSum;

    document.getElementById('risk-alloc-amount')!.textContent = fmt(Math.round(riskAlloc)) + ' 원';
    document.getElementById('safe-alloc-amount')!.textContent = fmt(Math.round(safeAlloc)) + ' 원';

    // 행별 배분 금액 업데이트
    this.updateAllocAmounts('#plan-risk-body tr', planRisk, riskRatioSum, riskAlloc);
    this.updateAllocAmounts('#plan-safe-body tr', planSafe, safeRatioSum, safeAlloc);

    // 리밸런싱 후 포트폴리오 계산
    const finalRiskTotal = currentRiskSum + riskAlloc;
    const finalSafeTotal = currentSafeSum + safeAlloc;
    const finalTotal = finalRiskTotal + finalSafeTotal;
    const finalRiskPct = pctN(finalRiskTotal, finalTotal);
    const finalSafePct = pctN(finalSafeTotal, finalTotal);

    document.getElementById('final-total')!.textContent = fmt(Math.round(finalTotal)) + ' 원';
    document.getElementById('final-risk-pct')!.textContent = finalRiskPct.toFixed(1) + '%';
    document.getElementById('final-safe-pct')!.textContent = finalSafePct.toFixed(1) + '%';
    document.getElementById('final-cash-pct')!.textContent = '0.0%';

    // 리밸런싱 후 파이 차트
    const finalPieEl = document.getElementById('final-pie')!;
    setTimeout(() => {
      finalPieEl.style.background = `conic-gradient(
        var(--orange) 0% ${finalRiskPct}%,
        var(--green) ${finalRiskPct}% 100%
      )`;
    }, 50);

    // 포트폴리오 테이블 생성
    let tbody = '';
    tbody += this.buildPortfolioRows(planRisk, currentRisk, riskRatioSum, riskAlloc, finalTotal, false);
    tbody += `<tr class="total">
      <td><strong>위험자산 소계</strong></td>
      <td><strong>${fmt(Math.round(finalRiskTotal))}</strong></td>
      <td><strong>${finalRiskPct.toFixed(1)}%</strong></td>
    </tr>`;
    tbody += this.buildPortfolioRows(planSafe, currentSafe, safeRatioSum, safeAlloc, finalTotal, true);
    tbody += `<tr class="total">
      <td><strong>안전자산 소계</strong></td>
      <td><strong>${fmt(Math.round(finalSafeTotal))}</strong></td>
      <td><strong>${finalSafePct.toFixed(1)}%</strong></td>
    </tr>`;
    tbody += `<tr class="total">
      <td><strong>총 자산</strong></td>
      <td><strong>${fmt(Math.round(finalTotal))}</strong></td>
      <td><strong>100%</strong></td>
    </tr>`;
    document.getElementById('portfolio-body')!.innerHTML = tbody;

    // 위험자산 비중 초과 경고
    const balanceWarningEl = document.getElementById('balance-warning')!;
    if (finalRiskPct > 70.5) {
      balanceWarningEl.textContent = `⚠️ 위험자산 비중이 한도를 초과합니다: ${finalRiskPct.toFixed(1)}% (한도 70%)`;
      balanceWarningEl.style.display = 'block';
    } else if (finalRiskPct < 65) {
      balanceWarningEl.textContent = `⚠️ 위험자산 비중이 목표에서 벗어났습니다: ${finalRiskPct.toFixed(1)}% (목표 70%)`;
      balanceWarningEl.style.display = 'block';
    } else {
      balanceWarningEl.style.display = 'none';
    }

    // 계산 완료 후 현재 입력 데이터 저장
    this.saveData();
  }

  /* ========== calculate 내부 헬퍼 ========== */

  /** 비율 합계 표시 요소 업데이트 */
  private updateRatioSumDisplay(sumElId: string, warnElId: string, ratioSum: number): void {
    const sumEl = document.getElementById(sumElId)!;
    const warnEl = document.getElementById(warnElId)!;
    sumEl.textContent = ratioSum + '%';
    if (ratioSum === 100) {
      sumEl.style.color = '#28a745';
      warnEl.textContent = '✓';
    } else {
      sumEl.style.color = '#dc3545';
      warnEl.textContent = '⚠ 100%가 되어야 합니다';
    }
  }

  /** 행별 배분 금액 업데이트 */
  private updateAllocAmounts(selector: string, planRows: PlanRow[], ratioSum: number, alloc: number): void {
    const domRows = document.querySelectorAll(selector);
    planRows.forEach((r, idx) => {
      const amount = ratioSum > 0 ? (r.ratio / ratioSum) * alloc : 0;
      const amountCell = domRows[idx]?.querySelector('.alloc-amount');
      if (amountCell) amountCell.textContent = fmt(Math.round(amount)) + ' 원';
    });
  }

  /**
   * 포트폴리오 테이블 HTML 행 생성.
   * 기존 보유 + 신규 매수를 합산하여 표시
   * @param isSafe - true이면 안전자산 태그 스타일 적용
   */
  private buildPortfolioRows(planRows: PlanRow[], currentRows: CurrentAssetRow[], ratioSum: number, alloc: number, finalTotal: number, isSafe: boolean): string {
    let tbody = '';
    if (planRows.length > 0 && ratioSum > 0) {
      planRows.forEach((r) => {
        const allocAmount = (r.ratio / ratioSum) * alloc;
        const existingIdx = currentRows.findIndex((cr) => cr.name === r.name);
        if (existingIdx !== -1) {
          const total = currentRows[existingIdx]!.eval + allocAmount;
          const tagClass = isSafe ? ' safe' : '';
          tbody += `<tr>
            <td>${r.name} <span class="tag${tagClass}">추가매수</span></td>
            <td>${fmt(Math.round(total))}</td>
            <td>${pct(total, finalTotal)}</td>
          </tr>`;
        } else {
          tbody += `<tr>
            <td>${r.name} <span class="tag">신규</span></td>
            <td>${fmt(Math.round(allocAmount))}</td>
            <td>${pct(allocAmount, finalTotal)}</td>
          </tr>`;
        }
      });
      // 추가 매수 안 된 기존 자산
      currentRows.forEach((cr) => {
        if (!planRows.find((pr) => pr.name === cr.name)) {
          tbody += `<tr>
            <td>${cr.name}</td>
            <td>${fmt(Math.round(cr.eval))}</td>
            <td>${pct(cr.eval, finalTotal)}</td>
          </tr>`;
        }
      });
    }
    return tbody;
  }

  /* ========== 초기 데이터 ========== */

  /**
   * 현재 입력 데이터를 FlayStorage에 저장.
   * calculate() 완료 시마다 자동 호출되어 세션 간 데이터 유지
   */
  private saveData(): void {
    const cash = (document.getElementById('i-cash') as HTMLInputElement)?.value || '';
    const data: PlannerStorageData = {
      cash,
      currentRisk: this.getCurrentRows('current-risk-body'),
      currentSafe: this.getCurrentRows('current-safe-body'),
      planRisk: this.getPlanRows('plan-risk-body'),
      planSafe: this.getPlanRows('plan-safe-body'),
    };
    try {
      localStorage.setItem(PensionPlanner.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('PensionPlanner: 데이터 저장 실패', e);
    }
  }

  /**
   * 저장된 비율을 계획 행 DOM에 직접 복원.
   * addPlanRow의 자동 재분배로 틀어진 비율을 덮어씀
   * @param type - 'risk' 또는 'safe'
   * @param rows - 복원할 비율 데이터
   */
  private restorePlanRatios(type: 'risk' | 'safe', rows: PlanRow[]): void {
    const bodyId = type === 'risk' ? 'plan-risk-body' : 'plan-safe-body';
    const trows = Array.from(document.querySelectorAll<HTMLTableRowElement>(`#${bodyId} tr`));
    rows.forEach((r, i) => {
      const tr = trows[i];
      if (!tr) return;
      tr.dataset.ratio = String(r.ratio);
      const input = tr.querySelector('input[type="number"]') as HTMLInputElement | null;
      if (input) input.value = String(r.ratio);
    });
  }

  /** 기본 보유자산 및 투자 계획 데이터로 초기화. 저장된 데이터가 있으면 복원, 없으면 샘플 데이터 사용 */
  private initDefaults(): void {
    let saved: PlannerStorageData | null = null;
    try {
      const raw = localStorage.getItem(PensionPlanner.STORAGE_KEY);
      saved = raw ? (JSON.parse(raw) as PlannerStorageData) : null;
    } catch (e) {
      console.warn('PensionPlanner: 저장 데이터 로드 실패', e);
    }

    if (saved && (saved.currentRisk?.length || saved.currentSafe?.length || saved.planRisk?.length)) {
      // 저장된 데이터 복원
      const cashEl = document.getElementById('i-cash') as HTMLInputElement;
      if (cashEl && saved.cash) cashEl.value = saved.cash;

      saved.currentRisk?.forEach((d) => this.addCurrentRiskRow(d));
      saved.currentSafe?.forEach((d) => this.addCurrentSafeRow(d));

      // 계획 행: 이름만 먼저 추가한 후 비율 직접 복원 (addPlanRow의 자동 재분배 무력화)
      saved.planRisk?.forEach((d) => this.addPlanRowNameOnly('risk', d.name));
      this.restorePlanRatios('risk', saved.planRisk ?? []);

      saved.planSafe?.forEach((d) => this.addPlanRowNameOnly('safe', d.name));
      this.restorePlanRatios('safe', saved.planSafe ?? []);
    } else {
      // 저장된 데이터 없음 → 샘플 데이터로 초기화
      this.addCurrentRiskRow({ name: 'TIGER 반도체TOP10', eval: 63590580 });
      this.addCurrentRiskRow({ name: 'TIGER 200', eval: 9404500 });
      this.addCurrentRiskRow({ name: 'KODEX 증권', eval: 3181165 });
      this.addCurrentSafeRow({ name: '미래에셋 TDF2050 혼합', eval: 759759 });
      this.addPlanRiskRow({ name: 'TIGER 200', ratio: 100 });
      this.addPlanSafeRow({ name: 'RISE 삼성전자SK하이닉스채권혼합50', ratio: 100 });
    }
  }

  /**
   * 계획 행을 비율 재분배 없이 이름만 직접 추가하는 내부 전용 헬퍼.
   * initDefaults에서 저장된 비율을 복원할 때만 사용
   * @param type - 'risk' 또는 'safe'
   * @param name - 상품명
   */
  private addPlanRowNameOnly(type: 'risk' | 'safe', name: string): void {
    const isRisk = type === 'risk';
    const id = isRisk ? ++this.planRiskId : ++this.planSafeId;
    const prefix = isRisk ? 'pr' : 'ps';
    const planBody = document.getElementById(isRisk ? 'plan-risk-body' : 'plan-safe-body')!;
    const placeholder = isRisk ? 'KOSPI 추종 ETF' : '안전자산 상품명';
    const ratioClass = isRisk ? 'risk-ratio-input' : 'safe-ratio-input';
    const tr = document.createElement('tr');
    tr.id = `${prefix}-${id}`;
    tr.dataset.ratio = '0';
    tr.innerHTML = `
      <td><input type="text" value="${name}" placeholder="${placeholder}" onchange="updateRatioBars('${type}');calculate();"></td>
      <td><input type="number" class="${ratioClass} ratio-input" min="1" max="100" value="0" style="width:60px;font-size:13px;text-align:right;"></td>
      <td style="text-align:right;font-weight:600;" class="alloc-amount">—</td>
      <td style="text-align:center"><button class="btn-del" onclick="delPlanRow('${prefix}-${id}')">×</button></td>`;
    planBody.appendChild(tr);
  }
}
