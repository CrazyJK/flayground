import DateUtils from '@lib/DateUtils';
import FlayHTMLElement, { defineCustomElements } from './FlayHTMLElement';
import './FlayRelease.scss';

/**
 * Custom element of Release
 */
export default class FlayRelease extends FlayHTMLElement {
  constructor() {
    super();

    this.innerHTML = `
      <label class=" release-label">                        <span id="release" >0000.00.00</span></label>
      <label class="modified-label extra"><sub>mod    </sub><span id="modified">00/00/00</span></label>
      <label class="  access-label extra"><sub>access </sub><span id="access"  >00/00/00</span></label>
      <label class="  played-label extra"><sub>play   </sub><span id="played"  >00/00/00</span></label>
      <label class="  shoted-label extra"><sub>shot   </sub><span id="shoted"  >00/00/00</span></label>
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

    const shotLength = flay.video.likes?.length || 0;
    const lastShoted = shotLength > 0 ? flay.video.likes[shotLength - 1] : -1;

    this.querySelector('#release').innerHTML = flay.release;
    this.querySelector('#modified').innerHTML = DateUtils.format(flay.lastModified, 'yy/MM/dd');
    this.querySelector('#access').innerHTML = DateUtils.format(flay.video.lastAccess, 'yy/MM/dd');
    this.querySelector('#played').innerHTML = DateUtils.format(flay.video.lastPlay, 'yy/MM/dd');
    this.querySelector('#shoted').innerHTML = DateUtils.format(lastShoted, 'yy/MM/dd');
  }
}

defineCustomElements('flay-release', FlayRelease);
