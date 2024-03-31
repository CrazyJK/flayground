import FlayPagination from './flay/page/FlayPagination';
import './init/Page';
import './page.archive.scss';

import { dateFormat } from './util/dateUtils';

class Page {
  coverURL;

  constructor() {}

  async start() {
    const list = await fetch('/archive').then((res) => res.json());

    const archiveMap = Array.from(list).reduce((map, archive) => {
      map.set(archive.opus, archive);
      return map;
    }, new Map());

    const flayPagination = document.querySelector('body > footer').appendChild(new FlayPagination());
    flayPagination.addEventListener('change', async (e) => {
      const opus = e.target.opus;
      await this.#show(archiveMap.get(opus));
    });
    flayPagination.set(Array.from(archiveMap.keys()));
  }

  async #show(flay) {
    URL.revokeObjectURL(this.coverURL);
    this.coverURL = URL.createObjectURL(await fetch(`/static/cover/${flay.opus}`).then((res) => res.blob()));

    document.querySelector('main').innerHTML = `
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
  }
}

new Page().start();

function toBlank(text) {
  return text === null || typeof text === 'undefined' ? '' : text;
}
