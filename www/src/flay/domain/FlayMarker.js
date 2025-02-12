import { popupFlay } from '../../lib/FlaySearch';
import './FlayMarker.scss';

const DEFAULT_OPTIONS = { showTitle: true, showCover: false };

export default class FlayMarker extends HTMLLabelElement {
  constructor(flay, options = DEFAULT_OPTIONS) {
    super();

    options = { ...DEFAULT_OPTIONS, ...options };

    this.flay = flay;
    this.classList.add('flay-marker');
    this.classList.toggle('shot', flay.video.likes?.length > 0);
    this.classList.toggle('archive', flay.archive);
    this.addEventListener('click', () => {
      popupFlay(flay.opus);
      this.classList.add('active');
    });

    if (options.showCover) {
      this.addEventListener('mouseover', () => this.showCover(), { once: true });
    }

    if (options.showTitle) {
      this.title = `${flay.studio}\n${flay.opus}\n${flay.title}\n${flay.actressList.join(', ')}\n${flay.release}`;
    }
  }

  showCover() {
    this.classList.add('cover');
    this.style.backgroundImage = `url(/static/cover/${this.flay.opus})`;
  }
}

customElements.define('flay-marker', FlayMarker, { extends: 'label' });
