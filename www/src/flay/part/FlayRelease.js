import { componentCss } from '../../util/componentCssLoader';
import { dateFormat } from '../../util/dateUtils';

/**
 * Custom element of Release
 */
export default class FlayRelease extends HTMLElement {
  flay;

  constructor() {
    super();

    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다

    const STYLE = document.createElement('style');
    STYLE.innerHTML = CSS;

    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('release');
    this.wrapper.innerHTML = HTML;

    this.shadowRoot.append(STYLE, this.wrapper); // 생성된 요소들을 shadow DOM에 부착합니다
  }

  connectedCallback() {
    this.releaseSpan = this.shadowRoot.querySelector('#release');
    this.modifiedSpan = this.shadowRoot.querySelector('#modified');
    this.accessSpan = this.shadowRoot.querySelector('#access');
    this.playedSpan = this.shadowRoot.querySelector('#played');
  }

  resize(domRect) {
    this.domRect = domRect;
    this.isCard = this.classList.contains('card');
    this.wrapper.classList.toggle('card', this.isCard);
    this.wrapper.classList.toggle('small', domRect.width < 400);
  }

  /**
   *
   * @param {Flay} flay
   */
  set(flay) {
    this.flay = flay;
    this.wrapper.classList.toggle('archive', this.flay.archive);
    this.wrapper.setAttribute('data-opus', flay.opus);

    this.releaseSpan.innerHTML = flay.release;
    this.modifiedSpan.innerHTML = dateFormat(flay.lastModified, 'yy/mm/dd');
    this.accessSpan.innerHTML = dateFormat(flay.video.lastAccess, 'yy/mm/dd');
    this.playedSpan.innerHTML = dateFormat(flay.video.lastPlay, 'yy/mm/dd');
  }
}

// Define the new element
customElements.define('flay-release', FlayRelease);

const HTML = `
<label class="release-label" ><span id="release" >2023.08.09</span></label>
<label class="modified-label"><sub>mod    </sub><span id="modified">2023-08-20</span></label>
<label class="access-label"  ><sub>access </sub><span id="access"  >2023-08-20</span></label>
<label class="played-label"  ><sub>play   </sub><span id="played"  >2023-08-20</span></label>
`;

const CSS = `
${componentCss}
div.release {
  display: flex;
  gap: 1rem;
  justify-content: center;
  align-items: baseline;
}
div.release .modified-label,
div.release .access-label,
div.release .played-label {
  font-size: var(--size-normal);
  min-width: 7rem;
  text-align: center;
}

div.release.card .modified-label,
div.release.card .access-label,
div.release.card .played-label {
  display: none;
}
`;
