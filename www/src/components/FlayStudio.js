/**
 *
 */
export default class FlayStudio extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다

    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('studio');

    this.label = this.wrapper.appendChild(document.createElement('label'));

    const style = document.createElement('link');
    style.setAttribute('rel', 'stylesheet');
    style.setAttribute('href', './css/components.css');

    this.shadowRoot.append(style, this.wrapper); // 생성된 요소들을 shadow DOM에 부착합니다
  }

  /**
   *
   * @param {String} name
   * @param {String} opus
   */
  set(name, opus) {
    this.wrapper.setAttribute('data-opus', opus);

    this.label.setAttribute('title', name);
    this.label.textContent = name;
  }
}

// Define the new element
customElements.define('flay-studio', FlayStudio);
