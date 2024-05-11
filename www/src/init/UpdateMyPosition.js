import { updatePosition } from '../flay/FlayMonitor';
import { addBeforeunloadListener, addLoadListener, addMouseoutListener, addResizeListener, addVisibilitychangeListener } from '../util/windowAddEventListener';

addLoadListener(() => update());

addBeforeunloadListener(() => update());

addResizeListener(() => update());

addMouseoutListener((e) => e.toElement === null && update());

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
