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
    this.classList.add('flay-article', 'flay-div');
    this.innerHTML = `
      <div class="cover"></div>
      <dl>
        <dt class="studio"       ><span></span></dt>
        <dt class="opus"         ><span></span></dt>
        <dt class="title"        ><span></span></dt>
        <dt class="actress"      ></dt>
        <dt class="release"      ><span></span></dt>
        <dt class="tags"         ><span></span></dt>
        <dd class="rank"         ><span></span></dd>
        <dd class="play"         ><span></span></dd>
        <dd class="shot"         ><span></span></dd>
        <dd class="comment"      ><span></span></dd>
        <dd class="jp-title"     ><span></span></dd>
        <dd class="jp-desc"      ><span></span></dd>
        <dd class="last-access"  ><span></span></dd>
        <dd class="last-modified"><span></span></dd>
        <dd class="last-play"    ><span></span></dd>
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

    this.querySelector('.studio span').innerHTML = flay.studio;
    this.querySelector('.opus span').innerHTML = flay.opus;
    this.querySelector('.title span').innerHTML = flay.title;
    this.querySelector('.actress').innerHTML = flay.actressList.map((name) => `<span>${name}</span>`).join(', ');
    this.querySelector('.release span').innerHTML = flay.release;
    this.querySelector('.tags span').innerHTML = StringUtils.toBlank(flay.video.tags?.map((t) => t.name).join(', '));

    this.querySelector('.rank span').innerHTML = StringUtils.toBlank(flay.video.rank) + '<small>rank</small>';
    this.querySelector('.play span').innerHTML = StringUtils.toBlank(flay.video.play) + '<small>play</small>';
    this.querySelector('.shot span').innerHTML = StringUtils.toBlank(flay.video.likes?.length) + '<small>shot</small>';
    this.querySelector('.comment span').innerHTML = StringUtils.toBlank(flay.video.comment);

    this.querySelector('.jp-title span').innerHTML = StringUtils.toBlank(flay.video.title);
    this.querySelector('.jp-desc span').innerHTML = StringUtils.toBlank(flay.video.desc);

    this.querySelector('.last-access span').innerHTML = flay.video.lastAccess > 0 ? DateUtils.format(flay.video.lastAccess, 'yy.MM.dd') + '<small>accessed</small>' : '';
    this.querySelector('.last-modified span').innerHTML = flay.video.lastModified > 0 ? DateUtils.format(flay.video.lastModified, 'yy.MM.dd') + '<small>modified</small>' : '';
    this.querySelector('.last-play span').innerHTML = flay.video.lastPlay > 0 ? DateUtils.format(flay.video.lastPlay, 'yy.MM.dd') + '<small>played</small>' : '';
  }
}

customElements.define('flay-article', FlayArticle, { extends: 'div' });
