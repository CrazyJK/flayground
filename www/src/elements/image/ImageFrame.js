import { getDominatedColors } from '../../util/dominatedColor';

export default class ImageFrame extends HTMLElement {
  info;
  colors;

  static get observedAttributes() {
    return ['class'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    const LINK = document.createElement('link');
    LINK.setAttribute('rel', 'stylesheet');
    LINK.setAttribute('href', './css/4.components.css');
    const STYLE = document.createElement('style');
    STYLE.innerHTML = CSS;
    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('image-frame');
    this.wrapper.innerHTML = HTML;
    this.shadowRoot.append(LINK, STYLE, this.wrapper);

    this.img = this.shadowRoot.querySelector('img');
    this.imgIdx = this.shadowRoot.querySelector('#imgIdx');
    this.imgName = this.shadowRoot.querySelector('#imgName');
  }

  connectedCallback() {}

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
    this.img.src = '/static/image/' + imageIdx;
    await this.img.decode();
    console.debug(imageIdx, 'img onload', this.img.naturalWidth, this.img.naturalHeight);

    this.info = await fetch('/image/' + imageIdx).then((res) => res.json());
    this.imgIdx.innerHTML = '#' + this.info.idx;
    this.imgName.innerHTML = this.info.name;
    console.debug(imageIdx, 'imageInfo', this.info);

    this.colors = await getDominatedColors(this.img, { scale: 0.2, offset: 16, limit: 5 });
    this.img.style.boxShadow = `0.25rem 0.5rem 2rem 0 rgba(${this.colors[0].rgba.join(',')})`;
    console.debug(imageIdx, 'dominatedColors', this.colors);

    return this;
  }
}

customElements.define('image-frame', ImageFrame);

const HTML = `
<img>
<div class="info">
  <label id="imgIdx"></label>
  <label id="imgName"></label>
</div>
`;

const CSS = `
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
  font-size: var(--font-normal);

  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.image-frame div.info label#imgIdx {
  flex: 0 0 auto;
}
`;
