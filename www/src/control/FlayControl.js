import './FlayControl.scss';

import { tabUI } from '../lib/TabUI';
import './FlayBatch';
import './FlayCandidate';
import './FlayFinder';
import './FlayRegister';
import './SubtitlesFinder';

export default class FlayControl extends HTMLDivElement {
  constructor() {
    super();

    this.classList.add('flay-control');
  }

  connectedCallback() {
    this.innerHTML = `
      <header class="tab-group" role="tablist">
        <button type="button" class="tab-button" role="tab" target="#searchPanel" active >Search     </button>
        <button type="button" class="tab-button" role="tab" target="#registPanel"        >Regist     </button>
        <button type="button" class="tab-button" role="tab" target="#batchPanel"         >Batch      </button>
        <button type="button" class="tab-button" role="tab" target="#subtitlesPanel"     >Subtitles  </button>
        <button type="button" class="tab-button" role="tab" target="#candidatesPanel"    >Candidates </button>
      </header>
      <article>
        <div is="flay-finder"      class="tab-content flay-finder"      role="tabpanel" id="searchPanel"    ></div>
        <div is="flay-register"    class="tab-content flay-register"    role="tabpanel" id="registPanel"    ></div>
        <div is="flay-batch"       class="tab-content flay-batch"       role="tabpanel" id="batchPanel"     ></div>
        <div is="subtitles-finder" class="tab-content subtitles-finder" role="tabpanel" id="subtitlesPanel" ></div>
        <div is="flay-candidate"   class="tab-content flay-candidate"   role="tabpanel" id="candidatesPanel"></div>
      </article>
    `;

    tabUI(this);
  }
}

customElements.define('flay-control', FlayControl, { extends: 'div' });
