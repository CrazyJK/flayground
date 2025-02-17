import { popupFlay } from '../../lib/FlaySearch';
import favorite from '../../svg/favorite';
import ranks from '../../svg/ranks';
import './FlayMarker.scss';

const DEFAULT_OPTIONS = { showTitle: true, showCover: false, /** 모양. square, circle, star, heart, rhombus */ shape: 'square' };

export default class FlayMarker extends HTMLLabelElement {
  /**
   * @param {Flay} flay
   * @param {DEFAULT_OPTIONS} options
   */
  constructor(flay, options) {
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

    if (options.showCover) this.addEventListener('mouseover', () => this.showCover(), { once: true });
    if (options.showTitle) this.title = `${flay.studio}\n${flay.opus}\n${flay.title}\n${flay.actressList.join(', ')}\n${flay.release}`;

    this.classList.add(options.shape);
    if (options.shape === 'heart') this.innerHTML = favorite;
    else if (options.shape === 'star') this.innerHTML = ranks[flay.video.rank + 1];
  }

  showCover() {
    this.classList.add('cover');
    this.style.backgroundImage = `url(/static/cover/${this.flay.opus})`;
  }
}

customElements.define('flay-marker', FlayMarker, { extends: 'label' });
