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
import SVG from '../svg.json';

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
    this.flayRank = wrapper.appendChild(new FlayRank());
    this.flayFiles = wrapper.appendChild(new FlayFiles());
    this.flayTag = wrapper.appendChild(new FlayTag());

    if (location.pathname.indexOf('popup.flay.html') < 0) {
      const newWindowBtn = wrapper.appendChild(document.createElement('button'));
      newWindowBtn.id = 'newWindowBtn';
      newWindowBtn.innerHTML = SVG.newWindow;
      newWindowBtn.addEventListener('click', () => {
        window.open('popup.flay.html?opus=' + this.opus, 'popup.' + this.opus, 'width=800px,height=1280px');
      });
    } else {
      this.flayTitle.deactivate();
    }
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
  margin: 0.25rem auto;
  padding: 0 0.5rem;
  min-height: 2rem;
  width: 100%;
}
article.page > flay-cover {
  margin: 0.5rem auto;
  padding: 0;
}
article.page > flay-cover,
article.page > flay-actress {
  max-width: 900px;
}
@media screen and (max-height: 1400px) {
  article.page > flay-cover {
    margin: 0.25rem auto;
  }
}
#newWindowBtn {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 1;
  margin: 0;
  padding: 0.25rem;
  opacity: 0;
  width: initial;
}
#newWindowBtn:hover {
  opacity: 1;
}
#newWindow {
  color: var(--color-text-secondary);
  width: 1.25rem;
}
`;
