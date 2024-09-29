export default class Template extends HTMLDivElement {
  constructor() {
    super();

    this.classList.add('flay-template');
  }
}

customElements.define('flay-template', Template, { extends: 'div' });
