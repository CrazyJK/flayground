import { popupFlay } from '../../lib/FlaySearch';
import './FlayMarker.scss';

export default class FlayMarker extends HTMLLabelElement {
  constructor(flay, options = { showTitle: true }) {
    super();

    this.flay = flay;
    this.classList.add('flay-marker');
    this.classList.toggle('shot', flay.video.likes?.length > 0);
    this.classList.toggle('archive', flay.archive);
    this.addEventListener('click', () => {
      popupFlay(flay.opus);
      this.classList.add('active');
    });

    if (options.showTitle) {
      this.title = `${flay.studio}\n${flay.opus}\n${flay.title}\n${flay.actressList.join(', ')}\n${flay.release}`;
    }
  }
}

customElements.define('flay-marker', FlayMarker, { extends: 'label' });
