import { componentCss } from '../../util/componentCssLoader';

/**
 * Custom element of Opus
 */
export default class FlayOpus extends HTMLElement {
  flay;

  constructor() {
    super();

    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다

    const STYLE = document.createElement('style');
    STYLE.innerHTML = CSS;

    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('opus');

    const label = this.wrapper.appendChild(document.createElement('label'));
    this.opus = label.appendChild(document.createElement('a'));
    this.opus.innerHTML = 'Opus';
    this.opus.addEventListener('click', () => {
      console.log('opusClick', this.flay.opus);
      window.open('/flay/' + this.flay.opus, this.flay.opus, 'width=800px,height=1200px');
    });

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
    this.wrapper.setAttribute('data-opus', flay.opus);
    this.wrapper.classList.toggle('archive', this.flay.archive);

    this.opus.textContent = flay.opus;
  }
}

// Define the new element
customElements.define('flay-opus', FlayOpus);

const CSS = `
${componentCss}
div.opus {
  text-align: center;
}
`;
