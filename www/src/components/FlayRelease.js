/**
 *
 */
export default class FlayRelease extends HTMLElement {
  /**
   *
   * @param {String} release
   * @param {String} opus
   */
  constructor(release, opus) {
    super();

    // shadow root을 생성합니다
    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다

    const wrapper = document.createElement('div');
    wrapper.setAttribute('data-opus', opus);

    const label = wrapper.appendChild(document.createElement('label'));
    label.setAttribute('title', release);
    label.textContent = release;

    const style = document.createElement('link');
    style.setAttribute('rel', 'stylesheet');
    style.setAttribute('href', './css/components.css');

    // 생성된 요소들을 shadow DOM에 부착합니다
    this.shadowRoot.append(style, wrapper);
  }
}

// Define the new element
customElements.define('flay-release', FlayRelease);
