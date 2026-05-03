import { destroyDialog, escapeHtml } from '../../base/GroundDialog';
import './showLoading.scss';

/**
 * HTMLDialogElement 기반 로딩 대화상자 표시
 *
 * - ESC / 클릭으로 닫기 불가 (사용자 인터랙션 완전 차단)
 * - 반환된 함수를 호출하면 로딩 다이얼로그가 닫힘
 *
 * @param message - 표시할 메시지 (기본값: '처리 중입니다...')
 * @returns 로딩 다이얼로그를 닫는 함수
 * @example
 * const hide = showLoading('저장 중입니다...');
 * await saveToServer();
 * hide();
 */
export function showLoading(message = '처리 중입니다...'): () => void {
  const dialog = document.createElement('dialog');
  dialog.className = 'flay-dialog flay-dialog--loading';
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-label', message);
  dialog.innerHTML = `
    <div class="flay-dialog__inner" role="status" aria-live="polite">
      <div class="flay-dialog__loading-body">
        <span class="flay-dialog__spinner" aria-hidden="true"></span>
        <p class="flay-dialog__message">${escapeHtml(message)}</p>
      </div>
    </div>
  `;

  // cancel 이벤트(ESC) 차단 — dialog 닫힘 기본 동작 방지
  dialog.addEventListener('cancel', (e) => e.preventDefault());
  // keydown 레벨에서도 Escape 차단 — 브라우저별 cancel 미발생 케이스 대비
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  document.body.appendChild(dialog);
  dialog.showModal();

  return () => destroyDialog(dialog, () => {});
}
