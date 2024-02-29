import './blank.scss';
import './lib/ThemeListener';
import { dateFormat } from './util/dateUtils';
import { getRandomInt } from './util/randomNumber';

class Page {
  BODY;
  list;
  coverURL;

  constructor() {
    this.BODY = document.querySelector('body');
  }

  async start() {
    this.list = await fetch('/archive').then((res) => res.json());

    document.addEventListener('wheel', async (e) => await this.show());
  }

  async show() {
    URL.revokeObjectURL(this.coverURL);
    this.BODY.textContent = null;

    const randomIndex = getRandomInt(0, this.list.length);
    const flay = this.list[randomIndex];
    this.coverURL = URL.createObjectURL(await fetch(`/static/cover/${flay.opus}`).then((res) => res.blob()));

    this.BODY.innerHTML = `
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

    console.log(flay);
  }
}

new Page().start();

function toBlank(text) {
  return text === null || typeof text === 'undefined' ? '' : text;
}
