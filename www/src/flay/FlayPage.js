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

export default class FlayPage extends HTMLElement {
  opus = null;
  flay = null;
  actress = null;

  constructor() {
    super();
  }

  connectedCallback() {
    this.attachShadow({ mode: 'open' });

    const link = this.shadowRoot.appendChild(document.createElement('link'));
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = 'style.css';

    const wrapper = this.shadowRoot.appendChild(document.createElement('article'));
    wrapper.classList.add(this.tagName.toLowerCase());

    this.flayStudio = wrapper.appendChild(new FlayStudio());
    this.flayOpus = wrapper.appendChild(new FlayOpus());
    this.flayComment = wrapper.appendChild(new FlayComment());
    this.flayTitle = wrapper.appendChild(new FlayTitle());
    this.flayCover = wrapper.appendChild(new FlayCover());
    this.flayActress = wrapper.appendChild(new FlayActress());
    this.flayRelease = wrapper.appendChild(new FlayRelease());
    this.flayRank = wrapper.appendChild(new FlayRank());
    this.flayFiles = wrapper.appendChild(new FlayFiles());
    this.flayTag = wrapper.appendChild(new FlayTag());
  }

  /**
   *
   * @param {string} opus
   * @param {boolean} reload
   * @returns [flay, actress]
   */
  async set(opus, reload) {
    this.opus = opus;
    this.setAttribute('opus', opus);

    const { flay, actress } = await fetch('/flay/' + opus + '/fully').then((res) => res.json());
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

    return [flay, actress];
  }

  /**
   * reload data
   */
  reload() {
    this.set(this.opus, true);
  }
}

customElements.define('flay-page', FlayPage);
