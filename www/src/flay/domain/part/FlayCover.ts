import FlayPartElement from '@flay/domain/part/FlayPartElement';
import { ColorFrequency, getDominatedColors } from '@lib/dominatedColor';
import FlayFetch, { Flay } from '@lib/FlayFetch';
import { popupCover } from '@lib/FlaySearch';
import FlayStorage from '@lib/FlayStorage';
import RandomUtils from '@lib/RandomUtils';
import newWindowSVG from '@svg/newWindow';
import './FlayCover.scss';

const colorLabelLength = 5;

/**
 * Custom element of Cover
 */
export default class FlayCover extends FlayPartElement {
  #coverImage!: HTMLImageElement;
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

    this.#coverImage = this.querySelector('img')!;
    this.#colorLabels = Array.from(this.querySelectorAll('.color-wrapper > label'));

    this.addEventListener('click', () => this.#handlerToggleClass());
    this.querySelector('svg')?.addEventListener('click', (e) => this.#handlerPopupCover(e));
  }

  connectedCallback() {}

  /**
   *
   * @param flay
   */
  set(flay: Flay): void {
    this.setFlay(flay);

    this.classList.remove('visible');

    this.#coverImage.onload = () => this.#handlerOnloadCover();
    FlayFetch.getCoverURL(this.flay.opus)
      .then((objectURL) => (this.#coverImage.src = objectURL))
      .catch((error: unknown) => {
        console.error('Error fetching cover URL:', error);
      });
  }

  #handlerOnloadCover(): void {
    this.classList.add('visible');
    if (this.inCard) return;

    // 대표색상 추출
    const KEY_DOMINATED_COLOR = `dominatedColor_${this.flay.opus}`;
    const savedDominatedColors = FlayStorage.session.getObject(KEY_DOMINATED_COLOR, null) as ColorFrequency[] | null;
    if (savedDominatedColors === null) {
      getDominatedColors(this.#coverImage, { scale: 0.2, offset: 16, limit: colorLabelLength })
        .then((dominatedColors) => {
          FlayStorage.session.set(KEY_DOMINATED_COLOR, JSON.stringify(dominatedColors));
          this.#applyDominatedColor(dominatedColors);
        })
        .catch((error: unknown) => {
          console.error('Error fetching dominated colors:', error);
        });
    } else {
      this.#applyDominatedColor(savedDominatedColors);
    }
  }

  #applyDominatedColor(dominatedColors: ColorFrequency[]): void {
    if (!dominatedColors || dominatedColors.length === 0) {
      console.warn('No dominated colors available');
      return;
    }

    // 안전한 랜덤 인덱스 선택
    const randomIndex = RandomUtils.getRandomInt(0, Math.min(dominatedColors.length, colorLabelLength));
    const selectedColor = dominatedColors[randomIndex];

    if (selectedColor) {
      const [r, g, b] = selectedColor.rgba;
      this.style.backgroundColor = `rgba(${r},${g},${b},0.5)`;
    }

    // 안전한 색상 라벨 적용
    this.#colorLabels.forEach((label, i) => {
      const color = dominatedColors[i];
      if (color) {
        label.style.backgroundColor = `rgba(${color.rgba.join(',')})`;
      }
    });
  }

  #handlerToggleClass(): void {
    this.classList.toggle('contain');
  }

  #handlerPopupCover(e: MouseEvent): void {
    e.stopPropagation();
    popupCover(this.flay.opus);
  }
}

customElements.define('flay-cover', FlayCover);
