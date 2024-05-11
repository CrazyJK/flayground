import FlayPagination from './flay/page/FlayPagination';
import './init/Page';
import './page.archive.scss';
import DateUtils from './util/DateUtils';
import StringUtils from './util/StringUtils';

class Page {
  coverURL;

  constructor() {}

  async start() {
    const list = await fetch('/archive').then((res) => res.json());
    list.sort((a1, a2) => a1.release.localeCompare(a2.release));

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
      <div class="cover" style="background-image: url(${this.coverURL})">                  </div>
      <div class="studio"       >${flay.studio}                                            </div>
      <div class="opus"         >${flay.opus}                                              </div>
      <div class="title"        >${flay.title}                                             </div>
      <div class="actress"      >${flay.actressList.join(', ')}                            </div>
      <div class="ralease"      >${flay.release}                                           </div>
      <div class="comment"      >${StringUtils.toBlank(flay.video.comment)}                            </div>
      <div class="last-access"  >${DateUtils.format(flay.video.lastAccess, 'yyyy-mm-dd')}        </div>
      <div class="last-modified">${DateUtils.format(flay.video.lastModified, 'yyyy-mm-dd')}      </div>
      <div class="last-play"    >${DateUtils.format(flay.video.lastPlay, 'yyyy-mm-dd')}          </div>
      <div class="play"         >${StringUtils.toBlank(flay.video.play)}                               </div>
      <div class="shot"         >${StringUtils.toBlank(flay.video.likes?.length)}                      </div>
      <div class="rank"         >${StringUtils.toBlank(flay.video.rank)}                               </div>
      <div class="tags"         >${StringUtils.toBlank(flay.video.tags?.map((t) => t.name).join(', '))}</div>
      <div class="jp-title"     >${StringUtils.toBlank(flay.video.title)}                              </div>
      <div class="jp-desc"      >${StringUtils.toBlank(flay.video.desc)}                               </div>`;
  }
}

new Page().start();
