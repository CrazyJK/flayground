import './init/Page';
import './page.flay-one.scss';

import FlayCondition from './flay/page/FlayCondition';
import { OpusProvider } from './lib/OpusProvider';
import DateUtils from './util/DateUtils';
import StringUtils from './util/StringUtils';

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
      <div class="studio"       >${flay.studio}                                                        </div>
      <div class="opus"         >${flay.opus}                                                          </div>
      <div class="title"        >${flay.title}                                                         </div>
      <div class="actress"      >${flay.actressList.join(', ')}                                        </div>
      <div class="ralease"      >${flay.release}                                                       </div>
      <div class="comment"      >${StringUtils.toBlank(flay.video.comment)}                            </div>
      <div class="last-access"  >${DateUtils.format(flay.video.lastAccess, 'yyyy-MM-dd')}              </div>
      <div class="last-modified">${DateUtils.format(flay.video.lastModified, 'yyyy-MM-dd')}            </div>
      <div class="last-play"    >${DateUtils.format(flay.video.lastPlay, 'yyyy-MM-dd')}                </div>
      <div class="play"         >${StringUtils.toBlank(flay.video.play)}                               </div>
      <div class="shot"         >${StringUtils.toBlank(flay.video.likes?.length)}                      </div>
      <div class="rank"         >${StringUtils.toBlank(flay.video.rank)}                               </div>
      <div class="tags"         >${StringUtils.toBlank(flay.video.tags?.map((t) => t.name).join(', '))}</div>
      <div class="jp-title"     >${StringUtils.toBlank(flay.video.title)}                              </div>
      <div class="jp-desc"      >${StringUtils.toBlank(flay.video.desc)}                               </div>`;
    });
  }

  async start() {
    const flayCondition = document.querySelector('body > main > header').appendChild(new FlayCondition());
    flayCondition.addEventListener('change', async () => {
      this.setOpusList(flayCondition.opusList);

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
