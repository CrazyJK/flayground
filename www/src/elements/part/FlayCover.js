import { getDominatedColors } from '../../util/dominatedColor';
import FlayStorage from '../../util/flay.storage';

/**
 *
 */
export default class FlayCover extends HTMLElement {
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
    this.shadowRoot.append(LINK, STYLE, this.wrapper); // 생성된 요소들을 shadow DOM에 부착합니다

    this.flay = null;
    this.wrapper.addEventListener('click', (e) => {
      e.target.classList.toggle('full');
    });

    this.colorWrapper = this.wrapper.appendChild(document.createElement('div'));
    this.colorWrapper.classList.add('color-wrapper');
    for (let i = 0; i < 5; i++) {
      this.colorWrapper.appendChild(document.createElement('label'));
    }
  }

  /**
   *
   * @param {Flay} flay
   */
  set(flay) {
    this.flay = flay;
    this.wrapper.setAttribute('data-opus', flay.opus);
    this.wrapper.classList.toggle('archive', this.flay.archive);
    if (this.parentElement) {
      this.wrapper.classList.toggle('small', this.parentElement.classList.contains('small'));
    }
    let url = `/static/cover/${flay.opus}`;
    this.wrapper.style.backgroundImage = `url(${url})`;

    // 대표색상 추출
    let savedDominatedColors = FlayStorage.session.getObject('dominatedColor_' + flay.opus, null);
    if (savedDominatedColors == null) {
      getDominatedColors(url, { scale: 0.2, offset: 16, limit: 5 }).then((dominatedColors) => {
        FlayStorage.session.set('dominatedColor_' + flay.opus, JSON.stringify(dominatedColors));
        this.applyDominatedColor(dominatedColors);
      });
    } else {
      this.applyDominatedColor(savedDominatedColors);
    }
    // TODO 영상 스트리링
  }

  applyDominatedColor(dominatedColors) {
    this.wrapper.style.boxShadow = `inset 0 0 1rem 0.5rem rgba(${dominatedColors[1].rgba.join(',')})`;
    this.wrapper.style.backgroundColor = `rgba(${dominatedColors[0].rgba[0]},${dominatedColors[0].rgba[1]},${dominatedColors[0].rgba[2]},0.5)`;
    this.wrapper.querySelectorAll('.color-wrapper > label').forEach((label, index) => {
      label.style.backgroundColor = `rgba(${dominatedColors[index].rgba.join(',')})`;
    });
  }
}

// Define the new element
customElements.define('flay-cover', FlayCover);

const CSS = `
/* for FlayCover */
div.cover {
  aspect-ratio: 400 / 269;
  background: transparent no-repeat center / contain;
  background-color: var(--color-bg-cover);
  box-shadow: var(--box-shadow-cover);
  border-radius: 0.125rem;
}
div.cover.full {
  background-size: cover;
}
div.cover.small {
  box-shadow: none;
}
div.cover .color-wrapper {
  position: absolute;
  bottom: 0;
  right: 0;
  padding: 0.25rem;
  display: flex;
  background-color: transparent;
}
div.cover .color-wrapper label {
  width: 1.5rem;
  height: 0.5rem;
  border-radius: 0.25rem;
  box-shadow: 1px 1px 3px 0px #0008;
  margin: 0.25rem;
}
`;
