/**
 *
 */
export default class FlayCover extends HTMLElement {
  /**
   *
   * @param {String} opus
   */
  constructor(opus) {
    super();

    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다

    const wrapper = document.createElement('div');
    wrapper.setAttribute('data-opus', opus);

    const img = wrapper.appendChild(document.createElement('img'));
    img.setAttribute('src', '/static/cover/' + opus);

    const style = document.createElement('link');
    style.setAttribute('rel', 'stylesheet');
    style.setAttribute('href', './css/components.css');

    this.shadowRoot.append(style, wrapper); // 생성된 요소들을 shadow DOM에 부착합니다
  }
}

// Define the new element
customElements.define('flay-cover', FlayCover);
