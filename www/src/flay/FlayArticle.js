import DateUtils from '../util/DateUtils';
import { popupActress, popupCover, popupFlay, popupFlayInfo } from '../util/FlaySearch';
import StringUtils from '../util/StringUtils';
import './FlayArticle.scss';

export default class FlayArticle extends HTMLDivElement {
  constructor(args) {
    super();
    if (args) {
      if (args.mode) this.classList.add(args.mode);
    }
  }

  connectedCallback() {
    this.classList.add('flay-article');
    this.innerHTML = `
      <div class="cover"></div>
      <dl>
        <dt class="studio"       ></dt>
        <dt class="opus"         ></dt>
        <dt class="title"        ></dt>
        <dt class="actress"      ></dt>
        <dt class="release"      ></dt>
        <dt class="tags"         ></dt>
        <dd class="rank"         ></dd>
        <dd class="play"         ></dd>
        <dd class="shot"         ></dd>
        <dd class="comment"      ></dd>
        <dd class="jp-title"     ></dd>
        <dd class="jp-desc"      ></dd>
        <dd class="last-access"  ></dd>
        <dd class="last-modified"></dd>
        <dd class="last-play"    ></dd>
      </dl>
    `;

    this.querySelector('.cover').addEventListener('click', () => popupCover(this.opus));
    this.querySelector('.opus').addEventListener('click', () => popupFlayInfo(this.opus));
    this.querySelector('.title').addEventListener('click', () => popupFlay(this.opus));
    this.querySelector('.actress').addEventListener('click', (e) => popupActress(e.target.textContent));
  }

  set(flay, coverURL) {
    this.opus = flay.opus;

    this.querySelector('.cover').style.backgroundImage = `url(${coverURL ? coverURL : `/static/cover/${flay.opus}`})`;

    this.querySelector('.studio').innerHTML = flay.studio;
    this.querySelector('.opus').innerHTML = flay.opus;
    this.querySelector('.title').innerHTML = flay.title;
    this.querySelector('.actress').innerHTML = flay.actressList.map((name) => `<span>${name}</span>`).join(', ');
    this.querySelector('.release').innerHTML = flay.release;
    this.querySelector('.tags').innerHTML = StringUtils.toBlank(flay.video.tags?.map((t) => t.name).join(', '));

    this.querySelector('.rank').innerHTML = StringUtils.toBlank(flay.video.rank) + '<small>rank</small>';
    this.querySelector('.play').innerHTML = StringUtils.toBlank(flay.video.play) + '<small>play</small>';
    this.querySelector('.shot').innerHTML = StringUtils.toBlank(flay.video.likes?.length) + '<small>shot</small>';
    this.querySelector('.comment').innerHTML = StringUtils.toBlank(flay.video.comment);

    this.querySelector('.jp-title').innerHTML = StringUtils.toBlank(flay.video.title);
    this.querySelector('.jp-desc').innerHTML = StringUtils.toBlank(flay.video.desc);

    this.querySelector('.last-access').innerHTML = flay.video.lastAccess > 0 ? DateUtils.format(flay.video.lastAccess, 'yy.MM.dd') + '<small>accessed</small>' : '';
    this.querySelector('.last-modified').innerHTML = flay.video.lastModified > 0 ? DateUtils.format(flay.video.lastModified, 'yy.MM.dd') + '<small>modified</small>' : '';
    this.querySelector('.last-play').innerHTML = flay.video.lastPlay > 0 ? DateUtils.format(flay.video.lastPlay, 'yy.MM.dd') + '<small>played</small>' : '';
  }
}

customElements.define('flay-article', FlayArticle, { extends: 'div' });
