import { FnInstitutionList } from '../finance/components/fn-institution-list';
import { FnSnapshotChart } from '../finance/components/fn-snapshot-chart';
import { FnSnapshotPanel } from '../finance/components/fn-snapshot-panel';
import { FnStockItems } from '../finance/components/fn-stock-items';
import '../finance/financial-note.scss';
import '../finance/index';
import './inc/Page';

// DOM이 준비된 후 이벤트 연결
document.addEventListener('DOMContentLoaded', () => {
  const list = document.querySelector<FnInstitutionList>('fn-institution-list');
  const snapPanel = document.querySelector<FnSnapshotPanel>('fn-snapshot-panel');
  const snapChart = document.querySelector<FnSnapshotChart>('fn-snapshot-chart');

  // 증권 종목 편집 모달
  document.addEventListener('fn:edit-stock', (e: Event) => {
    const { accountId } = (e as CustomEvent).detail as { accountId: number };
    let overlay = document.querySelector<HTMLElement>('.fn-stock-modal-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'fn-stock-modal-overlay';
      overlay.innerHTML = /* html */ `
        <div class="fn-stock-modal">
          <div class="fn-modal-header">
            <h3>증권 종목 편집</h3>
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

  // 증권 평가금액 갱신 → 계좌 금액 업데이트
  document.addEventListener('fn:stock-eval-updated', (e: Event) => {
    const { accountId, evalAmount } = (e as CustomEvent).detail as { accountId: number; evalAmount: number };
    list?.updateStockAmount(accountId, evalAmount);
  });

  // 데이터 변경 → 리스트/차트 새로고침
  document.addEventListener('fn:data-changed', () => {
    list?.refresh();
  });

  // 스냅샷 저장 → 차트 새로고침
  document.addEventListener('fn:snapshot-saved', () => {
    snapChart?.load();
    snapPanel?.refresh();
  });
});
