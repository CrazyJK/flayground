import DateUtils from '../../util/DateUtils';
import FlayHTMLElement, { defineCustomElements } from './FlayHTMLElement';
import './FlayRelease.scss';

/**
 * Custom element of Release
 */
export default class FlayRelease extends FlayHTMLElement {
  constructor() {
    super();

    this.innerHTML = `
      <label class="release-label" >                  <span id="release" >0000.00.00</span></label>
      <label class="modified-label"><sub>mod    </sub><span id="modified">00/00/00</span></label>
      <label class="access-label"  ><sub>access </sub><span id="access"  >00/00/00</span></label>
      <label class="played-label"  ><sub>play   </sub><span id="played"  >00/00/00</span></label>
    `;
  }

  connectedCallback() {
    this.classList.add('flay-release');
  }

  /**
   *
   * @param {Flay} flay
   */
  set(flay) {
    this.setFlay(flay);

    this.querySelector('#release').innerHTML = flay.release;
    this.querySelector('#modified').innerHTML = DateUtils.format(flay.lastModified, 'yy/MM/dd');
    this.querySelector('#access').innerHTML = DateUtils.format(flay.video.lastAccess, 'yy/MM/dd');
    this.querySelector('#played').innerHTML = DateUtils.format(flay.video.lastPlay, 'yy/MM/dd');
  }
}

defineCustomElements('flay-release', FlayRelease);
