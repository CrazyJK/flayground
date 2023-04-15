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
export default class FlayCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.flayCover = new FlayCover();
    this.wrapper = document.createElement('article');
    const link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', './css/FlayCard.css');
    this.shadowRoot.append(link, this.flayCover, this.wrapper);

    this.flayTitle = this.wrapper.appendChild(new FlayTitle());
    this.flayStudio = this.wrapper.appendChild(new FlayStudio());
    this.flayOpus = this.wrapper.appendChild(new FlayOpus());
    this.flayComment = this.wrapper.appendChild(new FlayComment());
    this.flayActress = this.wrapper.appendChild(new FlayActress());
    this.flayFiles = this.wrapper.appendChild(new FlayFiles());
    this.flayRank = this.wrapper.appendChild(new FlayRank());
    this.flayRelease = this.wrapper.appendChild(new FlayRelease());
    this.flayTag = this.wrapper.appendChild(new FlayTag());
    this.flayTag.classList.add('small');
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

    let domRect = this.getBoundingClientRect();
    this.wrapper.classList.toggle('small', domRect.width < 600);
  }
}

customElements.define('flay-card', FlayCard);
