/**
 * 윈도우 이벤트 리스너 관리 유틸리티
 *
 * 다양한 윈도우 이벤트(load, beforeunload, resize, mouseout, visibilitychange)에 대한
 * 리스너를 등록하고 관리하는 기능을 제공합니다.
 *
 * 특징:
 * - resize와 visibilitychange 이벤트는 디바운싱 적용
 * - 등록된 리스너는 배열로 관리되어 여러 개 등록 가능
 * - 각 함수는 리스너 제거 함수를 반환
 * - 타입 안전성을 보장하는 TypeScript 구현
 *
 * @author kamoru
 * @since 2024
 */

/**
 * 이벤트 리스너 함수 타입
 */
type EventListener = (event: Event) => void;

/**
 * 이벤트 타입 정의
 */
type EventType = 'resize' | 'beforeunload' | 'load' | 'mouseout' | 'mouseoutToNull' | 'visible' | 'hidden';

/**
 * 이벤트 리스너 저장소 타입
 */
type EventListeners = Record<EventType, EventListener[]>;

/**
 * 등록된 이벤트 리스너들을 관리하는 객체
 * 각 이벤트 타입별로 리스너 배열을 저장
 */
const eventListeners: EventListeners = {
  resize: [],
  beforeunload: [],
  load: [],
  mouseout: [],
  mouseoutToNull: [],
  visible: [],
  hidden: [],
} as const;

/**
 * 디바운싱 설정
 */
const DEBOUNCE_CONFIG = {
  /** 리사이즈 이벤트 디바운스 지연 시간 (밀리초) */
  RESIZE_DELAY: 300,
  /** 가시성 변경 이벤트 디바운스 지연 시간 (밀리초) */
  VISIBLE_DELAY: 300,
} as const;

/** 리사이즈 이벤트 디바운스용 타이머 */
let resizeTimer: ReturnType<typeof setTimeout> | undefined;

/** 가시성 변경 이벤트 디바운스용 타이머 */
let visibleTimer: ReturnType<typeof setTimeout> | undefined;

/**
 * window load 이벤트 등록
 * @param listener 등록할 이벤트 리스너 함수
 * @returns 리스너 제거 함수
 */
export const addLoadListener = (listener: EventListener): (() => void) => {
  if (typeof listener !== 'function') {
    console.error('리스너는 함수여야 합니다');
    return () => {};
  }
  eventListeners.load.push(listener);
  return () => removeListener('load', listener);
};

/**
 * window beforeunload 이벤트 등록
 * @param listener 등록할 이벤트 리스너 함수
 * @returns 리스너 제거 함수
 */
export const addBeforeunloadListener = (listener: EventListener): (() => void) => {
  if (typeof listener !== 'function') {
    console.error('리스너는 함수여야 합니다');
    return () => {};
  }
  eventListeners.beforeunload.push(listener);
  return () => removeListener('beforeunload', listener);
};

/**
 * window mouseout 이벤트 등록
 * @param listener 등록할 이벤트 리스너 함수
 * @returns 리스너 제거 함수
 */
export const addMouseoutListener = (listener: EventListener): (() => void) => {
  if (typeof listener !== 'function') {
    console.error('리스너는 함수여야 합니다');
    return () => {};
  }
  eventListeners.mouseout.push(listener);
  return () => removeListener('mouseout', listener);
};

/**
 * 마우스가 화면 밖으로 나간 이벤트 등록
 * @param listener 등록할 이벤트 리스너 함수
 * @returns 리스너 제거 함수
 */
export const addMouseoutToNullListener = (listener: EventListener): (() => void) => {
  if (typeof listener !== 'function') {
    console.error('리스너는 함수여야 합니다');
    return () => {};
  }
  eventListeners.mouseoutToNull.push(listener);
  return () => removeListener('mouseoutToNull', listener);
};

/**
 * window resize 이벤트 핸들러를 등록한다.
 * - 등록 즉시 1회 수행한다
 * @param listener 등록할 이벤트 리스너 함수
 * @returns 리스너 제거 함수
 */
export const addResizeListener = (listener: EventListener): (() => void) => {
  if (typeof listener !== 'function') {
    console.error('리스너는 함수여야 합니다');
    return () => {};
  }
  eventListeners.resize.push(listener);
  listener(new Event('resize'));
  return () => removeListener('resize', listener);
};

/**
 * window visibilitychange 이벤트 등록
 * @param visibleListener 화면이 보일 때 실행할 이벤트 리스너 함수
 * @param hiddenListener 화면이 숨겨질 때 실행할 이벤트 리스너 함수 (선택사항)
 * @returns 리스너 제거 함수
 */
export const addVisibilitychangeListener = (visibleListener: EventListener, hiddenListener?: EventListener): (() => void) => {
  if (typeof visibleListener !== 'function' || (hiddenListener && typeof hiddenListener !== 'function')) {
    console.error('리스너는 함수여야 합니다');
    return () => {};
  }

  eventListeners.visible.push(visibleListener);
  if (hiddenListener) {
    eventListeners.hidden.push(hiddenListener);
  }

  return () => {
    removeListener('visible', visibleListener);
    if (hiddenListener) {
      removeListener('hidden', hiddenListener);
    }
  };
};

/**
 * 등록된 리스너 제거
 * @param eventType 이벤트 타입
 * @param listener 제거할 리스너 함수
 * @returns 제거 성공 여부
 */
export const removeListener = (eventType: EventType, listener: EventListener): boolean => {
  if (!eventListeners[eventType]) {
    console.warn(`알 수 없는 이벤트 타입: ${eventType}`);
    return false;
  }

  const index = eventListeners[eventType].indexOf(listener);
  if (index !== -1) {
    eventListeners[eventType].splice(index, 1);
    return true;
  }
  return false;
};

/**
 * 모든 이벤트 리스너 초기화
 * @param eventType 특정 이벤트 타입만 초기화 (생략 시 모든 이벤트)
 */
export const clearListeners = (eventType?: EventType): void => {
  if (eventType) {
    if (eventListeners[eventType]) {
      eventListeners[eventType] = [];
    } else {
      console.warn(`알 수 없는 이벤트 타입: ${eventType}`);
    }
  } else {
    Object.keys(eventListeners).forEach((type) => {
      eventListeners[type as EventType] = [];
    });
  }
};

/**
 * 이벤트 리스너 실행 함수
 * @param e 발생한 이벤트
 * @param listeners 실행할 리스너 목록
 */
function executeListeners(e: Event, listeners: EventListener[]): void {
  if (listeners.length > 0) {
    console.debug(e.type, listeners);
    for (const listener of listeners) {
      try {
        listener(e);
      } catch (error) {
        console.error(`이벤트 리스너 실행 중 오류 발생: ${(error as Error).message}`, error);
      }
    }
  }
}

// 이벤트 등록
window.addEventListener('load', (e: Event) => executeListeners(e, eventListeners.load));

window.addEventListener('beforeunload', (e: BeforeUnloadEvent) => executeListeners(e, eventListeners.beforeunload));

window.addEventListener('mouseout', (e: MouseEvent) => {
  // 마우스가 브라우저 창 밖으로 나갔는지 확인
  const mouseEvent = e as MouseEvent & { toElement?: Element | null };
  if (mouseEvent.toElement === null || !mouseEvent.relatedTarget) {
    executeListeners(e, eventListeners.mouseoutToNull);
  }
  executeListeners(e, eventListeners.mouseout);
});

window.addEventListener('resize', (e: Event) => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => executeListeners(e, eventListeners.resize), DEBOUNCE_CONFIG.RESIZE_DELAY);
});

window.addEventListener('visibilitychange', (e: Event) => {
  if (document.visibilityState === 'visible') {
    clearTimeout(visibleTimer);
    visibleTimer = setTimeout(() => executeListeners(e, eventListeners.visible), DEBOUNCE_CONFIG.VISIBLE_DELAY);
  } else {
    executeListeners(e, eventListeners.hidden);
  }
});
