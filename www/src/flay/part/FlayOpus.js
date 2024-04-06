import './FlayOpus.scss';

/**
 * Custom element of Opus
 */
export default class FlayOpus extends HTMLElement {
  flay;

  constructor() {
    super();

    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다

    const link = this.shadowRoot.appendChild(document.createElement('link'));
    link.rel = 'stylesheet';
    link.tyoe = 'text/css';
    link.href = 'style.css';

    this.wrapper = this.shadowRoot.appendChild(document.createElement('div'));
    this.wrapper.classList.add(this.tagName.toLowerCase());

    const label = this.wrapper.appendChild(document.createElement('label'));
    this.opus = label.appendChild(document.createElement('a'));
    this.opus.innerHTML = 'Opus';
    this.opus.addEventListener('click', () => {
      console.log('opusClick', this.flay.opus);
      window.open('/flay/' + this.flay.opus, this.flay.opus, 'width=800px,height=1200px');
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

    this.opus.textContent = flay.opus;
  }
}

// Define the new element
customElements.define('flay-opus', FlayOpus);
