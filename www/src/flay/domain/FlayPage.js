import FlayFetch from '../../lib/FlayFetch';
import './FlayPage.scss';
import FlayActress from './part/FlayActress';
import FlayComment from './part/FlayComment';
import FlayCover from './part/FlayCover';
import FlayFiles from './part/FlayFiles';
import FlayOpus from './part/FlayOpus';
import FlayRank from './part/FlayRank';
import FlayRelease from './part/FlayRelease';
import FlayStudio from './part/FlayStudio';
import FlayTag from './part/FlayTag';
import FlayTitle from './part/FlayTitle';

export default class FlayPage extends HTMLDivElement {
  opus = null;
  flay = null;
  actress = null;

  constructor() {
    super();
    this.classList.add('flay-page', 'flay-div');
  }

  connectedCallback() {
    this.flayStudio = this.appendChild(new FlayStudio());
    this.flayOpus = this.appendChild(new FlayOpus());
    this.flayComment = this.appendChild(new FlayComment());
    this.flayTitle = this.appendChild(new FlayTitle());
    this.flayCover = this.appendChild(new FlayCover());
    this.flayActress = this.appendChild(new FlayActress());
    this.flayRelease = this.appendChild(new FlayRelease());
    this.flayRank = this.appendChild(new FlayRank());
    this.flayFiles = this.appendChild(new FlayFiles());
    this.flayTag = this.appendChild(new FlayTag());
  }

  /**
   *
   * @param {string} opus
   * @param {boolean} reload
   * @returns
   */
  async set(opus, reload) {
    this.opus = opus;
    this.setAttribute('opus', opus);

    const { flay, actress } = await FlayFetch.getFlayActress(opus);
    this.flay = flay;
    this.actress = actress;

    this.flayStudio.set(flay, reload);
    this.flayOpus.set(flay, reload);
    this.flayComment.set(flay, reload);
    this.flayTitle.set(flay, reload);
    this.flayCover.set(flay, reload);
    this.flayActress.set(flay, actress, reload);
    this.flayRelease.set(flay, reload);
    this.flayRank.set(flay, reload);
    this.flayFiles.set(flay, reload);
    this.flayTag.set(flay, reload);

    return { flay, actress };
  }

  /**
   * reload data
   */
  reload() {
    this.set(this.opus, true);
  }
}

customElements.define('flay-page', FlayPage, { extends: 'div' });
