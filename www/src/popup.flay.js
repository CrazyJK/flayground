import './init/Popup';
import './popup.flay.scss';

import FlayPage from './flay/FlayPage';

const urlParams = new URL(location.href).searchParams;
const opus = urlParams.get('opus');

document.title = opus;
const flayPage = document.querySelector('body').appendChild(new FlayPage());
flayPage.set(opus);

const popupNo = urlParams.get('popupNo');
if (popupNo) {
  document.title += ` [${popupNo}]`;

  const popupMarker = document.querySelector('body').appendChild(document.createElement('label'));
  popupMarker.classList.add('marker');
  popupMarker.innerHTML = popupNo;
  popupMarker.addEventListener('click', () => {
    const offset = (parseInt(popupNo) - 1) % 3;
    positionTo(offset);
  });

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
} else {
  const positionMarker = document.querySelector('body').appendChild(document.createElement('div'));
  positionMarker.classList.add('position-marker');
  positionMarker.innerHTML = `<label data-offset="0">1</label><label data-offset="1">2</label><label data-offset="2">3</label>`;
  positionMarker.addEventListener('click', (e) => {
    const offset = parseInt(e.target.dataset.offset);
    positionTo(offset);
  });

  window.screen.orientation.onchange = () => {
    positionMarker.classList.toggle('hide', window.screen.orientation.type.startsWith('portrait'));
  };
  window.screen.orientation.dispatchEvent(new Event('change'));
}

function positionTo(offset) {
  window.moveBy(window.screen.availLeft - window.screenLeft + (window.screen.availWidth / 3) * offset, window.screen.availTop - window.screenTop);
  window.resizeTo(window.screen.availWidth / 3, window.screen.availHeight);
}
