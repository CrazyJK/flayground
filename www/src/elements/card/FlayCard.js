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
    LINK.setAttribute('href', './css/components.css');
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
}

article > * {
  background-color: var(--color-bg);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  max-width: calc(100% - 0.5rem);
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
`;
