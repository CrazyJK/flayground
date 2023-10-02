import { getDominatedColors } from '../../util/dominatedColor';
import FlayStorage from '../../util/flay.storage';
import { getRandomInt } from '../../util/random';

/**
 * Custom element of Cover
 */
export default class FlayCover extends HTMLElement {
  flay;

  constructor() {
    super();

    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다

    const LINK = document.createElement('link');
    LINK.setAttribute('rel', 'stylesheet');
    LINK.setAttribute('href', './css/4.components.css');

    const STYLE = document.createElement('style');
    STYLE.innerHTML = CSS;

    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('cover');
    this.wrapper.addEventListener('click', () => {
      this.wrapper.classList.toggle('contain');
    });

    this.coverImage = this.wrapper.appendChild(document.createElement('img'));
    this.coverImage.classList.add('cover-image');

    this.colorWrapper = this.wrapper.appendChild(document.createElement('div'));
    this.colorWrapper.classList.add('color-wrapper');
    for (let i = 0; i < 5; i++) {
      this.colorWrapper.appendChild(document.createElement('label'));
    }

    this.shadowRoot.append(LINK, STYLE, this.wrapper); // 생성된 요소들을 shadow DOM에 부착합니다
  }

  resize() {
    this.wrapper.classList.toggle('small', this.classList.contains('small') || this.parentElement?.classList.contains('small'));
  }

  /**
   *
   * @param {Flay} flay
   */
  set(flay) {
    this.resize();
    this.flay = flay;
    this.wrapper.setAttribute('data-opus', flay.opus);
    this.wrapper.classList.toggle('archive', this.flay.archive);

    const COVER_URL = `/static/cover/${flay.opus}`;

    this.coverImage.onload = () => {
      // this.coverImage.style.maxHeight = `calc(${this.coverImage.width}px * 269 / 400)`;
      if (!this.#isSmall()) {
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
      }
    };
    this.coverImage.src = COVER_URL;
  }

  #isSmall() {
    return this.wrapper.classList.contains('small');
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

const CSS = `
div.cover {
  aspect-ratio: var(--cover-aspect-ratio);
  background: transparent no-repeat center / cover;
  border-radius: var(--border-radius);
  box-shadow: inset 0 0 0.25rem 0.125rem var(--color-bg-cover);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0.5rem;
  width: 100%;
  overflow: hidden;
  transition: 0.2s;
}
div.cover.small {
  align-items: flex-start;
  box-shadow: none;
  padding: 0;
}
div.cover .cover-image {
  border: 0;
  border-radius: 0.25rem;
  margin: 0;
  padding: 0;
  width: 100%;
  height: auto;
}
div.cover.contain .cover-image {
  width: auto;
  height: 104%;
}
div.cover .color-wrapper {
  position: absolute;
  bottom: 0;
  right: 0;
  padding: 0.75rem;
  display: flex;
  gap: 0.5rem;
  background-color: transparent;
}
div.cover.small .color-wrapper {
  display: none;
}
div.cover .color-wrapper label {
  width: 1.5rem;
  height: 0.5rem;
  border: 0;
  border-radius: 0.25rem;
  box-shadow: 1px 1px 3px 0px #0008;
  margin: 0;
  padding: 0;
}
`;
