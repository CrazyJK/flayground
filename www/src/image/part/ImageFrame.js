import { getDominatedColors } from '../../util/dominatedColor';
import './ImageFrame.scss';

const HTML = `
<img>
<div class="info">
  <label id="imgIdx"></label>
  <label id="imgName"></label>
</div>
`;

export default class ImageFrame extends HTMLElement {
  idx;
  info;
  colors;
  wrapper;
  img;
  imgIdx;
  imgName;

  static get observedAttributes() {
    return ['class'];
  }

  constructor() {
    super();
  }

  connectedCallback() {
    this.attachShadow({ mode: 'open' });

    const link = this.shadowRoot.appendChild(document.createElement('link'));
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = 'style.css';

    this.wrapper = this.shadowRoot.appendChild(document.createElement('div'));
    this.wrapper.classList.add(this.tagName.toLowerCase());
    this.wrapper.innerHTML = HTML;

    this.img = this.shadowRoot.querySelector('img');
    this.imgIdx = this.shadowRoot.querySelector('#imgIdx');
    this.imgName = this.shadowRoot.querySelector('#imgName');
  }

  attributeChangedCallback(name, oldValue, newValue) {
    console.debug(this.idx, 'attributes changed', name, oldValue, newValue);
    if (name === 'class') {
      if (oldValue) {
        this.wrapper.classList.remove(oldValue);
      }
      if (newValue) {
        this.wrapper.classList.add(newValue);
      }
    }
  }

  async set(imageIdx) {
    this.idx = imageIdx;

    const res = await fetch('/static/image/' + imageIdx);
    let idx = res.headers.get('Idx');
    let name = decodeURIComponent(res.headers.get('Name').replace(/\+/g, ' '));
    let path = decodeURIComponent(res.headers.get('Path').replace(/\+/g, ' '));
    let modified = new Date(Number(res.headers.get('Modified')));

    const myBlob = await res.blob();
    this.img.src = URL.createObjectURL(myBlob);

    await this.img.decode();
    this.info = { idx: idx, name: name, path: path, modified: modified, width: this.img.naturalWidth, height: this.img.naturalHeight };
    this.imgIdx.innerHTML = '#' + idx;
    this.imgName.innerHTML = name;
    console.debug(imageIdx, 'imageInfo', this.info);

    this.colors = await getDominatedColors(this.img, { scale: 0.2, offset: 16, limit: 5 });
    this.img.style.boxShadow = `0.25rem 0.5rem 2rem 0 rgba(${this.colors[0].rgba.join(',')})`;
    console.debug(imageIdx, 'dominatedColors', this.colors);

    return this;
  }
}

customElements.define('image-frame', ImageFrame);
