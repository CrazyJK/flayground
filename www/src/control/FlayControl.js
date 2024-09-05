import './FlayControl.scss';

import { tabUI } from '../lib/TabUI';
import './FlayBatch';
import './FlayCandidate';
import './FlayFinder';
import './FlayRegister';
import './SubtitlesFinder';

export default class FlayControl extends HTMLElement {
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
      <header class="tab-group" role="tablist">
        <button type="button" class="tab-button" role="tab" target="#searchPanel" active>Search</button>
        <button type="button" class="tab-button" role="tab" target="#registPanel">Regist</button>
        <button type="button" class="tab-button" role="tab" target="#batchPanel">Batch</button>
        <button type="button" class="tab-button" role="tab" target="#subtitlesPanel">Subtitles</button>
        <button type="button" class="tab-button" role="tab" target="#candidatesPanel">Candidates</button>
      </header>
      <article>
        <flay-finder      class="tab-content" role="tabpanel" id="searchPanel"></flay-finder>
        <flay-register    class="tab-content" role="tabpanel" id="registPanel"></flay-register>
        <flay-batch       class="tab-content" role="tabpanel" id="batchPanel"></flay-batch>
        <subtitles-finder class="tab-content" role="tabpanel" id="subtitlesPanel"></subtitles-finder>
        <flay-candidate   class="tab-content" role="tabpanel" id="candidatesPanel"></flay-candidate>
      </article>
    `;

    tabUI(this.shadowRoot);
  }
}

customElements.define('flay-control', FlayControl);
