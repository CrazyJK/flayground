import { buildDialog, destroyDialog } from '@base/GroundDialog';
import './showDialog.scss';

/** showDialog 버튼 정의 */
export interface DialogButton<T = string> {
  /** 버튼에 표시할 라벨 */
  label: string;
  /** 버튼 클릭 시 반환할 값 */
  value: T;
  /** 강조(primary) 스타일 여부 */
  primary?: boolean;
}

/** showDialog 옵션 */
export interface DialogOptions<T = string> {
  /** 대화상자 제목 */
  title?: string;
  /**
   * 본문 HTML 문자열
   * @remarks 호출자가 직접 XSS 이스케이프 처리 필요
   */
  content: string;
  /** 버튼 목록 */
  buttons: DialogButton<T>[];
}

/**
 * HTMLDialogElement 기반 범용 커스텀 대화상자
 *
 * - 제목, HTML 콘텐츠, 버튼 목록을 자유롭게 구성
 * - 클릭된 버튼의 value를 반환, ESC/닫힘 시 null 반환
 * - 좌우 화살표 키로 버튼 간 포커스 이동, Enter로 확정
 *
 * @param options - 대화상자 옵션
 * @returns 클릭된 버튼의 value, ESC 또는 외부 닫힘 시 null
 * @example
 * const result = await showDialog({
 *   title: '저장 방식 선택',
 *   content: '<p>어떤 방식으로 저장할까요?</p>',
 *   buttons: [
 *     { label: '덮어쓰기', value: 'overwrite', primary: true },
 *     { label: '새 파일', value: 'new' },
 *     { label: '취소', value: null },
 *   ],
 * });
 */
export function showDialog<T = string>(options: DialogOptions<T>): Promise<T | null> {
  const { title = '알림', content, buttons } = options;

  return new Promise((resolve) => {
    const dialog = buildDialog('custom', title, content, buttons);

    const btnEls = [...dialog.querySelectorAll<HTMLButtonElement>('.flay-dialog__btn[data-index]')];

    const handleResolve = (value: T | null) => destroyDialog(dialog, () => resolve(value));

    btnEls.forEach((btn) => {
      const btnDef = buttons[Number(btn.dataset.index)];
      if (btnDef) btn.addEventListener('click', () => handleResolve(btnDef.value), { once: true });
    });

    dialog.addEventListener('cancel', (e) => {
      e.preventDefault();
      handleResolve(null);
    });

    // 화살표 키로 버튼 포커스 이동, Enter로 확정
    dialog.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const idx = btnEls.indexOf(document.activeElement as HTMLButtonElement);
        if (idx !== -1) {
          const next = e.key === 'ArrowRight' ? (idx + 1) % btnEls.length : (idx - 1 + btnEls.length) % btnEls.length;
          btnEls[next]?.focus();
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const focused = document.activeElement as HTMLButtonElement;
        (btnEls.includes(focused) ? focused : btnEls[0])?.click();
      }
    });

    document.body.appendChild(dialog);
    dialog.showModal();
    // primary 버튼 또는 첫 번째 버튼에 포커스
    (dialog.querySelector<HTMLButtonElement>('.flay-dialog__btn--ok') ?? btnEls[0])?.focus();
  });
}
