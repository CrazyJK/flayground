import { componentCss } from '../../util/componentCssLoader';
import { getDominatedColors } from '../../util/dominatedColor';

const HTML = `
<img>
<div class="info">
  <label id="imgIdx"></label>
  <label id="imgName"></label>
</div>
`;

const CSS = `
${componentCss}
.image-frame {
  transition: 0.4s;
}
.image-frame.rotate {
  transform: rotate(90deg);
}
.image-frame img {
  width: 100%;
  height: auto;
  transition: 0.4s;
}
.image-frame div.info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: transparent linear-gradient(0deg, var(--color-bg), transparent);
  padding: 0.25rem 1rem;
  opacity: 0;
  transition: 0.4s;

  display: flex;
  justify-content: space-between;
  gap: 0 1rem;
}
.image-frame:hover div.info {
  opacity: 1;
}
.image-frame div.info label {
  background-color: transparent;
  text-shadow: var(--text-shadow);
  font-size: var(--size-normal);

  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.image-frame div.info label#imgIdx {
  flex: 0 0 auto;
}
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

    const style = document.createElement('style');
    style.innerHTML = CSS;

    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('image-frame');
    this.wrapper.innerHTML = HTML;
    this.shadowRoot.append(style, this.wrapper);

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
