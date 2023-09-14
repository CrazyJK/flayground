import FlayActress from '../part/FlayActress';
import FlayComment from '../part/FlayComment';
import FlayCover from '../part/FlayCover';
import FlayFiles from '../part/FlayFiles';
import FlayOpus from '../part/FlayOpus';
import FlayRank from '../part/FlayRank';
import FlayRelease from '../part/FlayRelease';
import FlayStudio from '../part/FlayStudio';
import FlayTag from '../part/FlayTag';
import FlayTitle from '../part/FlayTitle';

/**
 *
 */
export default class FlayCard extends HTMLElement {
  constructor(options) {
    super();
    this.attachShadow({ mode: 'open' });
    const LINK = document.createElement('link');
    LINK.setAttribute('rel', 'stylesheet');
    LINK.setAttribute('href', './css/4.components.css');
    const STYLE = document.createElement('style');
    STYLE.innerHTML = CSS;
    this.flayCover = new FlayCover();
    this.wrapper = document.createElement('article');
    this.shadowRoot.append(LINK, STYLE, this.flayCover, this.wrapper);

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

  resize() {
    let domRect = this.getBoundingClientRect();
    let isSmall = domRect.width < 600;

    this.wrapper.classList.toggle('small', isSmall);

    this.flayCover.resize();
    this.flayTitle.resize();
    this.flayStudio.resize();
    this.flayOpus.resize();
    this.flayComment.resize();
    this.flayActress.resize();
    this.flayFiles.resize();
    this.flayRank.resize();
    this.flayRelease.resize();
    this.flayTag.resize();
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
    this.resize();

    if (fullyFlay) {
      this.render(fullyFlay);
    } else {
      await fetch('/flay/' + opus + '/fully')
        .then((res) => {
          if (res.status === 404) {
            this.notfound(opus);
          }
          return res.json();
        })
        .then((fullyFlay) => {
          this.render(fullyFlay);
        })
        .catch((e) => {
          console.error(e);
        });
    }
  }

  getFlay() {
    return this.flay;
  }

  getActress() {
    return this.actress;
  }

  notfound(opus) {
    this.wrapper.classList.add('notfound');
    this.flayOpus.set({ opus: opus });
    throw new Error('notfound ' + opus);
  }

  /**
   * reload data
   */
  reload() {
    this.set(this.opus);
  }

  render(fullyFlay) {
    const { actress, flay } = fullyFlay;
    this.flay = flay;
    this.actress = actress;

    let coverExclude = this.excludes.includes('FlayCover');
    let studioExclude = this.excludes.includes('FlayStudio');
    let opusExclude = this.excludes.includes('FlayOpus');
    let titleExclude = this.excludes.includes('FlayTitle');
    let commentExclude = this.excludes.includes('FlayComment');
    let actressExclude = this.excludes.includes('FlayActress');
    let releaseExclude = this.excludes.includes('FlayRelease');
    let filesExclude = this.excludes.includes('FlayFiles');
    let rankExclude = this.excludes.includes('FlayRank');
    let tagExclude = this.excludes.includes('FlayTag');

    if (!coverExclude) this.flayCover.set(flay);
    this.flayCover.classList.toggle('hide', coverExclude);

    if (!studioExclude) this.flayStudio.set(flay);
    this.flayStudio.classList.toggle('hide', studioExclude);

    if (!opusExclude) this.flayOpus.set(flay);
    this.flayOpus.classList.toggle('hide', opusExclude);

    if (!titleExclude) this.flayTitle.set(flay);
    this.flayTitle.classList.toggle('hide', titleExclude);

    if (!commentExclude) this.flayComment.set(flay);
    this.flayComment.classList.toggle('hide', commentExclude);

    if (!actressExclude) this.flayActress.set(flay, actress);
    this.flayActress.classList.toggle('hide', actressExclude);

    if (!releaseExclude) this.flayRelease.set(flay);
    this.flayRelease.classList.toggle('hide', releaseExclude);

    if (!filesExclude) this.flayFiles.set(flay);
    this.flayFiles.classList.toggle('hide', filesExclude);

    if (!rankExclude) this.flayRank.set(flay);
    this.flayRank.classList.toggle('hide', rankExclude);

    if (!tagExclude) this.flayTag.set(flay);
    this.flayTag.classList.toggle('hide', tagExclude);

    this.setAttribute('rank', flay.video.rank);
  }
}

customElements.define('flay-card', FlayCard);

const CSS = `
article {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;

  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.5rem;

  background-color: transparent;
}

article > * {
  background-color: var(--color-bg);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  max-width: calc(100% - 0.5rem);
}

article > .hide {
  display: none;
}

@media screen and (max-width: 600px) {
  html {
    font-size: 12px;
  }
  article.small {
    gap: 0.25rem;
    padding: 0.25rem;
  }
  flay-comment,
  flay-tag {
    display: none;
  }
}

article.small {
  gap: 0.25rem;
  padding: 0.25rem;
}

article.small flay-comment,
article.small flay-tag {
  display: none;
}
article.small > * {
  padding: 0.125rem 0.25rem;
  max-width: calc(100% - 0.5rem);
}

article.notfound flay-title,
article.notfound flay-studio,
article.notfound flay-comment,
article.notfound flay-actress,
article.notfound flay-files,
article.notfound flay-rank,
article.notfound flay-release,
article.notfound flay-tag {
  display: none;
}
`;
