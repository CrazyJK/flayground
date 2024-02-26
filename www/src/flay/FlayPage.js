import { componentCss } from '../util/componentCssLoader';
import { addResizeLazyEventListener } from '../util/resizeListener';
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

export default class FlayPage extends HTMLElement {
  opus = null;
  flay = null;
  actress = null;

  constructor() {
    super();
  }

  connectedCallback() {
    this.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.innerHTML = CSS;

    const wrapper = document.createElement('article');
    wrapper.classList.add('page');

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

    this.shadowRoot.append(style, wrapper);

    addResizeLazyEventListener(() => {
      // 24' 모니터에서 선택된 태그만 보이기
      this.flayTag.shadowRoot.querySelector('.tag').classList.toggle('card', window.innerHeight < 998);
    });
  }

  /**
   *
   * @param {string} opus
   * @param {boolean} reload
   * @returns [flay, actress]
   */
  async set(opus, reload) {
    this.opus = opus;
    this.setAttribute('opus', opus);

    const { flay, actress } = await fetch('/flay/' + opus + '/fully').then((res) => res.json());
    this.flay = flay;
    this.actress = actress;

    this.flayStudio.set(flay, reload);
    this.flayOpus.set(flay, reload);
    this.flayComment.set(flay, reload);
    this.flayTitle.set(flay, reload);
    this.flayCover.set(flay, reload);
    this.flayActress.set(flay, actress, reload);
    this.flayRelease.set(flay, reload);
    this.flayRank.set(flay, reload);
    this.flayFiles.set(flay, reload);
    this.flayTag.set(flay, reload);

    return [flay, actress];
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
${componentCss}
article.page {
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  justify-content: center;
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
@media screen and (max-height: 997px) {
  article.page {
    max-width: 800px;
  }
}
`;
