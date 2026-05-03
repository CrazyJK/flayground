import { buildDialog, destroyDialog } from '../../base/GroundDialog';
import './showConfirm.scss';

/** confirm 대화상자 옵션 */
export interface ConfirmOptions {
  /** 표시할 메시지 */
  message: string;
  /** 대화상자 제목 */
  title?: string;
  /** 확인 버튼 라벨 */
  okLabel?: string;
  /** 취소 버튼 라벨 */
  cancelLabel?: string;
}

/**
 * HTMLDialogElement 기반 confirm 대화상자
 *
 * @param messageOrOptions - 표시할 메시지 문자열 또는 옵션 객체
 * @param title - 대화상자 제목 (messageOrOptions가 문자열일 때)
 * @returns 확인이면 true, 취소/ESC면 false를 반환하는 Promise<boolean>
 * @example
 * const ok = await showConfirm('삭제하시겠습니까?');
 * const ok = await showConfirm('저장하시겠습니까?', '저장');
 * const ok = await showConfirm({ message: '계속하시겠습니까?', title: '확인', okLabel: '계속', cancelLabel: '중단' });
 */
export function showConfirm(messageOrOptions: string | ConfirmOptions, title = '확인'): Promise<boolean> {
  const opts = typeof messageOrOptions === 'string' ? { message: messageOrOptions, title, okLabel: '확인', cancelLabel: '취소' } : { title: '확인', okLabel: '확인', cancelLabel: '취소', ...messageOrOptions };

  return new Promise((resolve) => {
    const dialog = buildDialog('confirm', opts.message, opts.title ?? '확인', opts.okLabel ?? '확인', opts.cancelLabel ?? '취소');
    const btnOk = dialog.querySelector<HTMLButtonElement>('.flay-dialog__btn--ok')!;
    const btnCancel = dialog.querySelector<HTMLButtonElement>('.flay-dialog__btn--cancel')!;

    const handleOk = () => destroyDialog(dialog, () => resolve(true));
    const handleCancel = () => destroyDialog(dialog, () => resolve(false));

    btnOk.addEventListener('click', handleOk, { once: true });
    btnCancel.addEventListener('click', handleCancel, { once: true });
    dialog.addEventListener('cancel', (e) => {
      e.preventDefault();
      handleCancel();
    });
    // 화살표 키로 선택 전환, Enter로 확정
    dialog.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        (document.activeElement === btnOk ? btnCancel : btnOk).focus();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        (document.activeElement === btnCancel ? handleCancel : handleOk)();
      }
    });

    document.body.appendChild(dialog);
    dialog.showModal();
    btnOk.focus();
  });
}
