/**
 *
 */
export default class FlayStudio extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다

    this.flay = null;
    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('studio');

    this.label = this.wrapper.appendChild(document.createElement('label'));
    this.label.addEventListener('click', () => {
      console.log('studioClick', this.flay.studio);
      window.open('/info/studio/' + this.flay.studio, this.flay.studio, 'width=640px,height=800px');
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

    this.label.setAttribute('title', flay.studio);
    this.label.textContent = flay.studio;
  }
}

// Define the new element
customElements.define('flay-studio', FlayStudio);
