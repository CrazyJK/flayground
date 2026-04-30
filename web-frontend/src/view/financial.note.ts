import { FnAssetTable } from '../finance/components/fn-asset-table';
import { FnInstitutionForm } from '../finance/components/fn-institution-form';
import { FnSnapshotChart } from '../finance/components/fn-snapshot-chart';
import { FnStockItems } from '../finance/components/fn-stock-items';
import '../finance/financial-note.scss';
import '../finance/index';
import './inc/Page';

// DOM이 준비된 후 이벤트 연결
document.addEventListener('DOMContentLoaded', () => {
  const table = document.querySelector<FnAssetTable>('fn-asset-table');
  const snapChart = document.querySelector<FnSnapshotChart>('fn-snapshot-chart');

  // ── 포트폴리오 현황 모달 ──
  document.querySelector('#fn-portfolio-btn')?.addEventListener('click', () => {
    if (document.querySelector('.fn-portfolio-modal-overlay')) return;

    const overlay = document.createElement('div');
    overlay.className = 'fn-portfolio-modal-overlay';
    overlay.innerHTML = /* html */ `
      <div class="fn-portfolio-modal">
        <div class="fn-modal-header">
          <h3>📊 포트폴리오 현황</h3>
          <button class="fn-btn fn-modal-close">닫기</button>
        </div>
        <fn-portfolio-viewer></fn-portfolio-viewer>
      </div>`;
    document.body.appendChild(overlay);

    overlay.querySelector('.fn-modal-close')?.addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
  });

  // ── 기관/계좌 관리 모달 ──
  document.querySelector('#fn-manage-btn')?.addEventListener('click', () => {
    if (document.querySelector('.fn-form-modal-overlay')) return;

    const overlay = document.createElement('div');
    overlay.className = 'fn-form-modal-overlay';
    overlay.innerHTML = /* html */ `
      <div class="fn-form-modal">
        <div class="fn-modal-header">
          <h3>⚙️ 기관/계좌 관리</h3>
          <button class="fn-btn fn-modal-close">닫기</button>
        </div>
        <fn-institution-form></fn-institution-form>
      </div>`;
    document.body.appendChild(overlay);

    overlay.querySelector('.fn-modal-close')?.addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });

    // 폼에서 데이터 변경 시 테이블 새로고침
    overlay.querySelector<FnInstitutionForm>('fn-institution-form')?.addEventListener('fn:data-changed', () => {
      table?.refresh();
      void snapChart?.load();
    });
  });

  // ── 증권 종목 편집 모달 ──
  document.addEventListener('fn:edit-stock', (e: Event) => {
    const { accountId } = (e as CustomEvent).detail as { accountId: number };
    let overlay = document.querySelector<HTMLElement>('.fn-stock-modal-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'fn-stock-modal-overlay';
      overlay.innerHTML = /* html */ `
        <div class="fn-stock-modal">
          <div class="fn-modal-header">
            <h3>📈 증권 종목 편집</h3>
            <button class="fn-btn fn-modal-close">닫기</button>
          </div>
          <fn-stock-items></fn-stock-items>
        </div>`;
      document.body.appendChild(overlay);
      overlay.querySelector('.fn-modal-close')?.addEventListener('click', () => overlay!.remove());
      overlay.addEventListener('click', (ev) => {
        if (ev.target === overlay) overlay!.remove();
      });
    }
    const stockItems = overlay.querySelector<FnStockItems>('fn-stock-items')!;
    stockItems.setAttribute('account-id', String(accountId));
  });

  // ── 증권 평가금액 갱신 ──
  document.addEventListener('fn:stock-eval-updated', (e: Event) => {
    const { accountId, evalAmount } = (e as CustomEvent).detail as { accountId: number; evalAmount: number };
    table?.updateStockAmount(accountId, evalAmount);
  });

  // ── 데이터 변경 → 차트 새로고침 ──
  document.addEventListener('fn:data-changed', () => {
    void snapChart?.load();
  });

  // ── 스냅샷 저장 → 차트 새로고침 ──
  document.addEventListener('fn:snapshot-saved', () => {
    void snapChart?.load();
  });
});
