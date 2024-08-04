import DateUtils from '../util/DateUtils';
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
        <dt><span class="studio"        ></span></dt>
        <dt><span class="opus"          ></span></dt>
        <dt><span class="title"         ></span></dt>
        <dt class="actress-wrap"></dt>
        <dt><span class="release"       ></span></dt>
        <dt><span class="tags"          ></span></dt>
        <dd><span class="rank"          ></span> <small>rank</small></dd>
        <dd><span class="play"          ></span> <small>play</small></dd>
        <dd><span class="shot"          ></span> <small>shot</small></dd>
        <dd><span class="comment"       ></span></dd>
        <dd><span class="jp-title"      ></span></dd>
        <dd><span class="jp-desc"       ></span></dd>
        <dd><span class="last-access"   ></span> <small>accessed</small></dd>
        <dd><span class="last-modified" ></span> <small>modified</small></dd>
        <dd><span class="last-play"     ></span> <small>played  </small></dd>
      </dl>
    `;

    this.querySelector('.cover').addEventListener('click', () => {
      window.open(`popup.cover.html?opus=${this.opus}`, `cover.${this.opus}`, 'width=800px,height=538px');
    });

    this.querySelector('.opus').addEventListener('click', () => {
      window.open('/flay/' + this.opus, this.opus, 'width=800px,height=1200px');
    });

    this.querySelector('.title').addEventListener('click', () => {
      window.open(`popup.flay.html?opus=${this.opus}`, `popup.${this.opus}`, 'width=800px,height=1280px');
    });

    this.querySelector('.actress-wrap').addEventListener('click', (e) => {
      const name = e.target.textContent;
      window.open('popup.actress.html?name=' + name, name, 'width=960px,height=1200px');
    });
  }

  set(flay, coverURL) {
    this.opus = flay.opus;

    this.querySelector('.cover').style.backgroundImage = `url(${coverURL ? coverURL : `/static/cover/${flay.opus}`})`;

    this.querySelector('.studio').innerHTML = flay.studio;
    this.querySelector('.opus').innerHTML = flay.opus;
    this.querySelector('.title').innerHTML = flay.title;
    this.querySelector('.actress-wrap').innerHTML = flay.actressList.map((name) => `<span>${name}</span>`).join(', ');
    this.querySelector('.release').innerHTML = flay.release;

    this.querySelector('.rank').innerHTML = StringUtils.toBlank(flay.video.rank);
    this.querySelector('.play').innerHTML = StringUtils.toBlank(flay.video.play);
    this.querySelector('.shot').innerHTML = StringUtils.toBlank(flay.video.likes?.length);
    this.querySelector('.tags').innerHTML = StringUtils.toBlank(flay.video.tags?.map((t) => t.name).join(', '));
    this.querySelector('.comment').innerHTML = StringUtils.toBlank(flay.video.comment);

    this.querySelector('.jp-title').innerHTML = StringUtils.toBlank(flay.video.title);
    this.querySelector('.jp-desc').innerHTML = StringUtils.toBlank(flay.video.desc);

    this.querySelector('.last-access').innerHTML = flay.video.lastAccess > 0 ? DateUtils.format(flay.video.lastAccess, 'yy.MM.dd') : '';
    this.querySelector('.last-modified').innerHTML = flay.video.lastModified > 0 ? DateUtils.format(flay.video.lastModified, 'yy.MM.dd') : '';
    this.querySelector('.last-play').innerHTML = flay.video.lastPlay > 0 ? DateUtils.format(flay.video.lastPlay, 'yy.MM.dd') : '';
  }
}

customElements.define('flay-article', FlayArticle, { extends: 'div' });
