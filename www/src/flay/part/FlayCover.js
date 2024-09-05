import newWindowSVG from '../../svg/newWindow.svg';
import { popupCover } from '../../util/FlaySearch';
import FlayStorage from '../../util/FlayStorage';
import { getDominatedColors } from '../../util/dominatedColor';
import { getRandomInt } from '../../util/randomNumber';
import './FlayCover.scss';
import FlayHTMLElement from './FlayHTMLElement';

/**
 * Custom element of Cover
 */
export default class FlayCover extends FlayHTMLElement {
  flay;

  constructor() {
    super();

    this.init();
  }

  init() {
    this.wrapper.addEventListener('click', () => this.wrapper.classList.toggle('contain'));

    this.coverImage = this.wrapper.appendChild(document.createElement('img'));
    this.coverImage.classList.add('cover-image');
    this.coverImage.loading = 'lazy';

    this.colorWrapper = this.wrapper.appendChild(document.createElement('div'));
    this.colorWrapper.classList.add('color-wrapper');
    for (let i = 0; i < 5; i++) {
      this.colorWrapper.appendChild(document.createElement('label'));
    }

    this.popupCoverWrap = this.wrapper.appendChild(document.createElement('div'));
    this.popupCoverWrap.classList.add('popup-cover-wrapper');
    this.popupCoverWrap.innerHTML = `${newWindowSVG}`;
    this.popupCoverWrap.querySelector('svg').addEventListener('click', (e) => {
      e.stopPropagation();
      popupCover(this.flay.opus);
    });
  }

  /**
   *
   * @param {Flay} flay
   */
  set(flay) {
    this.flay = flay;
    this.wrapper.setAttribute('data-opus', flay.opus);
    this.wrapper.classList.toggle('archive', this.flay.archive);

    this.wrapper.classList.remove('visible');
    URL.revokeObjectURL(this.coverImage.src);

    const COVER_URL = `/static/cover/${flay.opus}`;

    fetch(COVER_URL)
      .then((res) => res.blob())
      .then((blob) => {
        this.wrapper.classList.add('visible');
        this.coverImage.src = URL.createObjectURL(blob);
      });

    this.coverImage.onload = () => {
      // this.coverImage.style.maxHeight = `calc(${this.coverImage.width}px * 269 / 400)`;
      if (this.inCard) {
        return;
      }
      // 대표색상 추출
      let savedDominatedColors = FlayStorage.session.getObject('dominatedColor_' + flay.opus, null);
      if (savedDominatedColors == null) {
        getDominatedColors(this.coverImage, { scale: 0.2, offset: 16, limit: 5 }).then((dominatedColors) => {
          FlayStorage.session.set('dominatedColor_' + flay.opus, JSON.stringify(dominatedColors));
          this.#applyDominatedColor(dominatedColors);
        });
      } else {
        this.#applyDominatedColor(savedDominatedColors);
      }
    };
    // this.coverImage.src = COVER_URL;
  }

  #applyDominatedColor(dominatedColors) {
    const [r, g, b] = dominatedColors[getRandomInt(0, 5)].rgba;
    this.wrapper.style.backgroundColor = `rgba(${r},${g},${b},0.5)`;
    this.wrapper.querySelectorAll('.color-wrapper > label').forEach((label, index) => {
      label.style.backgroundColor = `rgba(${dominatedColors[index].rgba.join(',')})`;
    });
  }
}

// Define the new element
customElements.define('flay-cover', FlayCover);
