import './GroundDialog.scss';

/** aria ID 중복 방지용 카운터 */
export let dialogIdCounter = 0;

/**
 * dialog DOM 엘리먼트를 생성하여 반환
 *
 * @param type - 'alert' 또는 'confirm'
 * @param message - 본문 메시지
 * @param title - 제목
 * @param okLabel - 확인 버튼 라벨
 * @param cancelLabel - 취소 버튼 라벨 (confirm 타입에만 사용)
 * @returns 생성된 HTMLDialogElement
 */
export function buildDialog(type: 'alert' | 'confirm', message: string, title: string, okLabel: string, cancelLabel?: string): HTMLDialogElement {
  const id = ++dialogIdCounter;
  const dialog = document.createElement('dialog');
  dialog.className = `flay-dialog flay-dialog--${type}`;

  const iconHtml = `<span class="flay-dialog__icon" aria-hidden="true">${type === 'alert' ? '!' : '?'}</span>`;
  const cancelBtnHtml = cancelLabel != null ? `<button class="flay-dialog__btn flay-dialog__btn--cancel" type="button">${escapeHtml(cancelLabel)}</button>` : '';

  dialog.innerHTML = `
    <div class="flay-dialog__inner" role="document">
      <header class="flay-dialog__header">
        ${iconHtml}
        <span class="flay-dialog__title" id="flay-dialog-title-${id}">${escapeHtml(title)}</span>
      </header>
      <div class="flay-dialog__body" id="flay-dialog-body-${id}">
        <p class="flay-dialog__message">${escapeHtml(message)}</p>
      </div>
      <footer class="flay-dialog__footer">
        ${cancelBtnHtml}
        <button class="flay-dialog__btn flay-dialog__btn--ok" type="button">${escapeHtml(okLabel)}</button>
      </footer>
    </div>
  `;

  dialog.setAttribute('aria-labelledby', `flay-dialog-title-${id}`);
  dialog.setAttribute('aria-describedby', `flay-dialog-body-${id}`);
  dialog.setAttribute('aria-modal', 'true');
  if (type === 'alert') dialog.setAttribute('role', 'alertdialog');

  return dialog;
}

/**
 * dialog 닫기 애니메이션 후 DOM에서 제거
 *
 * - animationend 가 발생하지 않는 경우(ESC 입력 직후, prefers-reduced-motion 등)를
 *   대비해 setTimeout fallback으로 반드시 콜백이 호출되도록 보장
 *
 * @param dialog - 제거할 HTMLDialogElement
 * @param callback - 제거 완료 후 호출할 콜백
 */
export function destroyDialog(dialog: HTMLDialogElement, callback: () => void): void {
  dialog.classList.add('flay-dialog--closing');

  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    try {
      dialog.close();
    } catch {
      // 이미 닫혀있는 경우 무시
    }
    dialog.remove();
    callback();
  };

  // close 애니메이션(0.18s) + 여유분 fallback
  const fallback = setTimeout(finish, 300);
  dialog.addEventListener('animationend', (e: AnimationEvent) => {
    if (e.animationName === 'flay-dialog-close') {
      clearTimeout(fallback);
      finish();
    }
  });
}

/**
 * XSS 방지를 위한 HTML 이스케이프 처리
 *
 * @param text - 이스케이프할 문자열
 * @returns 이스케이프된 문자열
 */
export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
}
