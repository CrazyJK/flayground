import { componentCss } from '../../util/componentCssLoader';

/**
 * Custom element of Title
 */
export default class FlayTitle extends HTMLElement {
  flay;

  constructor() {
    super();

    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다

    const STYLE = document.createElement('style');
    STYLE.innerHTML = CSS;

    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('title');

    const label = this.wrapper.appendChild(document.createElement('label'));
    this.anker = label.appendChild(document.createElement('a'));
    this.anker.innerHTML = 'Title';
    if (location.pathname.indexOf('popup.flay.html') < 0) {
      this.anker.addEventListener('click', () => {
        window.open('popup.flay.html?opus=' + this.flay.opus, 'popup.' + this.flay.opus, 'width=800px,height=1280px');
      });
    }

    this.shadowRoot.append(STYLE, this.wrapper); // 생성된 요소들을 shadow DOM에 부착합니다
  }

  resize(domRect) {
    this.domRect = domRect;
    this.isCard = this.classList.contains('card');
    this.wrapper.classList.toggle('card', this.isCard);
    this.wrapper.classList.toggle('small', domRect.width < 400);
  }

  /**
   *
   * @param {Flay} flay
   */
  set(flay) {
    this.flay = flay;
    this.wrapper.classList.toggle('archive', this.flay.archive);
    this.wrapper.setAttribute('data-opus', flay.opus);

    this.anker.setAttribute('title', flay.title);
    this.anker.textContent = flay.title;
  }
}

// Define the new element
customElements.define('flay-title', FlayTitle);

const CSS = `
${componentCss}
div.title {
  text-align: center;
}
div.title label {
  position: relative;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}
div.title label a {
  display: inline;
  font-size: var(--size-largest);
}
div.title.card label a {
  font-size: var(--size-large);
}
div.title.small label a {
  font-size: var(--size-normal);
}
div.title.archive label a {
  color: var(--color-gray-dark);
}
`;
