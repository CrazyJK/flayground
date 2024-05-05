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
  const [COL, ROW] = (() => {
    switch (window.screen.width) {
      case 1080:
        return [2, 3];
      case 1920:
        return [3, 2];
      case 2560:
        return [4, 3];
      default:
        return [3, 2];
    }
  })();
  const colRange = Array.from({ length: COL }).map((v, i) => i + 1);
  const rowRange = Array.from({ length: ROW }).map((v, i) => i + 1);
  console.log('window.screen.onchange', window.screen.width, COL, ROW);

  document.querySelector('.snap-layouts')?.remove();
  const snapLayouts = document.querySelector('body').appendChild(document.createElement('div'));
  snapLayouts.classList.add('snap-layouts');
  snapLayouts.addEventListener('click', (e) => {
    if (e.target.tagName !== 'LABEL') return;

    snapLayouts.querySelectorAll('label').forEach((label) => label.classList.toggle('active', label === e.target));

    const [availLeft, availTop, availWidth, availHeight] = [window.screen.availLeft, window.screen.availTop, window.screen.availWidth, window.screen.availHeight];
    const [left, top] = [window.screenLeft, window.screenTop];

    const [col, row] = e.target.dataset.colRow.split(',').map((x) => parseInt(x));

    const w = availWidth / COL;
    const h = availHeight / (row > 0 ? ROW : 1);
    const x = availLeft - left + w * (col - 1);
    const y = availTop - top + h * (row > 0 ? row - 1 : 0);

    window.resizeTo(w, h);
    window.moveBy(x, y);

    console.log(`
    ${availLeft}, ${availTop}
      ${rowRange.map((r) => colRange.map((c) => (col === c && (row === 0 || row === r) ? '▣' : '▦')).join('')).join('\n      ')} ${availWidth}, ${availHeight}

    ${window.screenLeft}, ${window.screenTop}
      ▣ ${w}, ${h}
    `);
  });

  snapLayouts.innerHTML = `
    <div class="layout row-1">
      <div class="row">${colRange.map((c) => `<label data-col-row="${c},0" title="${c}"></label>`).join('')}</div>
    </div>
    <div class="layout row-n">
      ${rowRange.map((r) => '<div class="row">' + colRange.map((c) => `<label data-col-row="${c},${r}" title="${c},${r}"></label>`).join('') + '</div>').join('')}
    </div>`;
};
window.screen.dispatchEvent(new Event('change'));
