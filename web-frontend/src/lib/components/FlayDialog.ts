import './FlayDialog.scss';

/** alert 대화상자 옵션 */
interface AlertOptions {
  /** 표시할 메시지 */
  message: string;
  /** 대화상자 제목 */
  title?: string;
}

/** confirm 대화상자 옵션 */
interface ConfirmOptions {
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
 * HTMLDialogElement 기반 alert 대화상자
 *
 * @param messageOrOptions - 표시할 메시지 문자열 또는 옵션 객체
 * @returns 확인 버튼 클릭 또는 ESC 시 resolve되는 Promise<void>
 * @example
 * await showAlert('저장이 완료되었습니다.');
 * await showAlert('오류가 발생했습니다.', '오류');
 * await showAlert({ message: '처리되었습니다.', title: '알림' });
 */
export function showAlert(messageOrOptions: string | AlertOptions, title = '알림'): Promise<void> {
  const opts: Required<AlertOptions> = typeof messageOrOptions === 'string' ? { message: messageOrOptions, title } : { title: '알림', ...messageOrOptions };

  return new Promise((resolve) => {
    const dialog = buildDialog('alert', opts.message, opts.title, '확인');

    const btnOk = dialog.querySelector<HTMLButtonElement>('.flay-dialog__btn--ok')!;

    /** 닫기 처리 및 Promise resolve */
    const handleClose = () => {
      destroyDialog(dialog, resolve);
    };

    btnOk.addEventListener('click', handleClose, { once: true });

    // ESC 키로 닫을 때 (dialog의 기본 cancel 이벤트)
    dialog.addEventListener('cancel', (e) => {
      e.preventDefault();
      handleClose();
    });

    // Enter 키로 닫기
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
  const opts: Required<ConfirmOptions> = typeof messageOrOptions === 'string' ? { message: messageOrOptions, title, okLabel: '확인', cancelLabel: '취소' } : { title: '확인', okLabel: '확인', cancelLabel: '취소', ...messageOrOptions };

  return new Promise((resolve) => {
    const dialog = buildDialog('confirm', opts.message, opts.title, opts.okLabel, opts.cancelLabel);

    const btnOk = dialog.querySelector<HTMLButtonElement>('.flay-dialog__btn--ok')!;
    const btnCancel = dialog.querySelector<HTMLButtonElement>('.flay-dialog__btn--cancel')!;

    /** 확인 처리 */
    const handleOk = () => destroyDialog(dialog, () => resolve(true));
    /** 취소 처리 */
    const handleCancel = () => destroyDialog(dialog, () => resolve(false));

    btnOk.addEventListener('click', handleOk, { once: true });
    btnCancel.addEventListener('click', handleCancel, { once: true });

    // ESC 키로 닫을 때 취소로 처리
    dialog.addEventListener('cancel', (e) => {
      e.preventDefault();
      handleCancel();
    });

    // 화살표 키로 선택 전환, Enter로 확정
    dialog.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const focused = document.activeElement;
        if (focused === btnOk) {
          btnCancel.focus();
        } else {
          btnOk.focus();
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const focused = document.activeElement;
        if (focused === btnCancel) {
          handleCancel();
        } else {
          handleOk();
        }
      }
    });

    document.body.appendChild(dialog);
    dialog.showModal();
    btnOk.focus();
  });
}

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

  const currentTheme = document.documentElement.getAttribute('theme') ?? 'light';
  dialog.dataset.theme = currentTheme;

  dialog.innerHTML = `
    <div class="flay-dialog__inner" role="status" aria-live="polite">
      <div class="flay-dialog__loading-body">
        <span class="flay-dialog__spinner" aria-hidden="true"></span>
        <p class="flay-dialog__message">${escapeHtml(message)}</p>
      </div>
    </div>
  `;

  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-label', message);

  // cancel 이벤트(ESC) 차단 — dialog 닫힘 기본 동작 방지
  dialog.addEventListener('cancel', (e) => {
    e.preventDefault();
  });

  // keydown 레벨에서도 Escape 차단 — 브라우저별 cancel 미발생 케이스 대비
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  document.body.appendChild(dialog);
  dialog.showModal();

  /** 로딩 다이얼로그를 닫는 함수 */
  return () => destroyDialog(dialog, () => {});
}

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
function buildDialog(type: 'alert' | 'confirm', message: string, title: string, okLabel: string, cancelLabel?: string): HTMLDialogElement {
  const dialog = document.createElement('dialog');
  dialog.className = `flay-dialog flay-dialog--${type}`;

  // 현재 테마를 backdrop 스타일에 반영
  const currentTheme = document.documentElement.getAttribute('theme') ?? 'light';
  dialog.dataset.theme = currentTheme;

  const iconHtml = type === 'alert' ? '<span class="flay-dialog__icon" aria-hidden="true">!</span>' : '<span class="flay-dialog__icon" aria-hidden="true">?</span>';

  const cancelBtnHtml = cancelLabel != null ? `<button class="flay-dialog__btn flay-dialog__btn--cancel" type="button">${escapeHtml(cancelLabel)}</button>` : '';

  dialog.innerHTML = `
    <div class="flay-dialog__inner" role="document">
      <header class="flay-dialog__header">
        ${iconHtml}
        <span class="flay-dialog__title" id="flay-dialog-title">${escapeHtml(title)}</span>
      </header>
      <div class="flay-dialog__body" id="flay-dialog-body">
        <p class="flay-dialog__message">${escapeHtml(message)}</p>
      </div>
      <footer class="flay-dialog__footer">
        ${cancelBtnHtml}
        <button class="flay-dialog__btn flay-dialog__btn--ok" type="button">${escapeHtml(okLabel)}</button>
      </footer>
    </div>
  `;

  dialog.setAttribute('aria-labelledby', 'flay-dialog-title');
  dialog.setAttribute('aria-describedby', 'flay-dialog-body');
  dialog.setAttribute('aria-modal', 'true');
  if (type === 'alert') {
    dialog.setAttribute('role', 'alertdialog');
  }

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
function destroyDialog(dialog: HTMLDialogElement, callback: () => void): void {
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
function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
}
