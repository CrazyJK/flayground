import { updatePosition } from '../flay/FlayMonitor';
import { addBeforeunloadListener, addLoadListener, addResizeListener, addVisibilitychangeListener, addWindowmoveListener } from '../util/windowAddEventListener';

addLoadListener(() => update());

addBeforeunloadListener(() => update());

addResizeListener(() => update());

addWindowmoveListener(() => update());

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
