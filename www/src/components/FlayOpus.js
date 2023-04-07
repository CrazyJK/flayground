/**
 *
 */
export default class FlayOpus extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다

    this.flay = null;
    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('opus');

    this.opusLabelElement = this.wrapper.appendChild(document.createElement('label'));
    this.opusLabelElement.addEventListener('click', () => {
      console.log('opusClick', this.flay.opus);
      window.open('/info/video/' + this.flay.opus, this.flay.opus, 'width=640px,height=800px');
    });

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
    this.flay = flay;
    this.wrapper.classList.toggle('archive', this.flay.archive);
    this.wrapper.setAttribute('data-opus', flay.opus);
    this.wrapper.classList.toggle('small', this.parentElement.classList.contains('small'));

    this.opusLabelElement.setAttribute('title', flay.opus);
    this.opusLabelElement.textContent = flay.opus;
  }
}

// Define the new element
customElements.define('flay-opus', FlayOpus);
