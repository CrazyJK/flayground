import './FlayComponent2.scss';
import FlayElement from './FlayElement';

export default class FlayComponent2 extends FlayElement {
  constructor() {
    super();
    console.log('FlayComponent2 constructor');
  }

  connectedCallback() {
    super.init();
    console.log('FlayComponent2 connectedCallback');
  }

  set(hox) {
    this.hox = hox;

    super.anyFunction(hox);

    this.shadowRoot.querySelector('div').innerHTML = hox;
  }
}

customElements.define('flay-component2', FlayComponent2);
