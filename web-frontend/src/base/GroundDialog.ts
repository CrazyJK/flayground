import './GroundDialog.scss';

/** aria ID 중복 방지용 카운터 */
export let dialogIdCounter = 0;

/**
 * dialog DOM 엘리먼트를 생성하여 반환 (alert / confirm 타입)
 *
 * @param type - 'alert' 또는 'confirm'
 * @param message - 본문 메시지
 * @param title - 제목
 * @param okLabel - 확인 버튼 라벨
 * @param cancelLabel - 취소 버튼 라벨 (confirm 타입에만 사용)
 * @returns 생성된 HTMLDialogElement
 */
export function buildDialog(type: 'alert' | 'confirm', message: string, title: string, okLabel: string, cancelLabel?: string): HTMLDialogElement;
/**
 * dialog DOM 엘리먼트를 생성하여 반환 (custom 타입)
 *
 * - 본문은 raw HTML을 그대로 사용하므로 호출자가 XSS 이스케이프 처리 필요
 * - 버튼은 `data-index` 속성으로 순서가 지정되며, 이벤트 바인딩은 호출자가 담당
 *
 * @param type - 'custom'
 * @param title - 제목
 * @param content - 본문 HTML 문자열
 * @param buttons - 버튼 목록 `{ label, primary? }`
 * @returns 생성된 HTMLDialogElement
 */
export function buildDialog(type: 'custom', title: string, content: string, buttons: Array<{ label: string; primary?: boolean }>): HTMLDialogElement;
export function buildDialog(type: 'alert' | 'confirm' | 'custom', messageOrTitle: string, titleOrContent: string, okLabelOrButtons: string | Array<{ label: string; primary?: boolean }>, cancelLabel?: string): HTMLDialogElement {
  const id = ++dialogIdCounter;
  const dialog = document.createElement('dialog');
  dialog.className = `flay-dialog flay-dialog--${type}`;

  if (type === 'custom') {
    const title = messageOrTitle;
    const content = titleOrContent;
    const buttons = okLabelOrButtons as Array<{ label: string; primary?: boolean }>;

    const buttonsHtml = buttons.map((btn, i) => `<button class="flay-dialog__btn ${btn.primary ? 'flay-dialog__btn--ok' : 'flay-dialog__btn--cancel'}" type="button" data-index="${i}">${escapeHtml(btn.label)}</button>`).join('');

    dialog.innerHTML = `
      <div class="flay-dialog__inner" role="document">
        <header class="flay-dialog__header">
          <span class="flay-dialog__title" id="flay-dialog-title-${id}">${escapeHtml(title)}</span>
        </header>
        <div class="flay-dialog__body" id="flay-dialog-body-${id}">
          ${content}
        </div>
        <footer class="flay-dialog__footer">
          ${buttonsHtml}
        </footer>
      </div>
    `;
  } else {
    const message = messageOrTitle;
    const title = titleOrContent;
    const okLabel = okLabelOrButtons as string;

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
  }

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

/** 리사이즈 핸들 방향 목록 */
const RESIZE_DIRS = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'] as const;

/**
 * dialog header를 드래그하여 엘리먼트를 이동
 *
 * `.flay-dialog__header` 자식을 드래그 핸들로 사용
 *
 * @param el - 이동 대상 HTMLElement
 */
function makeDraggable(el: HTMLElement): void {
  const header = el.querySelector<HTMLElement>('.flay-dialog__header');
  if (!header) return;

  header.addEventListener('mousedown', (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;

    const rect = el.getBoundingClientRect();
    const startLeft = rect.left;
    const startTop = rect.top;
    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    let dragging = false;
    document.body.style.userSelect = 'none';

    const onMove = (ev: MouseEvent) => {
      if (!dragging) {
        dragging = true;
        el.style.margin = '0';
        el.style.left = `${startLeft}px`;
        el.style.right = 'auto';
        el.style.top = `${startTop}px`;
      }
      const dx = ev.clientX - startMouseX;
      const dy = ev.clientY - startMouseY;
      const maxLeft = window.innerWidth - el.offsetWidth;
      const maxTop = window.innerHeight - el.offsetHeight;
      el.style.left = `${Math.max(0, Math.min(startLeft + dx, maxLeft))}px`;
      el.style.top = `${Math.max(0, Math.min(startTop + dy, maxTop))}px`;
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    e.preventDefault();
  });
}

/**
 * 엘리먼트 외곽에 리사이즈 핸들을 추가하여 크기 조정
 *
 * 8방향(n, s, e, w, ne, nw, se, sw) 핸들 지원
 *
 * @param el - 크기 조정 대상 HTMLElement
 */
function makeResizable(el: HTMLElement): void {
  RESIZE_DIRS.forEach((dir) => {
    const handle = document.createElement('div');
    handle.className = `flay-dialog__resize-handle flay-dialog__resize-handle--${dir}`;

    handle.addEventListener('mousedown', (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const inner = el.querySelector<HTMLElement>('.flay-dialog__inner');

      const startX = e.clientX;
      const startY = e.clientY;
      const startLeft = rect.left;
      const startTop = rect.top;
      const startW = rect.width;
      const startH = rect.height;
      let resizing = false;
      document.body.style.userSelect = 'none';

      const onMove = (ev: MouseEvent) => {
        if (!resizing) {
          resizing = true;
          el.style.margin = '0';
          el.style.left = `${startLeft}px`;
          el.style.right = 'auto';
          el.style.top = `${startTop}px`;
          el.style.width = `${startW}px`;
          el.style.maxWidth = 'none';
          el.style.minWidth = '280px';
        }
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        let newLeft = startLeft,
          newTop = startTop,
          newW = startW,
          newH = startH;

        if (dir.includes('e')) newW = Math.max(280, startW + dx);
        if (dir.includes('w')) {
          newW = Math.max(280, startW - dx);
          newLeft = startLeft + startW - newW;
        }
        if (dir.includes('s')) newH = Math.max(120, startH + dy);
        if (dir.includes('n')) {
          newH = Math.max(120, startH - dy);
          newTop = startTop + startH - newH;
        }

        el.style.left = `${newLeft}px`;
        el.style.top = `${newTop}px`;
        el.style.width = `${newW}px`;
        el.style.height = `${newH}px`;
        if (inner) inner.style.height = '100%';
      };

      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.body.style.userSelect = '';
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
      e.preventDefault();
      e.stopPropagation();
    });

    el.appendChild(handle);
  });
}

/* ── MutationObserver: .flay-dialog가 DOM에 추가되면 drag·resize 자동 적용 ──
   HTMLDialogElement 외에 div 같은 일반 모달도 .flay-dialog 클래스를 적용하면 자동 지원 ── */
const _observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node instanceof HTMLElement && node.classList.contains('flay-dialog')) {
        makeDraggable(node);
        makeResizable(node);
      }
    }
  }
});

const _startObserver = () => _observer.observe(document.body, { childList: true });
if (document.body) {
  _startObserver();
} else {
  document.addEventListener('DOMContentLoaded', _startObserver);
}
