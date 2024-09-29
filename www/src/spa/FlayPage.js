import FlayVertical from '../flay/FlayVertical';
import FlayCondition from '../flay/page/FlayCondition';
import FlayPagination from '../flay/page/FlayPagination';

export default class FlayPage extends HTMLDivElement {
  constructor() {
    super();

    this.classList.add('flay-page');

    const flayCondition = this.appendChild(new FlayCondition());
    const flayVertical = this.appendChild(new FlayVertical());
    const flayPagination = this.appendChild(new FlayPagination());

    flayCondition.addEventListener('fetch', () => flayPagination.set(flayCondition.opusList));
    flayPagination.addEventListener('change', async () => {
      flayPagination.off();
      const viewTransition = document.startViewTransition(async () => {
        const { flay } = await flayVertical.set(flayPagination.opus);
        flayCondition.updateSearchItem(flay);
      });
      await viewTransition.updateCallbackDone;
      flayPagination.on();
    });
  }
}

customElements.define('flay-page', FlayPage, { extends: 'div' });
