/**
 *
 */
export default class FlayStudio extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다
    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('studio');
    const link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', './css/components.css');
    this.shadowRoot.append(link, this.wrapper); // 생성된 요소들을 shadow DOM에 부착합니다

    this.flay = null;
    this.studio = this.wrapper.appendChild(document.createElement('a'));
    this.studio.addEventListener('click', () => {
      console.log('studioClick', this.flay.studio);
      // window.open('/info/studio/' + this.flay.studio, this.flay.studio, 'width=640px,height=800px');
      window.open('card.studio.html?name=' + this.flay.studio, this.flay.studio, 'width=640px,height=800px');
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

    this.studio.textContent = flay.studio;
  }
}

// Define the new element
customElements.define('flay-studio', FlayStudio);
