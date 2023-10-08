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
    console.log('connectedCallback', this.opus);
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
}

customElements.define('flay-develop', FlayDevelop);
