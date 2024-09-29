import './init/Popup';
import './popup.flay.scss';

import FlayVertical from './flay/FlayVertical';
import snapLayouts from './util/snapLayouts';

const urlParams = new URL(location.href).searchParams;
const opus = urlParams.get('opus');

document.title = opus;
document.querySelector('body').appendChild(new FlayVertical()).set(opus);

const popupNo = urlParams.get('popupNo');
if (popupNo) {
  document.title += ` [${popupNo}]`;

  const popupMarker = document.querySelector('body').appendChild(document.createElement('label'));
  popupMarker.classList.add('marker');
  popupMarker.innerHTML = popupNo;

  window.addEventListener(
    'message',
    (e) => {
      console.log('message', e);
      if (e.data === 'over') {
        document.querySelector('body').setAttribute('style', 'background-color: var(--color-bg-focus)');
      } else {
        document.querySelector('body').removeAttribute('style');
      }
    },
    false
  );
}

snapLayouts();
