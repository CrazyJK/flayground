import './init/Page';
import './page.flay-one.scss';

import FlayCondition from './flay/page/FlayCondition';
import { OpusProvider } from './lib/OpusProvider';
import { dateFormat } from './util/dateUtils';

class Page extends OpusProvider {
  opus;
  coverURL;
  flayContainer;

  constructor() {
    super();

    this.flayContainer = document.querySelector('body > main > article');
  }

  #showCover() {
    URL.revokeObjectURL(this.coverURL);
    document.startViewTransition(async () => {
      this.opus = await this.getRandomOpus();

      const res = await fetch(`/static/cover/${this.opus}/withData`);
      const data = res.headers.get('Data');
      const dataDecoded = decodeURIComponent(data.replace(/\+/g, ' '));
      const flay = JSON.parse(dataDecoded);
      const coverBlob = await res.blob();

      this.coverURL = URL.createObjectURL(coverBlob);

      this.flayContainer.innerHTML = `
      <img class="cover"    src="${this.coverURL}">
      <div class="studio"       >${flay.studio}                                            </div>
      <div class="opus"         >${flay.opus}                                              </div>
      <div class="title"        >${flay.title}                                             </div>
      <div class="actress"      >${flay.actressList.join(', ')}                            </div>
      <div class="ralease"      >${flay.release}                                           </div>
      <div class="comment"      >${toBlank(flay.video.comment)}                            </div>
      <div class="last-access"  >${dateFormat(flay.video.lastAccess, 'yyyy-mm-dd')}        </div>
      <div class="last-modified">${dateFormat(flay.video.lastModified, 'yyyy-mm-dd')}      </div>
      <div class="last-play"    >${dateFormat(flay.video.lastPlay, 'yyyy-mm-dd')}          </div>
      <div class="play"         >${toBlank(flay.video.play)}                               </div>
      <div class="shot"         >${toBlank(flay.video.likes?.length)}                      </div>
      <div class="rank"         >${toBlank(flay.video.rank)}                               </div>
      <div class="tags"         >${toBlank(flay.video.tags?.map((t) => t.name).join(', '))}</div>
      <div class="jp-title"     >${toBlank(flay.video.title)}                              </div>
      <div class="jp-desc"      >${toBlank(flay.video.desc)}                               </div>`;
    });
  }

  async start() {
    const flayCondition = document.querySelector('body > main > header').appendChild(new FlayCondition());
    flayCondition.addEventListener('change', async (e) => {
      this.setOpusList(e.detail.list);

      this.#showCover();
    });

    this.flayContainer.addEventListener('click', (e) => {
      if (e.target.tagName === 'IMG') {
        // window.open(`/static/cover/${this.opus}`, `cover.${this.opus}`, 'width=800px,height=538px');
        window.open(`popup.cover.html?opus=${this.opus}`, `cover.${this.opus}`, 'width=800px,height=538px');
      } else {
        switch (e.target.className) {
          case 'title':
            window.open(`popup.flay.html?opus=${this.opus}`, `popup.${this.opus}`, 'width=800px,height=1280px');
            break;
          default:
            break;
        }
      }
    });

    window.addEventListener('wheel', (e) => {
      if (e.deltaY > 0) this.#showCover();
    });
  }
}

new Page().start();

function toBlank(text) {
  return text === null || typeof text === 'undefined' ? '' : text;
}
