export default class FlayStatistics extends HTMLDivElement {
  constructor() {
    super();

    this.classList.add('flay-statistics');
  }
}

customElements.define('flay-statistics', FlayStatistics, { extends: 'div' });
