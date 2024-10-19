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
    this.classList.add('flay-div');
  }

  setCard() {
    this.classList.add('card');
    this.inCard = true;
    return this;
  }

  /**
   * 크기 조정. toggle 'small' class
   * @param {DOMRect} parentDOMRect
   */
  resize(parentDOMRect) {
    this.classList.toggle('small', parentDOMRect.width <= 400);
  }
}

/**
 * Define the new element
 * @param {string} name
 * @param {CustomElementConstructor} constructor
 */
export const defineCustomElements = (name, constructor) => {
  customElements.define(name, constructor, { extends: 'div' });
};
