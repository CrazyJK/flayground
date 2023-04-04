/**
 *
 */
export default class FlayTitle extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다

    this.flay = null;
    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('title');

    this.label = this.wrapper.appendChild(document.createElement('label'));
    this.anker = this.label.appendChild(document.createElement('a'));
    this.anker.addEventListener('click', () => {
      console.log('titleClick', this.flay.opus);
      // window.open('/flay/' + this.flay.opus, this.flay.opus, 'width=640px,height=800px');
      window.open('/dist/flay.one.html?opus=' + this.flay.opus, this.flay.opus, 'width=800px,height=1200px');
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

    this.anker.setAttribute('title', flay.title);
    this.anker.textContent = flay.title;
  }
}

// Define the new element
customElements.define('flay-title', FlayTitle);
