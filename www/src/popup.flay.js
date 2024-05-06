import './init/Popup';
import './popup.flay.scss';

import FlayPage from './flay/FlayPage';

const urlParams = new URL(location.href).searchParams;
const opus = urlParams.get('opus');

document.title = opus;
document.querySelector('body').appendChild(new FlayPage()).set(opus);

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

window.screen.onchange = () => {
  const layouts = {
    1080: [
      [2, 2],
      [2, 3],
    ],
    1920: [
      [3, 1],
      [3, 2],
    ],
    2560: [
      [3, 1],
      [3, 2],
      [4, 1],
      [4, 2],
      [4, 3],
    ],
  };

  console.log('window.screen.onchange', window.screen);

  document.querySelector('.snap-layouts')?.remove();
  const snapLayouts = document.querySelector('body').appendChild(document.createElement('div'));
  snapLayouts.classList.add('snap-layouts', window.screen.orientation.type);
  snapLayouts.innerHTML = '';
  snapLayouts.addEventListener('click', (e) => {
    if (e.target.tagName !== 'LABEL') return;

    snapLayouts.querySelectorAll('label').forEach((label) => label.classList.toggle('active', label === e.target));

    const [availLeft, availTop, availWidth, availHeight] = [window.screen.availLeft, window.screen.availTop, window.screen.availWidth, window.screen.availHeight];
    const [left, top] = [window.screenLeft, window.screenTop];

    const [col, row] = e.target.dataset.colRow.split(',').map((x) => parseInt(x));
    const [COL, ROW] = e.target
      .closest('.layout')
      .dataset.colRow.split(',')
      .map((x) => parseInt(x));

    const w = availWidth / COL;
    const h = availHeight / (row > 0 ? ROW : 1);
    const x = availLeft - left + w * (col - 1);
    const y = availTop - top + h * (row > 0 ? row - 1 : 0);

    window.resizeTo(w, h);
    window.moveBy(x, y);

    const colRange = Array.from({ length: COL }).map((v, i) => i + 1);
    const rowRange = Array.from({ length: ROW }).map((v, i) => i + 1);
    const separator = `\n      `;
    console.log(`
    ${availLeft}, ${availTop}${separator}${rowRange.map((r) => colRange.map((c) => (col === c && (row === 0 || row === r) ? '▣' : '▦')).join('')).join(separator)} ${availWidth}, ${availHeight}

    ${window.screenLeft}, ${window.screenTop}${separator}▣ ${w}, ${h}
    `);

    // opener addRect
    opener.document.querySelector('flay-monitor').addFlay(opus, window.screenLeft, window.screenTop, w, h);
  });

  layouts[window.screen.width].forEach(([COL, ROW]) => {
    const colRange = Array.from({ length: COL }).map((v, i) => i + 1);
    const rowRange = Array.from({ length: ROW }).map((v, i) => i + 1);

    snapLayouts.innerHTML += `
      <div class="layout" data-col-row="${COL},${ROW}">
        ${rowRange.map((r) => '<div class="row">' + colRange.map((c) => `<label data-col-row="${c},${r}"></label>`).join('') + '</div>').join('')}
      </div>`;
  });
};
window.screen.dispatchEvent(new Event('change'));

window.onbeforeunload = (e) => {
  opener?.document.querySelector('flay-monitor')?.removeFlay(opus);
};

// setInterval(() => {
//   opener?.document.querySelector('flay-monitor')?.addFlay(opus, window.screenLeft, window.screenTop, window.outerWidth, window.outerHeight);
// }, 1000);
