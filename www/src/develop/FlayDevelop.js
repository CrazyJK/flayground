import { componentCss } from '../util/componentCssLoader';

export default class FlayDevelop extends HTMLElement {
  opus;

  constructor(opus) {
    super();
    this.attachShadow({ mode: 'open' });

    this.opus = opus;

    const style = document.createElement('style');
    style.innerHTML = `
      ${componentCss}
      .develop {
        aspect-ratio: var(--cover-aspect-ratio);
        background-size: cover;
        background-repeat: no-repeat;
        width: 100%;
        display: inline-flex;
        flex-direction: column;
        align-items: flex-start;
      }
      .develop label {
        background-color: #000a;
        border-radius: 0.25rem;
        margin: 0.125rem;
        padding: 0.25rem 0.5rem;
        text-shadow: var(--text-shadow);
        font-size: var(--size-normal);
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
        max-width: calc(100% - 0.25rem);
      }
    `;

    const wrapper = document.createElement('article');
    wrapper.classList.add('develop');
    wrapper.dataset.opus = opus;
    wrapper.innerHTML = `
      <label class="title"></label>
      <label class="studio"></label>
      <label class="opus"></label>
      <label class="actress"></label>
      <label class="release"></label>
      <label class="rank"></label>
    `;

    this.shadowRoot.append(style, wrapper);
  }

  connectedCallback() {
    console.debug('connectedCallback', this.opus);
  }

  async ready() {
    const develop = this.shadowRoot.querySelector('.develop');

    const res = await fetch('/static/cover/' + this.opus + '/withData');
    const data = res.headers.get('data');
    const dataDecoded = decodeURIComponent(data.replace(/\+/g, ' '));
    const flay = JSON.parse(dataDecoded);
    console.log('flay', flay);

    develop.querySelector('.title').innerHTML = flay.title;
    develop.querySelector('.studio').innerHTML = flay.studio;
    develop.querySelector('.opus').innerHTML = flay.opus;
    develop.querySelector('.actress').innerHTML = flay.actressList.join(', ');
    develop.querySelector('.release').innerHTML = flay.release;
    develop.querySelector('.rank').innerHTML = 'Rank ' + flay.video.rank;

    const coverBlob = await res.blob();
    const coverURL = URL.createObjectURL(coverBlob);
    console.log('coverURL', coverURL);

    develop.style.backgroundImage = `url(${coverURL})`;
  }

  setMoveable() {
    this.draggable = true;

    this.addEventListener('dragstart', (e) => {
      this.classList.add('dragging');
      // console.log(e.type, e.clientX, e.clientY, ' | ', e.layerX, e.layerY, ' | ', e.offsetX, e.offsetY, ' | ', e.pageX, e.pageY, ' | ', e.screenX, e.screenY);

      window.dragged = this;

      this.clientX = e.clientX;
      this.clientY = e.clientY;

      this.rect = document.querySelector('#movezone')?.getBoundingClientRect();
      let position = 'absolute';
      if (!this.rect) {
        this.rect = { left: 0, top: 0 };
        position = 'fixed';
      }
      console.log('this.rect', this.rect);

      this.absoluteLeft = window.scrollX + this.getBoundingClientRect().left - this.rect.left;
      this.absoluteTop = window.scrollY + this.getBoundingClientRect().top - this.rect.top;
      // console.log(window.scrollY, this.getBoundingClientRect().top, this.rect.top);

      this.style.position = position;
      this.style.left = this.absoluteLeft + 'px';
      this.style.top = this.absoluteTop + 'px';

      // console.log('absolute', this.absoluteLeft, this.absoluteTop);
    });
    this.addEventListener('drag', (e) => {
      // console.log(e.type, e.target);
    });
    this.addEventListener('dragend', (e) => {
      this.classList.remove('dragging');
      console.log(e.type, e.clientX, e.clientY, ' | ', e.layerX, e.layerY, ' | ', e.offsetX, e.offsetY, ' | ', e.pageX, e.pageY, ' | ', e.screenX, e.screenY);

      const movedX = e.clientX - parseFloat(this.clientX);
      const movedY = e.clientY - parseFloat(this.clientY);

      let left = parseFloat(this.absoluteLeft) + movedX;
      let top = parseFloat(this.absoluteTop) + movedY;

      left = Math.max(0, left);
      top = Math.max(0, top);

      left = Math.min(left, this.rect.width - parseFloat(this.style.width));
      top = Math.min(top, this.rect.height - (parseFloat(this.style.width) * 269) / 400);

      this.style.left = left + 'px';
      this.style.top = top + 'px';

      // console.log('moved', movedX, movedY, this);
    });
  }
}

customElements.define('flay-develop', FlayDevelop);
