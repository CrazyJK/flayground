import FlayCache from '../../lib/FlayCache';
import newWindowSVG from '../../svg/newWindow.svg';
import { popupCover } from '../../util/FlaySearch';
import FlayStorage from '../../util/FlayStorage';
import { getDominatedColors } from '../../util/dominatedColor';
import { getRandomInt } from '../../util/randomNumber';
import './FlayCover.scss';
import FlayHTMLElement, { defineCustomElements } from './FlayHTMLElement';

const colorLabelLength = 5;

/**
 * Custom element of Cover
 */
export default class FlayCover extends FlayHTMLElement {
  #coverImage;
  #colorLabels;

  constructor() {
    super();

    this.innerHTML = `
      <img class="cover-image" aria-label="flay cover">
      <div class="color-wrapper">${Array.from({ length: colorLabelLength })
        .map(() => '<label></label>')
        .join('')}</div>
      <div class="popup-cover-wrapper">${newWindowSVG}</div>
    `;

    this.#coverImage = this.querySelector('img');
    this.#colorLabels = this.querySelectorAll('.color-wrapper > label');

    this.addEventListener('click', () => this.classList.toggle('contain'));
    this.querySelector('svg').addEventListener('click', (e) => {
      e.stopPropagation();
      popupCover(this.flay.opus);
    });
  }

  connectedCallback() {
    this.classList.add('flay-cover');
  }

  /**
   *
   * @param {Flay} flay
   */
  set(flay) {
    this.setFlay(flay);

    this.classList.remove('visible');

    this.#coverImage.onload = () => {
      this.classList.add('visible');
      if (this.inCard) return;

      // 대표색상 추출
      const KEY_DOMINATED_COLOR = `dominatedColor_${this.flay.opus}`;
      const savedDominatedColors = FlayStorage.session.getObject(KEY_DOMINATED_COLOR, null);
      if (savedDominatedColors == null) {
        getDominatedColors(this.#coverImage, { scale: 0.2, offset: 16, limit: colorLabelLength }).then((dominatedColors) => {
          FlayStorage.session.set(KEY_DOMINATED_COLOR, JSON.stringify(dominatedColors));
          this.#applyDominatedColor(dominatedColors);
        });
      } else {
        this.#applyDominatedColor(savedDominatedColors);
      }
    };

    FlayCache.getCover(this.flay.opus).then((objectURL) => {
      this.#coverImage.src = objectURL;
    });
  }

  #applyDominatedColor(dominatedColors) {
    const [r, g, b] = dominatedColors[getRandomInt(0, colorLabelLength)].rgba;
    this.style.backgroundColor = `rgba(${r},${g},${b},0.5)`;
    this.#colorLabels.forEach((label, i) => (label.style.backgroundColor = `rgba(${dominatedColors[i].rgba.join(',')})`));
  }
}

defineCustomElements('flay-cover', FlayCover);
