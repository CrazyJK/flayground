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
export default class FlayOne extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    const wrapper = document.createElement('article');
    wrapper.classList.add('flay');

    const cover = wrapper.appendChild(document.createElement('div'));
    cover.classList.add('cover');
    this.flayCover = cover.appendChild(new FlayCover());

    const studio = wrapper.appendChild(document.createElement('div'));
    studio.classList.add('studio');
    this.flayStudio = studio.appendChild(new FlayStudio());

    const opus = wrapper.appendChild(document.createElement('div'));
    opus.classList.add('opus');
    this.flayOpus = opus.appendChild(new FlayOpus());

    const title = wrapper.appendChild(document.createElement('div'));
    title.classList.add('title');
    this.flayTitle = title.appendChild(new FlayTitle());

    const comment = wrapper.appendChild(document.createElement('div'));
    comment.classList.add('comment');
    this.flayComment = comment.appendChild(new FlayComment());

    const actress = wrapper.appendChild(document.createElement('div'));
    actress.classList.add('actress');
    this.flayActress = actress.appendChild(new FlayActress());

    const release = wrapper.appendChild(document.createElement('div'));
    release.classList.add('release');
    this.flayRelease = release.appendChild(new FlayRelease());

    const files = wrapper.appendChild(document.createElement('div'));
    files.classList.add('files');
    this.flayFiles = files.appendChild(new FlayFiles());

    const rank = wrapper.appendChild(document.createElement('div'));
    rank.classList.add('rank');
    this.flayRank = rank.appendChild(new FlayRank());

    const tag = wrapper.appendChild(document.createElement('div'));
    tag.classList.add('tag');
    this.flayTag = tag.appendChild(new FlayTag());

    const link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', './css/components.css');

    this.shadowRoot.append(link, wrapper);
  }

  /**
   *
   * @param {String} opus
   */
  set(opus) {
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

customElements.define('flay-one', FlayOne);
