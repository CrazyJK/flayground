import FlayDiv from '@base/FlayDiv';
import { BlankFlay, Flay } from '@lib/FlayFetch';

export default class FlayPartElement extends FlayDiv {
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
