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
  constructor(options) {
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

    if (options && options.excludes) {
      this.excludes = options.excludes;
    } else {
      this.excludes = [];
    }
    this.opus = null;
    this.flay = null;
    this.actress = null;
  }

  /**
   *
   * @param {String} opus
   */
  set(opus) {
    if (!opus) {
      this.style.display = 'none';
      return;
    }

    this.opus = opus;
    this.setAttribute('opus', opus);

    fetch('/flay/' + opus + '/fully')
      .then((res) => res.json())
      .then((fullyFlay) => {
        const { actress, flay } = fullyFlay;
        this.flay = flay;
        this.actress = actress;

        if (!this.excludes.includes('FlayCover')) {
          this.flayCover.set(flay);
        }
        if (!this.excludes.includes('FlayStudio')) {
          this.flayStudio.set(flay);
        }
        if (!this.excludes.includes('FlayOpus')) {
          this.flayOpus.set(flay);
        }
        if (!this.excludes.includes('FlayTitle')) {
          this.flayTitle.set(flay);
        }
        if (!this.excludes.includes('FlayComment')) {
          this.flayComment.set(flay);
        }
        if (!this.excludes.includes('FlayActress')) {
          this.flayActress.set(flay, actress);
        }
        if (!this.excludes.includes('FlayRelease')) {
          this.flayRelease.set(flay);
        }
        if (!this.excludes.includes('FlayFiles')) {
          this.flayFiles.set(flay);
        }
        if (!this.excludes.includes('FlayRank')) {
          this.flayRank.set(flay);
        }
        if (!this.excludes.includes('FlayTag')) {
          this.flayTag.set(flay);
        }
        this.setAttribute('rank', flay.video.rank);
      });

    let domRect = this.getBoundingClientRect();
    this.wrapper.classList.toggle('small', domRect.width < 600);
  }

  /**
   * reload data
   */
  reload() {
    this.set(this.opus);
  }
}

customElements.define('flay-card', FlayCard);
