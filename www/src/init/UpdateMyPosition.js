import { updatePosition } from '../flay/FlayMonitor';
import { addBeforeunloadListener, addLoadListener, addMouseoutToNullListener, addResizeListener, addVisibilitychangeListener } from '../util/windowAddEventListener';

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
