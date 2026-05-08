import { FnAssetTable } from '../finance/components/fn-asset-table';
import { FnInstitutionForm } from '../finance/components/fn-institution-form';
import { FnSnapshotChart } from '../finance/components/fn-snapshot-chart';
import '../finance/financial-note.scss';
import '../finance/index';
import './inc/Page';

// DOM이 준비된 후 이벤트 연결
document.addEventListener('DOMContentLoaded', () => {
  const table = document.querySelector<FnAssetTable>('fn-asset-table');
  const snapChart = document.querySelector<FnSnapshotChart>('fn-snapshot-chart');

  // ── 포트폴리오 현황 모달 ──
  document.querySelector('#fn-portfolio-btn')?.addEventListener('click', () => {
    if (document.querySelector('dialog.fn-portfolio-dialog[open]')) return;

    const dialog = document.createElement('dialog');
    dialog.className = 'fn-portfolio-dialog flay-dialog';
    dialog.innerHTML = /* html */ `
      <div class="flay-dialog__inner" role="document">
        <div class="flay-dialog__header fn-modal-header">
          <h3>📊 포트폴리오 현황 <span class="fn-pv-total-display"></span></h3>
          <button class="fn-btn fn-modal-close">닫기</button>
        </div>
        <div class="flay-dialog__body">
          <fn-portfolio-viewer></fn-portfolio-viewer>
        </div>
      </div>`;
    document.body.appendChild(dialog);

    dialog.querySelector('.fn-modal-close')?.addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => dialog.remove());
    dialog.addEventListener('fn:total-loaded', (e: Event) => {
      const { total } = (e as CustomEvent<{ total: number }>).detail;
      const display = dialog.querySelector<HTMLElement>('.fn-pv-total-display');
      if (display) display.textContent = total.toLocaleString() + ' 원';
    });
    dialog.showModal();
  });

  // ── 기관/계좌 관리 모달 ──
  document.querySelector('#fn-manage-btn')?.addEventListener('click', () => {
    if (document.querySelector('dialog.fn-institution-dialog[open]')) return;

    const dialog = document.createElement('dialog');
    dialog.className = '  fn-institution-dialog flay-dialog';
    dialog.innerHTML = /* html */ `
      <div class="flay-dialog__inner" role="document">
        <div class="flay-dialog__header fn-modal-header">
          <h3>⚙️ 기관/계좌 관리</h3>
          <button class="fn-btn fn-modal-close">닫기</button>
        </div>
        <div class="flay-dialog__body">
          <fn-institution-form></fn-institution-form>
        </div>
      </div>`;
    document.body.appendChild(dialog);

    dialog.querySelector('.fn-modal-close')?.addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => dialog.remove());

    // 폼에서 데이터 변경 시 테이블 새로고침
    dialog.querySelector<FnInstitutionForm>('fn-institution-form')?.addEventListener('fn:data-changed', () => {
      table?.refresh();
      void snapChart?.load();
    });

    dialog.showModal();
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
