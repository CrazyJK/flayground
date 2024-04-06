import './FlayCard.scss';
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

/**
 * Custom element of Card
 */
export default class FlayCard extends HTMLElement {
  opus;
  flay;
  actress;

  constructor(options) {
    super();

    if (options && options.excludes) {
      this.excludes = options.excludes;
    } else {
      this.excludes = [];
    }

    this.init();
  }

  init() {
    this.attachShadow({ mode: 'open' });

    const link = this.shadowRoot.appendChild(document.createElement('link'));
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = 'style.css';

    this.wrapper = this.shadowRoot.appendChild(document.createElement('article'));
    this.wrapper.classList.add(this.tagName.toLowerCase());

    this.flayCover = this.wrapper.appendChild(new FlayCover());
    this.flayInfo = this.wrapper.appendChild(document.createElement('div'));
    this.flayInfo.classList.add('flay-info');

    this.flayTitle = this.flayInfo.appendChild(new FlayTitle());
    this.flayStudio = this.flayInfo.appendChild(new FlayStudio());
    this.flayOpus = this.flayInfo.appendChild(new FlayOpus());
    this.flayComment = this.flayInfo.appendChild(new FlayComment());
    this.flayActress = this.flayInfo.appendChild(new FlayActress());
    this.flayFiles = this.flayInfo.appendChild(new FlayFiles());
    this.flayRank = this.flayInfo.appendChild(new FlayRank());
    this.flayRelease = this.flayInfo.appendChild(new FlayRelease());
    this.flayTag = this.flayInfo.appendChild(new FlayTag());

    this.flayCover.classList.add('card');
    this.flayTitle.classList.add('card');
    this.flayStudio.classList.add('card');
    this.flayOpus.classList.add('card');
    this.flayComment.classList.add('card');
    this.flayActress.classList.add('card');
    this.flayFiles.classList.add('card');
    this.flayRank.classList.add('card');
    this.flayRelease.classList.add('card');
    this.flayTag.classList.add('card');
  }

  /**
   * reload data
   */
  async reload() {
    return await this.set(this.opus);
  }

  /**
   *
   * @param {String} opus
   */
  async set(opus, fullyFlay) {
    if (!opus) {
      this.style.display = 'none';
      return;
    }

    this.opus = opus;
    this.setAttribute('opus', opus);

    if (!fullyFlay) {
      const res = await fetch('/flay/' + opus + '/fully');
      if (res.status === 404) {
        this.notfound(opus);
      } else {
        fullyFlay = await res.json();
      }
    }
    this.render(fullyFlay);
    this.resize();

    return fullyFlay;
  }

  resize() {
    const domRect = this.getBoundingClientRect();
    this.flayInfo.classList.toggle('small', domRect.width < 400);

    this.flayCover.resize(domRect);
    this.flayTitle.resize(domRect);
    this.flayStudio.resize(domRect);
    this.flayOpus.resize(domRect);
    this.flayComment.resize(domRect);
    this.flayActress.resize(domRect);
    this.flayFiles.resize(domRect);
    this.flayRank.resize(domRect);
    this.flayRelease.resize(domRect);
    this.flayTag.resize(domRect);
  }

  render(fullyFlay) {
    const { actress, flay } = fullyFlay;
    this.flay = flay;
    this.actress = actress;

    this.setAttribute('rank', flay.video.rank);
    if (flay.archive) {
      this.setAttribute('archive', true);
      this.wrapper.classList.add('archive');
    }

    const coverExclude = this.excludes.includes('FlayCover');
    const studioExclude = this.excludes.includes('FlayStudio');
    const opusExclude = this.excludes.includes('FlayOpus');
    const titleExclude = this.excludes.includes('FlayTitle');
    const commentExclude = this.excludes.includes('FlayComment');
    const actressExclude = this.excludes.includes('FlayActress');
    const releaseExclude = this.excludes.includes('FlayRelease');
    const filesExclude = this.excludes.includes('FlayFiles');
    const rankExclude = this.excludes.includes('FlayRank');
    const tagExclude = this.excludes.includes('FlayTag');

    if (!coverExclude) this.flayCover.set(flay);
    if (!studioExclude) this.flayStudio.set(flay);
    if (!opusExclude) this.flayOpus.set(flay);
    if (!titleExclude) this.flayTitle.set(flay);
    if (!commentExclude) this.flayComment.set(flay);
    if (!actressExclude) this.flayActress.set(flay, actress);
    if (!releaseExclude) this.flayRelease.set(flay);
    if (!filesExclude) this.flayFiles.set(flay);
    if (!rankExclude) this.flayRank.set(flay);
    if (!tagExclude) this.flayTag.set(flay);

    this.flayCover.classList.toggle('hide', coverExclude);
    this.flayStudio.classList.toggle('hide', studioExclude);
    this.flayOpus.classList.toggle('hide', opusExclude);
    this.flayTitle.classList.toggle('hide', titleExclude);
    this.flayComment.classList.toggle('hide', commentExclude);
    this.flayActress.classList.toggle('hide', actressExclude);
    this.flayRelease.classList.toggle('hide', releaseExclude);
    this.flayFiles.classList.toggle('hide', filesExclude);
    this.flayRank.classList.toggle('hide', rankExclude);
    this.flayTag.classList.toggle('hide', tagExclude);
  }

  getFlay() {
    return this.flay;
  }

  getActress() {
    return this.actress;
  }

  notfound(opus) {
    this.flayInfo.classList.add('notfound');
    this.flayOpus.set({ opus: opus });
    throw new Error('notfound ' + opus);
  }
}

customElements.define('flay-card', FlayCard);
