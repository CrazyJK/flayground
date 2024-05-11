import { updatePosition } from '../flay/FlayMonitor';
import { addResizeLazyEventListener } from '../util/resizeListener';

window.onbeforeunload = () => updatePosition(document.title);

window.onmouseout = (e) => e.toElement === null && updatePosition(document.title, window.screenLeft, window.screenTop, window.outerWidth, window.outerHeight);

window.onload = () => updatePosition(document.title, window.screenLeft, window.screenTop, window.outerWidth, window.outerHeight);

addResizeLazyEventListener(() => updatePosition(document.title, window.screenLeft, window.screenTop, window.outerWidth, window.outerHeight));
