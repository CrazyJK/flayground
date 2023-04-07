import FlayActress from './FlayActress';
import FlayComment from './FlayComment';
import FlayCover from './FlayCover';
import FlayFiles from './FlayFiles';
import FlayOpus from './FlayOpus';
import FlayRank from './FlayRank';
import FlayRelease from './FlayRelease';
import FlayStudio from './FlayStudio';
import FlayTag from './FlayTag';
import FlayTitle from './FlayTitle';

/**
 *
 */
export default class FlayPage extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    const wrapper = document.createElement('article');
    const link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', './css/FlayPage.css');
    this.shadowRoot.append(link, wrapper);

    this.flayStudio = wrapper.appendChild(new FlayStudio());
    this.flayOpus = wrapper.appendChild(new FlayOpus());
    this.flayComment = wrapper.appendChild(new FlayComment());
    this.flayTitle = wrapper.appendChild(new FlayTitle());
    this.flayCover = wrapper.appendChild(new FlayCover());
    this.flayActress = wrapper.appendChild(new FlayActress());
    this.flayFiles = wrapper.appendChild(new FlayFiles());
    this.flayRank = wrapper.appendChild(new FlayRank());
    this.flayRelease = wrapper.appendChild(new FlayRelease());
    this.flayTag = wrapper.appendChild(new FlayTag());
  }

  /**
   *
   * @param {String} opus
   */
  set(opus) {
    this.setAttribute('opus', opus);

    fetch('/flay/' + opus + '/fully')
      .then((res) => res.json())
      .then((fullyFlay) => {
        const { actress, flay } = fullyFlay;
        this.flayCover.set(flay);
        this.flayStudio.set(flay);
        this.flayOpus.set(flay);
        this.flayTitle.set(flay);
        this.flayComment.set(flay);
        this.flayActress.set(flay, actress);
        this.flayRelease.set(flay);
        this.flayFiles.set(flay);
        this.flayRank.set(flay);
        this.flayTag.set(flay);
      });
  }
}

customElements.define('flay-page', FlayPage);
