import FlayDiv from '@flay/FlayDiv';
import { BlankFlay, Flay } from '@lib/FlayFetch';

export default class FlayHTMLElement extends FlayDiv {
  flay: Flay = BlankFlay;
  inCard: boolean = false;

  static get observedAttributes(): string[] {
    return ['mode'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
    console.debug('attributeChangedCallback', name, oldValue, newValue);
    if (newValue === 'card') {
      this.setCard();
    }
  }

  setFlay(flay: Flay): void {
    this.flay = flay;
    this.dataset['opus'] = flay.opus;
    this.classList.toggle('archive', flay.archive);
  }

  setCard(): this {
    this.classList.add('card');
    this.inCard = true;
    return this;
  }

  /**
   * 크기 조정. toggle 'small' class
   * @param parentDOMRect 부모 요소의 DOMRect
   */
  resize(parentDOMRect: DOMRect): void {
    this.classList.toggle('small', parentDOMRect.width <= 400);
  }
}

/**
 * Define the new element
 * @param name 커스텀 엘리먼트 이름
 * @param constructor 커스텀 엘리먼트 생성자
 */
export const defineCustomElements = (name: string, constructor: new () => HTMLElement): void => {
  customElements.define(name, constructor);
};
