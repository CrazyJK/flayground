import { buildDialog, destroyDialog } from '../../base/GroundDialog';
import './showAlert.scss';

/** alert 대화상자 옵션 */
export interface AlertOptions {
  /** 표시할 메시지 */
  message: string;
  /** 대화상자 제목 */
  title?: string;
}

/**
 * HTMLDialogElement 기반 alert 대화상자
 *
 * @param messageOrOptions - 표시할 메시지 문자열 또는 옵션 객체
 * @param title - 대화상자 제목 (messageOrOptions가 문자열일 때)
 * @returns 확인 버튼 클릭 또는 ESC 시 resolve되는 Promise<void>
 * @example
 * await showAlert('저장이 완료되었습니다.');
 * await showAlert('오류가 발생했습니다.', '오류');
 * await showAlert({ message: '처리되었습니다.', title: '알림' });
 */
export function showAlert(messageOrOptions: string | AlertOptions, title = '알림'): Promise<void> {
  const opts = typeof messageOrOptions === 'string' ? { message: messageOrOptions, title } : { title: '알림', ...messageOrOptions };

  return new Promise((resolve) => {
    const dialog = buildDialog('alert', opts.message, opts.title ?? '알림', '확인');
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
