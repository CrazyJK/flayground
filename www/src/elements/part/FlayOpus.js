/**
 *
 */
export default class FlayOpus extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다
    const LINK = document.createElement('link');
    LINK.setAttribute('rel', 'stylesheet');
    LINK.setAttribute('href', './css/4.components.css');
    const STYLE = document.createElement('style');
    STYLE.innerHTML = CSS;
    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('opus');
    this.shadowRoot.append(LINK, STYLE, this.wrapper); // 생성된 요소들을 shadow DOM에 부착합니다

    this.flay = null;
    const label = this.wrapper.appendChild(document.createElement('label'));
    this.opus = label.appendChild(document.createElement('a'));
    this.opus.addEventListener('click', () => {
      console.log('opusClick', this.flay.opus);
      window.open('/flay/' + this.flay.opus, this.flay.opus, 'width=800px,height=1200px');
    });
  }

  /**
   *
   * @param {Flay} flay
   */
  set(flay) {
    this.flay = flay;
    this.wrapper.setAttribute('data-opus', flay.opus);
    this.wrapper.classList.toggle('archive', this.flay.archive);
    this.wrapper.classList.toggle('small', this.parentElement.classList.contains('small'));

    this.opus.textContent = flay.opus;
  }
}

// Define the new element
customElements.define('flay-opus', FlayOpus);

const CSS = `
/* for FlayOpus */
div.opus {
  text-align: center;
}
`;
