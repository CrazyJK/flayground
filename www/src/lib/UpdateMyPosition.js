import { addBeforeunloadListener, addLoadListener, addMouseoutToNullListener, addResizeListener, addVisibilitychangeListener } from '@lib/windowAddEventListener';
import FlayStorage from './FlayStorage';

export const STORAGE_KEY = 'flay.position.info';

/**
 * 위치 정보 업데이트
 * @param {string} name
 * @param {number} left
 * @param {number} top
 * @param {number} width
 * @param {number} height
 */
const updatePosition = (name, left, top, width = 0, height) => {
  const positionInfo = FlayStorage.local.getObject(STORAGE_KEY);
  delete positionInfo[name];
  if (width > 0) {
    positionInfo[name] = { left: left, top: top, width: width, height: height };
  }
  FlayStorage.local.setObject(STORAGE_KEY, positionInfo);
};

addLoadListener(() => update());

addBeforeunloadListener(() => update());

addResizeListener(() => update());

addMouseoutToNullListener(() => update());

addVisibilitychangeListener(
  () => update(),
  () => remove()
);

function update() {
  updatePosition(document.title, window.screenLeft, window.screenTop, window.outerWidth, window.outerHeight);
}

function remove() {
  updatePosition(document.title);
}
