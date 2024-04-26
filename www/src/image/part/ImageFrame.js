import { getDominatedColors } from '../../util/dominatedColor';
import './ImageFrame.scss';

export default class ImageFrame extends HTMLElement {
  img;
  info;

  constructor() {
    super();
  }

  connectedCallback() {
    this.attachShadow({ mode: 'open' });

    const link = this.shadowRoot.appendChild(document.createElement('link'));
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = 'style.css';

    const wrapper = this.shadowRoot.appendChild(document.createElement('div'));
    wrapper.classList.add(this.tagName.toLowerCase());
    wrapper.innerHTML = `
      <img>
      <div class="info">
        <label id="imgIdx"></label>
        <label id="imgName"></label>
      </div>
    `;

    this.img = this.shadowRoot.querySelector('img');
  }

  async set(imageIdx) {
    const res = await fetch('/static/image/' + imageIdx);
    const idx = res.headers.get('Idx');
    const name = decodeURIComponent(res.headers.get('Name').replace(/\+/g, ' '));
    const path = decodeURIComponent(res.headers.get('Path').replace(/\+/g, ' '));
    const modified = new Date(Number(res.headers.get('Modified')));

    this.img.src = URL.createObjectURL(await res.blob());
    await this.img.decode();

    const colors = await getDominatedColors(this.img, { scale: 0.2, offset: 16, limit: 5 });
    this.img.style.boxShadow = `0.25rem 0.5rem 2rem 0 rgba(${colors[0].rgba.join(',')})`;
    this.shadowRoot.querySelector('#imgIdx').innerHTML = '#' + idx;
    this.shadowRoot.querySelector('#imgName').innerHTML = name;

    this.info = { idx: idx, name: name, path: path, modified: modified, width: this.img.naturalWidth, height: this.img.naturalHeight, colors: colors };
    console.debug(imageIdx, 'info', this.info);
  }
}

customElements.define('image-frame', ImageFrame);
