const URI_PREFIX = '/static/image/';

export default class FlayImage extends HTMLImageElement {
  constructor() {
    super();
  }

  static get observedAttributes() {
    return ['data-idx'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    console.debug('attributeChangedCallback', name, oldValue, newValue);
    this.src = URI_PREFIX + newValue;
    this.setTitle();
  }

  connectedCallback() {
    console.debug('connectedCallback src', this.src);
    this.setTitle();
  }

  adoptedCallback() {
    console.debug('Custom element moved to new page.');
  }

  #getIdx() {
    if (this.src) {
      return Number(this.src.split('/').pop());
    }
    return -1;
  }

  async setTitle() {
    let idx = this.#getIdx();
    if (idx > -1) {
      await this.decode();
      fetch('/image/' + idx)
        .then((res) => res.json())
        .then((info) => {
          console.debug('setTitle', this, info);
          this.title = `※ Idx: ${info.idx}\n※ Path: ${info.path}\n※ Name: ${info.name}\n※ Size: ${this.naturalWidth} x ${this.naturalHeight}`;
        });
    }
  }
}

customElements.define('flay-image', FlayImage, { extends: 'img' });
