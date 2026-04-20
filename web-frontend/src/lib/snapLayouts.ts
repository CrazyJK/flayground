import './snapLayouts.scss';

// 브라우저별로 다른 Screen API 확장을 위한 인터페이스
interface ExtendedScreen extends Screen {
  availLeft?: number;
  availTop?: number;
  onchange?: ((this: Screen, ev: Event) => void) | null;
  dispatchEvent?: (event: Event) => boolean;
}

// 레이아웃 설정 타입
type LayoutConfig = [number, number]; // [열, 행]
type LayoutConfigs = {
  [width: number]: LayoutConfig[];
};

const LAYOUTs: LayoutConfigs = {
  1080: [
    [2, 2],
    [2, 3],
  ],
  1440: [
    [2, 2],
    [2, 3],
    [2, 4],
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

const numbers = (n: number): number[] => Array.from({ length: n }).map((_, i) => i + 1);

const moveToSnapPosition = ([COL, ROW]: LayoutConfig, [col, row]: [number, number]): [number, number, number, number] => {
  const screen = window.screen as ExtendedScreen;
  const { availLeft: aL = 0, availTop: aT = 0, availWidth: aW, availHeight: aH } = screen;
  const [sL, sT] = [window.screenLeft, window.screenTop];

  const w = aW / COL;
  const h = aH / (row > 0 ? ROW : 1);
  const byX = aL - sL + w * (col - 1);
  const byY = aT - sT + h * (row > 0 ? row - 1 : 0);

  window.resizeTo(w, h);
  window.moveBy(byX, byY);

  return [w, h, byX, byY];
};

const displaySnapPosition = ([COL, ROW]: LayoutConfig, [col, row]: [number, number], [w, h]: [number, number]): void => {
  const screen = window.screen as ExtendedScreen;
  const { availLeft: aL = 0, availTop: aT = 0, availWidth: aW, availHeight: aH } = screen;
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

export default (): void => {
  const extendedScreen = window.screen as ExtendedScreen;

  if (extendedScreen.onchange !== undefined) {
    extendedScreen.onchange = () => {
      console.debug('window.screen.onchange', window.screen);

      document.querySelector('.snap-layouts')?.remove();
      const snapLayouts = document.body.appendChild(document.createElement('div'));
      snapLayouts.classList.add('snap-layouts', window.screen.orientation.type);
      snapLayouts.innerHTML = LAYOUTs[window.screen.width]!.map(
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
      ).join('');

      snapLayouts.addEventListener('click', (e: Event) => {
        const target = e.target as HTMLElement;
        if (!target || target.tagName !== 'LABEL') return;

        const snap = target as HTMLLabelElement;
        const layout = target.closest('.layout') as HTMLElement;
        if (!layout || !snap.dataset.colRow || !layout.dataset.colRow) return;

        const [col, row] = snap.dataset.colRow.split(',').map((n: string) => parseInt(n));
        const [COL, ROW] = layout.dataset.colRow.split(',').map((n: string) => parseInt(n));

        const [w, h] = moveToSnapPosition([COL!, ROW!], [col!, row!]);
        displaySnapPosition([COL!, ROW!], [col!, row!], [w, h]);
        snapLayouts.querySelectorAll('label').forEach((label) => label.classList.toggle('active', label === snap));
      });
    };
  }

  // Screen의 change 이벤트를 직접 트리거 (브라우저별 호환성을 위해)
  if (extendedScreen.dispatchEvent) {
    extendedScreen.dispatchEvent(new Event('change'));
  } else {
    // fallback: 직접 호출
    if (extendedScreen.onchange) {
      extendedScreen.onchange.call(extendedScreen, new Event('change'));
    }
  }
};
