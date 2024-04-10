export default class FlayHTMLElement extends HTMLElement {
  inCard = false;

  constructor() {
    super();

    this.attachShadow({ mode: 'open' });

    const link = this.shadowRoot.appendChild(document.createElement('link'));
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = 'style.css';

    this.wrapper = this.shadowRoot.appendChild(document.createElement('article'));
    this.wrapper.classList.add(this.tagName.toLowerCase());
  }

  setCard() {
    this.wrapper.classList.add('card');
    this.inCard = true;
    return this;
  }

  /**
   * 크기 조정. toggle 'small' class
   * @param {DOMRect} parentDOMRect
   */
  resize(parentDOMRect) {
    this.wrapper.classList.toggle('small', parentDOMRect.width < 400);
  }
}
