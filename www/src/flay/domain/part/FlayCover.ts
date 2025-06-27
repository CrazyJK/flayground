import { ColorFrequency, getDominatedColors } from '@lib/dominatedColor';
import FlayFetch, { Flay } from '@lib/FlayFetch';
import { popupCover } from '@lib/FlaySearch';
import FlayStorage from '@lib/FlayStorage';
import { getRandomInt } from '@lib/randomNumber';
import newWindowSVG from '@svg/newWindow';
import './FlayCover.scss';
import FlayHTMLElement, { defineCustomElements } from './FlayHTMLElement';

const colorLabelLength = 5;

/**
 * Custom element of Cover
 */
export default class FlayCover extends FlayHTMLElement {
  #coverImage: HTMLImageElement | null;
  #colorLabels: HTMLLabelElement[];

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
    this.#colorLabels = Array.from(this.querySelectorAll('.color-wrapper > label'));

    this.addEventListener('click', () => this.#handlerToggleClass());
    this.querySelector('svg').addEventListener('click', (e) => this.#handlerPopupCover(e));
  }

  connectedCallback() {
    this.classList.add('flay-cover');
  }

  /**
   *
   * @param flay
   */
  set(flay: Flay): void {
    this.setFlay(flay);

    this.classList.remove('visible');

    this.#coverImage.onload = () => this.#handlerOnloadCover();
    FlayFetch.getCoverURL(this.flay.opus).then((objectURL) => (this.#coverImage.src = objectURL));
  }

  #handlerOnloadCover(): void {
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
  }

  #applyDominatedColor(dominatedColors: ColorFrequency[]): void {
    const [r, g, b] = dominatedColors[getRandomInt(0, colorLabelLength)].rgba;
    this.style.backgroundColor = `rgba(${r},${g},${b},0.5)`;
    this.#colorLabels.forEach((label, i) => (label.style.backgroundColor = `rgba(${dominatedColors[i].rgba.join(',')})`));
  }

  #handlerToggleClass(): void {
    this.classList.toggle('contain');
  }

  #handlerPopupCover(e: MouseEvent): void {
    e.stopPropagation();
    popupCover(this.flay.opus);
  }
}

defineCustomElements('flay-cover', FlayCover);
