import DateUtils from '../../lib/DateUtils';
import FileUtils from '../../lib/FileUtils';

export default class FlayImage extends HTMLImageElement {
  constructor() {
    super();
  }

  static get observedAttributes() {
    return ['data-idx', 'src'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    console.debug('attributeChangedCallback', name, oldValue, newValue);
    switch (name) {
      case 'data-idx':
        this.src = '/static/image/' + newValue;
        break;
      case 'src':
        this.#loadInfo();
        break;
    }
  }

  connectedCallback() {
    console.debug('connectedCallback');
  }

  adoptedCallback() {
    console.debug('adoptedCallback: Custom element moved to new page.');
  }

  #loadInfo() {
    const idx = Number(this.src?.split('/').pop()) || -1;
    if (idx < 0) {
      this.removeAttribute('title');
      return;
    }

    this.decode().then(() =>
      fetch('/image/' + idx)
        .then((res) => res.json())
        .then((info) => {
          info['width'] = this.naturalWidth;
          info['height'] = this.naturalHeight;
          console.debug('image info', info);

          this.dataset.name = info.name;
          this.dataset.path = info.path;
          this.dataset.file = info.file;
          this.dataset.fileSize = FileUtils.prettySize(info.length).join('');
          this.dataset.modified = DateUtils.format(info.modified, 'yyyy-MM-dd');
          this.dataset.width = info.width;
          this.dataset.height = info.height;
          this.alt = `※ Idx: ${info.idx}\n※ Path: ${info.path}\n※ Name: ${info.name}\n※ Size: ${info.width} x ${info.height}`;

          this.dispatchEvent(new CustomEvent('loaded', { detail: { info: info } }));
        })
    );
  }
}

customElements.define('flay-image', FlayImage, { extends: 'img' });
