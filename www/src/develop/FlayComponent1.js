import './FlayComponent1.scss';
import FlayElement from './FlayElement';

export default class FlayComponent1 extends FlayElement {
  constructor() {
    super();
    console.log('FlayComponent1 constructor');
  }

  connectedCallback() {
    super.init();
    console.log('FlayComponent1 connectedCallback');
  }

  set(hox) {
    this.hox = hox;

    super.anyFunction(hox);

    this.shadowRoot.querySelector('div').innerHTML = hox;
  }
}

customElements.define('flay-component1', FlayComponent1);
