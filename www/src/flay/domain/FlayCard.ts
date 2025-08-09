import FlayActress from '@flay/domain/part/FlayActress';
import FlayComment from '@flay/domain/part/FlayComment';
import FlayCover from '@flay/domain/part/FlayCover';
import FlayFiles from '@flay/domain/part/FlayFiles';
import FlayOpus from '@flay/domain/part/FlayOpus';
import FlayRank from '@flay/domain/part/FlayRank';
import FlayRelease from '@flay/domain/part/FlayRelease';
import FlayStudio from '@flay/domain/part/FlayStudio';
import FlayTag from '@flay/domain/part/FlayTag';
import FlayTitle from '@flay/domain/part/FlayTitle';
import FlayFetch, { Actress, Flay, FullyFlay } from '@lib/FlayFetch';
import { addResizeListener } from '@lib/windowAddEventListener';
import './FlayCard.scss';

/**
 * Custom element of Card
 */
export default class FlayCard extends HTMLElement {
  opus: string;
  flay: Flay;
  actress: Actress[];
  excludes: string[];

  flayCover: FlayCover;
  flayInfo: HTMLElement;
  flayTitle: FlayTitle;
  flayStudio: FlayStudio;
  flayOpus: FlayOpus;
  flayComment: FlayComment;
  flayActress: FlayActress;
  flayFiles: FlayFiles;
  flayRank: FlayRank;
  flayRelease: FlayRelease;
  flayTag: FlayTag;

  constructor(options) {
    super();

    this.classList.add('flay-div');

    if (options && options.excludes) {
      this.excludes = options.excludes;
    } else {
      this.excludes = [];
    }

    this.init();
  }

  init() {
    this.flayCover = this.appendChild(new FlayCover().setCard());
    this.flayInfo = this.appendChild(document.createElement('div'));
    this.flayInfo.classList.add('flay-info');

    this.flayTitle = this.flayInfo.appendChild(new FlayTitle().setCard());
    this.flayStudio = this.flayInfo.appendChild(new FlayStudio().setCard());
    this.flayOpus = this.flayInfo.appendChild(new FlayOpus().setCard());
    this.flayComment = this.flayInfo.appendChild(new FlayComment().setCard());
    this.flayActress = this.flayInfo.appendChild(new FlayActress().setCard());
    this.flayFiles = this.flayInfo.appendChild(new FlayFiles().setCard());
    this.flayRank = this.flayInfo.appendChild(new FlayRank().setCard());
    this.flayRelease = this.flayInfo.appendChild(new FlayRelease().setCard());
    this.flayTag = this.flayInfo.appendChild(new FlayTag().setCard());

    addResizeListener(() => {
      this.#resize();
    }, true);
  }

  #resize() {
    const domRect = this.getBoundingClientRect();
    this.flayInfo.classList.toggle('small', domRect.width <= 400);

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

  /**
   * reload data
   */
  async reload() {
    return await this.set(this.opus);
  }

  /**
   *
   * @param {string} opus
   * @param {{flay, actress}} fullyFlay
   * @returns
   */
  async set(opus: string, fullyFlay: FullyFlay = null) {
    if (!opus) {
      this.style.display = 'none';
      return;
    }

    this.opus = opus;
    this.setAttribute('opus', opus);

    if (!fullyFlay) {
      try {
        fullyFlay = await FlayFetch.getFullyFlay(opus);
      } catch (error) {
        this.notfound(opus);
        return;
      }
    }
    this.#render(fullyFlay);

    return fullyFlay;
  }

  #render(fullyFlay: FullyFlay) {
    const { actress, flay } = fullyFlay;
    this.flay = flay;
    this.actress = actress;

    this.setAttribute('rank', String(flay.video.rank));
    if (flay.archive) {
      this.setAttribute('archive', 'true');
      this.classList.add('archive');
    }

    if (this.flay.video.likes?.length > 0) {
      this.classList.add('shot');
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

  notfound(opus: string) {
    this.flayInfo.classList.add('notfound');

    const notFoundFlay: Flay = {
      studio: '',
      opus: opus,
      title: '',
      actressList: [],
      release: '',
      score: 0,
      actressPoint: 0,
      studioPoint: 0,
      archive: false,
      video: null,
      files: null,
      length: 0,
      lastModified: 0,
    };

    this.flayOpus.set(notFoundFlay);
    console.warn('notfound ' + opus);
  }
}

customElements.define('flay-card', FlayCard);
