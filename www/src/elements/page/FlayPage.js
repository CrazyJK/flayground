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

export default class FlayPage extends HTMLElement {
  opus = null;
  flay = null;
  actress = null;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    const LINK = document.createElement('link');
    LINK.setAttribute('rel', 'stylesheet');
    LINK.setAttribute('href', './css/4.components.css');
    const STYLE = document.createElement('style');
    STYLE.innerHTML = CSS;
    const wrapper = document.createElement('article');
    wrapper.classList.add('page');
    this.shadowRoot.append(LINK, STYLE, wrapper);

    this.flayStudio = wrapper.appendChild(new FlayStudio());
    this.flayOpus = wrapper.appendChild(new FlayOpus());
    this.flayComment = wrapper.appendChild(new FlayComment());
    this.flayTitle = wrapper.appendChild(new FlayTitle());
    this.flayCover = wrapper.appendChild(new FlayCover());
    this.flayActress = wrapper.appendChild(new FlayActress());
    this.flayRelease = wrapper.appendChild(new FlayRelease());
    this.flayFiles = wrapper.appendChild(new FlayFiles());
    this.flayRank = wrapper.appendChild(new FlayRank());
    this.flayTag = wrapper.appendChild(new FlayTag());
  }

  /**
   *
   * @param {String} opus
   */
  async set(opus, reload) {
    if (!opus) {
      this.style.display = 'none';
      return;
    }

    this.opus = opus;
    this.setAttribute('opus', opus);

    await fetch('/flay/' + opus + '/fully')
      .then((res) => res.json())
      .then((fullyFlay) => {
        const { actress, flay } = fullyFlay;
        this.flay = flay;
        this.actress = actress;

        this.flayCover.set(flay, reload);
        this.flayStudio.set(flay, reload);
        this.flayOpus.set(flay, reload);
        this.flayTitle.set(flay, reload);
        this.flayComment.set(flay, reload);
        this.flayActress.set(flay, actress, reload);
        this.flayRelease.set(flay, reload);
        this.flayFiles.set(flay, reload);
        this.flayRank.set(flay, reload);
        this.flayTag.set(flay, reload);

        this.style.display = 'block';
      });
  }

  /**
   * reload data
   */
  reload() {
    this.set(this.opus, true);
  }
}

customElements.define('flay-page', FlayPage);

const CSS = `
/* for FlayPage */
article.page {
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  justify-content: center;
  padding-bottom: 1rem;
  transition: 0.4s;
  margin: auto;
}
article.page > * {
  margin-bottom: 0.25rem;
  min-height: 2rem;
  padding: 0 0.5rem;
}
article.page > flay-cover {
  padding: 0;
}
article.page > flay-cover,
article.page > flay-actress,
article.page > flay-files,
article.page > flay-rank {
  margin: 0.25rem 0;
}
article.page > flay-cover,
article.page > flay-actress {
  margin: 1rem auto;
  padding: 0;
  width: 100%;
  max-width: 900px;
}
@media screen and (max-height: 1400px) {
  article.page > flay-cover,
  article.page > flay-actress {
    margin: 0.5rem auto;
  }
}
`;
