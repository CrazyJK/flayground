import './snapLayouts.scss';

const LAYOUTs = {
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

const numbers = (n) => Array.from({ length: n }).map((v, i) => i + 1);

const moveToSnapPosition = ([COL, ROW], [col, row]) => {
  const { availLeft: aL, availTop: aT, availWidth: aW, availHeight: aH } = window.screen;
  const [sL, sT] = [window.screenLeft, window.screenTop];

  const w = aW / COL;
  const h = aH / (row > 0 ? ROW : 1);
  const byX = aL - sL + w * (col - 1);
  const byY = aT - sT + h * (row > 0 ? row - 1 : 0);

  window.resizeTo(w, h);
  window.moveBy(byX, byY);

  return [w, h, byX, byY];
};

const displaySnapPosition = ([COL, ROW], [col, row], [w, h]) => {
  const { availLeft: aL, availTop: aT, availWidth: aW, availHeight: aH } = window.screen;
  const [sL, sT] = [window.screenLeft, window.screenTop];

  const sep = `\n      `;

  console.log(`
  ${aL}, ${aT}${sep}${numbers(ROW)
    .map((r) =>
      numbers(COL)
        .map((c) => (col === c && (row === 0 || row === r) ? '▣' : '▦'))
        .join('')
    )
    .join(sep)} ${aW}, ${aH}

  ${sL}, ${sT}${sep}▣ ${w}, ${h}`);
};

export default () => {
  window.screen.onchange = () => {
    console.debug('window.screen.onchange', window.screen);

    document.querySelector('.snap-layouts')?.remove();
    const snapLayouts = document.querySelector('body').appendChild(document.createElement('div'));
    snapLayouts.classList.add('snap-layouts', window.screen.orientation.type);
    snapLayouts.innerHTML = LAYOUTs[window.screen.width]
      .map(
        ([COL, ROW]) => `
          <div class="layout" data-col-row="${COL},${ROW}">
            ${numbers(ROW)
              .map(
                (r) => `
                  <div class="row">
                    ${numbers(COL)
                      .map((c) => `<label data-col-row="${c},${r}"></label>`)
                      .join('')}
                  </div>`
              )
              .join('')}
          </div>`
      )
      .join('');
    snapLayouts.addEventListener('click', (e) => {
      if (e.target.tagName !== 'LABEL') return;

      const snap = e.target;
      const layout = e.target.closest('.layout');
      const [col, row] = snap.dataset.colRow.split(',').map((n) => parseInt(n));
      const [COL, ROW] = layout.dataset.colRow.split(',').map((n) => parseInt(n));

      const [w, h] = moveToSnapPosition([COL, ROW], [col, row]);
      displaySnapPosition([COL, ROW], [col, row], [w, h]);
      snapLayouts.querySelectorAll('label').forEach((label) => label.classList.toggle('active', label === snap));
    });
  };
  window.screen.dispatchEvent(new Event('change'));
};
