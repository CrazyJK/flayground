import DateUtils from '../../util/DateUtils';
import FlayHTMLElement from './FlayHTMLElement';
import './FlayRelease.scss';

/**
 * Custom element of Release
 */
export default class FlayRelease extends FlayHTMLElement {
  flay;

  constructor() {
    super();

    this.init();
  }

  init() {
    this.wrapper.innerHTML = `
      <label class="release-label" >                  <span id="release" >2023.08.09</span></label>
      <label class="modified-label"><sub>mod    </sub><span id="modified">2023-08-20</span></label>
      <label class="access-label"  ><sub>access </sub><span id="access"  >2023-08-20</span></label>
      <label class="played-label"  ><sub>play   </sub><span id="played"  >2023-08-20</span></label>
    `;

    this.releaseSpan = this.shadowRoot.querySelector('#release');
    this.modifiedSpan = this.shadowRoot.querySelector('#modified');
    this.accessSpan = this.shadowRoot.querySelector('#access');
    this.playedSpan = this.shadowRoot.querySelector('#played');
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
    this.modifiedSpan.innerHTML = DateUtils.format(flay.lastModified, 'yy/mm/dd');
    this.accessSpan.innerHTML = DateUtils.format(flay.video.lastAccess, 'yy/mm/dd');
    this.playedSpan.innerHTML = DateUtils.format(flay.video.lastPlay, 'yy/mm/dd');
  }
}

// Define the new element
customElements.define('flay-release', FlayRelease);
