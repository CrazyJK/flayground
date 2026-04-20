/**
 * 브라우저 창 위치 및 크기 정보 관리 유틸리티
 *
 * 브라우저 창의 위치와 크기 정보를 localStorage에 저장하고 관리하는 기능을 제공합니다.
 * 페이지 로드, 언로드, 리사이즈, 가시성 변경 등의 이벤트에 따라 자동으로 위치 정보를 업데이트합니다.
 *
 * @author kamoru
 * @since 2024
 */

import FlayStorage from '@lib/FlayStorage';
import { addBeforeunloadListener, addLoadListener, addMouseoutToNullListener, addResizeListener, addVisibilitychangeListener } from '@lib/windowAddEventListener';

/** 위치 정보를 저장할 localStorage 키 */
export const STORAGE_KEY = 'flay.position.info' as const;

/**
 * 창 위치 정보 인터페이스
 */
interface WindowPosition {
  /** 창의 좌측 위치 */
  left: number;
  /** 창의 상단 위치 */
  top: number;
  /** 창의 너비 */
  width: number;
  /** 창의 높이 */
  height: number;
}

/**
 * 위치 정보 저장소 타입
 */
type PositionStorage = Record<string, WindowPosition>;

/**
 * 위치 정보 업데이트
 * @param name 창 이름 (일반적으로 document.title)
 * @param left 창의 좌측 위치 (기본값: 0)
 * @param top 창의 상단 위치 (기본값: 0)
 * @param width 창의 너비 (기본값: 0, 0이면 해당 항목 삭제)
 * @param height 창의 높이 (기본값: 0)
 */
const updatePosition = (name: string, left: number = 0, top: number = 0, width: number = 0, height: number = 0): void => {
  try {
    const positionInfo: PositionStorage = FlayStorage.local.getObject(STORAGE_KEY) || {};

    // 기존 항목 삭제
    delete positionInfo[name];

    // width가 0보다 크면 새로운 위치 정보 저장
    if (width > 0 && height > 0) {
      positionInfo[name] = { left, top, width, height };
    }

    FlayStorage.local.setObject(STORAGE_KEY, positionInfo);
  } catch (error) {
    console.error('위치 정보 업데이트 중 오류 발생:', error);
  }
};

// 이벤트 리스너 등록
addLoadListener(() => update());

addBeforeunloadListener(() => update());

addResizeListener(() => update(), true);

addMouseoutToNullListener(() => update());

addVisibilitychangeListener(
  () => update(),
  () => remove()
);

/**
 * 현재 창의 위치 정보를 업데이트합니다.
 * document.title을 키로 사용하여 창의 위치와 크기 정보를 저장합니다.
 */
function update(): void {
  updatePosition(document.title, window.screenLeft, window.screenTop, window.outerWidth, window.outerHeight);
}

/**
 * 현재 창의 위치 정보를 제거합니다.
 * 주로 창이 숨겨질 때 호출됩니다.
 */
function remove(): void {
  updatePosition(document.title);
}

/**
 * 저장된 위치 정보를 가져옵니다.
 * @param name 창 이름 (생략 시 모든 위치 정보 반환)
 * @returns 위치 정보 객체 또는 전체 저장소
 */
export const getPosition = (name?: string): WindowPosition | PositionStorage | null => {
  try {
    const positionInfo: PositionStorage = FlayStorage.local.getObject(STORAGE_KEY) || {};

    if (name) {
      return positionInfo[name] ?? null;
    }

    return positionInfo;
  } catch (error) {
    console.error('위치 정보 조회 중 오류 발생:', error);
    return null;
  }
};

/**
 * 특정 창의 위치 정보를 가져옵니다.
 * @param name 창 이름
 * @returns 위치 정보 객체 또는 null
 */
export const getPositionByName = (name: string): WindowPosition | null => {
  return getPosition(name) as WindowPosition | null;
};

/**
 * 모든 위치 정보를 초기화합니다.
 */
export const clearAllPositions = (): void => {
  try {
    FlayStorage.local.setObject(STORAGE_KEY, {});
  } catch (error) {
    console.error('위치 정보 초기화 중 오류 발생:', error);
  }
};

/**
 * 특정 창의 위치 정보를 제거합니다.
 * @param name 제거할 창 이름
 */
export const removePosition = (name: string): void => {
  updatePosition(name);
};
