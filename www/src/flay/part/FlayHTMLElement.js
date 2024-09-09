export default class FlayHTMLElement extends HTMLDivElement {
  inCard = false;

  static get observedAttributes() {
    return ['mode'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    console.debug('attributeChangedCallback', name, oldValue, newValue);
    if (newValue === 'card') {
      this.setCard();
    }
  }

  constructor() {
    super();

    this.wrapper = this.appendChild(document.createElement('article'));
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
    this.wrapper.classList.toggle('small', parentDOMRect.width <= 400);
  }
}
