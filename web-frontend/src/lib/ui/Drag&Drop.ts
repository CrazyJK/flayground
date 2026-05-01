/**
 * 드래그 앤 드롭 유틸리티
 *
 * HTML 요소들에 드래그 앤 드롭 기능을 추가하는 유틸리티입니다.
 * 요소 이동, 드롭존 설정, 경계 검사 등의 기능을 제공합니다.
 *
 * 특징:
 * - 요소의 드래그 가능 설정
 * - 경계 영역 내에서의 이동 제한
 * - 드롭존 시각적 피드백
 * - 이벤트 기반 상호작용
 * - 절대/고정 위치 지원
 * - 타입 안전한 API 제공
 *
 * @author kamoru
 * @since 2024
 */

import './Drag&Drop.scss';

/** 이동 영역의 경계 정보 타입 */
type ZoneRect = DOMRect | { left: number; top: number; width?: number; height?: number };

/** 위치 타입 */
type PositionType = 'absolute' | 'fixed';

/** 현재 드래그 중인 요소 */
let dragged: HTMLElement | null = null;

/**
 * 엘리먼트를 드래그 가능하게 설정
 * @param element 드래그 가능하게 만들 요소
 */
export const setMoveable = (element: HTMLElement): void => {
  element.draggable = true;
  let clientX = 0;
  let clientY = 0;
  let zoneRect: ZoneRect;
  let absoluteLeft = 0;
  let absoluteTop = 0;

  element.addEventListener('dragstart', (e: DragEvent) => {
    // console.log(e.type, e.clientX, e.clientY, ' | ', e.layerX, e.layerY, ' | ', e.offsetX, e.offsetY, ' | ', e.pageX, e.pageY, ' | ', e.screenX, e.screenY);
    element.classList.add('dragging');

    dragged = element;

    clientX = e.clientX;
    clientY = e.clientY;

    const moveZone = element.closest('.movezone');
    if (!moveZone) {
      return;
    }
    zoneRect = moveZone.getBoundingClientRect();
    let position: PositionType = 'absolute';
    if (!zoneRect) {
      zoneRect = { left: 0, top: 0 };
      position = 'fixed';
    }

    const thisRect = element.getBoundingClientRect();

    absoluteLeft = window.scrollX + thisRect.left - zoneRect.left;
    absoluteTop = window.scrollY + thisRect.top - zoneRect.top;

    element.style.position = position;
    element.style.left = absoluteLeft + 'px';
    element.style.top = absoluteTop + 'px';
  });

  element.addEventListener('drag', (_e: DragEvent) => {
    // 드래그 중 처리 (현재는 빈 구현)
  });

  element.addEventListener('dragend', (e: DragEvent) => {
    element.classList.remove('dragging');

    const movedX = e.clientX - clientX;
    const movedY = e.clientY - clientY;

    let left = absoluteLeft + movedX;
    let top = absoluteTop + movedY;

    left = Math.max(0, left);
    top = Math.max(0, top);

    if (zoneRect.width !== undefined && zoneRect.height !== undefined) {
      left = Math.min(left, zoneRect.width - element.offsetWidth);
      top = Math.min(top, zoneRect.height - element.offsetHeight);
    }

    element.style.left = left + 'px';
    element.style.top = top + 'px';
  });
};

/**
 * 드래그 중인 엘리먼트를 드롭 받을 수 있게 설정
 * @param dropzone 드롭존으로 설정할 요소
 */
export const setDropzone = (dropzone: HTMLElement): void => {
  dropzone.addEventListener(
    'dragover',
    (event: DragEvent) => {
      // prevent default to allow drop
      event.preventDefault();
    },
    false
  );

  dropzone.addEventListener('dragenter', (e: DragEvent) => {
    // highlight potential drop target when the draggable element enters it
    const target = e.target as HTMLElement;
    if (target.classList.contains('dropzone')) {
      target.classList.add('dragover');
    }
  });

  dropzone.addEventListener('dragleave', (e: DragEvent) => {
    // reset background of potential drop target when the draggable element leaves it
    const target = e.target as HTMLElement;
    if (target.classList.contains('dropzone')) {
      target.classList.remove('dragover');
    }
  });

  dropzone.addEventListener('drop', (e: DragEvent) => {
    // prevent default action (open as link for some elements)
    e.preventDefault();
    // move dragged element to the selected drop target
    const target = e.target as HTMLElement;
    if (target.classList.contains('dropzone') && dragged) {
      target.classList.remove('dragover');
      target.insertBefore(dragged, null);
      dragged.dispatchEvent(new Event('drop'));
    }
  });
};

/**
 * 현재 드래그 중인 요소를 반환
 * @returns 드래그 중인 요소 또는 null
 */
export const getDraggedElement = (): HTMLElement | null => {
  return dragged;
};

/**
 * 드래그 상태를 초기화
 */
export const resetDragState = (): void => {
  if (dragged) {
    dragged.classList.remove('dragging');
    dragged = null;
  }
};

/**
 * 요소의 드래그 가능 상태를 확인
 * @param element 확인할 요소
 * @returns 드래그 가능 여부
 */
export const isDraggable = (element: HTMLElement): boolean => {
  return element.draggable === true;
};

/**
 * 요소의 드래그 기능을 비활성화
 * @param element 비활성화할 요소
 */
export const disableDrag = (element: HTMLElement): void => {
  element.draggable = false;
  element.classList.remove('dragging');
};
