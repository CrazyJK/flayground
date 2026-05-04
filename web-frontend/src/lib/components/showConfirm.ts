import { buildDialog, destroyDialog } from '@base/GroundDialog';
import './showConfirm.scss';

/**
 * HTMLDialogElement 기반 confirm 대화상자
 *
 * @param message - 표시할 메시지 문자열
 * @param title - 대화상자 제목 (기본값: '확인')
 * @param okLabel - 확인 버튼 라벨 (기본값: '확인')
 * @param cancelLabel - 취소 버튼 라벨 (기본값: '취소')
 * @returns 확인이면 true, 취소/ESC면 false를 반환하는 Promise<boolean>
 * @example
 * const ok = await showConfirm('삭제하시겠습니까?');
 * const ok = await showConfirm('저장하시겠습니까?', '저장');
 * const ok = await showConfirm('계속하시겠습니까?', '확인', '계속', '중단');
 */
export function showConfirm(message: string, title = '확인', okLabel = '확인', cancelLabel = '취소'): Promise<boolean> {
  return new Promise((resolve) => {
    const dialog = buildDialog('confirm', title, message, okLabel, cancelLabel);
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
