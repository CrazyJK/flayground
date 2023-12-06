import './FlayElement.scss';

export default class FlayElement extends HTMLElement {
  init() {
    console.log('FlayElement init');
    this.attachShadow({ mode: 'open' });

    const link = document.createElement('link');
    link.type = 'text/css';
    link.rel = 'stylesheet';
    link.href = 'test-extendsElement.css';

    const wrapper = document.createElement('div');
    wrapper.classList.add('flay-element', this.tagName.toLowerCase());

    this.shadowRoot.append(link, wrapper);
  }

  anyFunction(param) {
    console.log('FlayElement anyFunction', param, this.hox);
  }
}
