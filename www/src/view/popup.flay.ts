import FlayPage from '@flay/domain/FlayPage';
import snapLayouts from '@lib/snapLayouts';
import './inc/Popup';
import './popup.flay.scss';

const urlParams = new URL(location.href).searchParams;
const opus = urlParams.get('opus');
const popupNo = urlParams.get('popupNo');

document.title = opus;

const flayPage = document.body.appendChild(new FlayPage());
flayPage.classList.add('popup');
flayPage.set(opus);

if (popupNo) {
  document.title += ` [${popupNo}]`;

  const popupMarker = document.body.appendChild(document.createElement('label'));
  popupMarker.classList.add('marker');
  popupMarker.innerHTML = popupNo;

  window.addEventListener(
    'message',
    (e) => {
      console.log('message', e);
      if (e.data === 'over') {
        document.body.setAttribute('style', 'background-color: var(--color-bg-focus)');
      } else {
        document.body.removeAttribute('style');
      }
    },
    false
  );
}

snapLayouts();
