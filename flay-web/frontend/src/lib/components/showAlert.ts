import { buildDialog, destroyDialog } from '@base/GroundDialog';
import './showAlert.scss';

/**
 * HTMLDialogElement 기반 alert 대화상자
 *
 * @param message - 표시할 메시지 문자열
 * @param title - 대화상자 제목 (기본값: '알림')
 * @returns 확인 버튼 클릭 또는 ESC 시 resolve되는 Promise<void>
 * @example
 * await showAlert('저장이 완료되었습니다.');
 * await showAlert('오류가 발생했습니다.', '오류');
 */
export function showAlert(message: string, title = '알림'): Promise<void> {
  return new Promise((resolve) => {
    const dialog = buildDialog('alert', title, message, '확인');
    const btnOk = dialog.querySelector<HTMLButtonElement>('.flay-dialog__btn--ok')!;

    const handleClose = () => destroyDialog(dialog, resolve);

    btnOk.addEventListener('click', handleClose, { once: true });
    dialog.addEventListener('cancel', (e) => {
      e.preventDefault();
      handleClose();
    });
    dialog.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleClose();
      }
    });

    document.body.appendChild(dialog);
    dialog.showModal();
    btnOk.focus();
  });
}
