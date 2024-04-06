import './FlayStudio.scss';

/**
 * Custom element of Studio
 */
export default class FlayStudio extends HTMLElement {
  flay;

  constructor() {
    super();

    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다

    const link = this.shadowRoot.appendChild(document.createElement('link'));
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = 'style.css';

    this.wrapper = this.shadowRoot.appendChild(document.createElement('div'));
    this.wrapper.classList.add(this.tagName.toLowerCase());

    const label = this.wrapper.appendChild(document.createElement('label'));
    this.studio = label.appendChild(document.createElement('a'));
    this.studio.innerHTML = 'Studio';
    this.studio.addEventListener('click', () => {
      console.log('studioClick', this.flay.studio);
      // window.open('/info/studio/' + this.flay.studio, this.flay.studio, 'width=640px,height=800px');
      window.open('popup.studio.html?name=' + this.flay.studio, this.flay.studio, 'width=960px,height=1200px');
    });
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

    this.studio.textContent = flay.studio;
  }
}

// Define the new element
customElements.define('flay-studio', FlayStudio);
