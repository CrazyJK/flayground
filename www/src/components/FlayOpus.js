/**
 *
 */
export default class FlayOpus extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다

    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('opus');

    this.opusLabelElement = this.wrapper.appendChild(document.createElement('label'));

    const style = document.createElement('link');
    style.setAttribute('rel', 'stylesheet');
    style.setAttribute('href', './css/components.css');

    this.shadowRoot.append(style, this.wrapper); // 생성된 요소들을 shadow DOM에 부착합니다
  }

  /**
   *
   * @param {Flay} flay
   */
  set(flay) {
    this.wrapper.setAttribute('data-opus', flay.opus);

    this.opusLabelElement.setAttribute('title', flay.opus);
    this.opusLabelElement.textContent = flay.opus;
  }
}

// Define the new element
customElements.define('flay-opus', FlayOpus);
