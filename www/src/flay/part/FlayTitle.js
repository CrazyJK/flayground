import './FlayTitle.scss';

/**
 * Custom element of Title
 */
export default class FlayTitle extends HTMLElement {
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
    this.anker = label.appendChild(document.createElement('a'));
    this.anker.innerHTML = 'Title';
    if (location.pathname.indexOf('popup.flay.html') < 0) {
      this.anker.addEventListener('click', () => {
        window.open('popup.flay.html?opus=' + this.flay.opus, 'popup.' + this.flay.opus, 'width=800px,height=1280px');
      });
    }
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
    this.wrapper.classList.toggle('archive', this.flay.archive);
    this.wrapper.setAttribute('data-opus', flay.opus);

    this.anker.setAttribute('title', flay.title);
    this.anker.textContent = flay.title;
  }
}

// Define the new element
customElements.define('flay-title', FlayTitle);
