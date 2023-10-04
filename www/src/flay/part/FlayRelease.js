/**
 * Custom element of Release
 */
export default class FlayRelease extends HTMLElement {
  flay;

  constructor() {
    super();

    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다

    const LINK = document.createElement('link');
    LINK.setAttribute('rel', 'stylesheet');
    LINK.setAttribute('href', './css/4.components.css');

    const STYLE = document.createElement('style');
    STYLE.innerHTML = CSS;

    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('release');
    this.wrapper.innerHTML = HTML;

    this.shadowRoot.append(LINK, STYLE, this.wrapper); // 생성된 요소들을 shadow DOM에 부착합니다
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
    this.modifiedSpan.innerHTML = dateFormat(flay.lastModified);
    this.accessSpan.innerHTML = dateFormat(flay.video.lastAccess);
    this.playedSpan.innerHTML = dateFormat(flay.video.lastPlay);
  }
}

// Define the new element
customElements.define('flay-release', FlayRelease);

function dateFormat(time) {
  if (time < 0) {
    return '00/00/00';
  }
  const date = new Date(time);
  let year = date.getFullYear() - 2000;
  let month = date.getMonth() + 1;
  let day = date.getDate();
  return `${year}/${month > 9 ? month : '0' + month}/${day > 9 ? day : '0' + day}`;
}

const HTML = `
<label class="release-label" ><span id="release" >2023.08.09</span></label>
<label class="modified-label"><sub>mod    </sub><span id="modified">2023-08-20</span></label>
<label class="access-label"  ><sub>access </sub><span id="access"  >2023-08-20</span></label>
<label class="played-label"  ><sub>play   </sub><span id="played"  >2023-08-20</span></label>
`;

const CSS = `
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
