import FlayDiv from '@base/FlayDiv';
import DateUtils from '@lib/DateUtils';
import FlayFetch, { BlankFlay, Flay } from '@lib/FlayFetch';
import { popupActress, popupFlay, popupFlayInfo } from '@lib/FlaySearch';
import StringUtils from '@lib/StringUtils';
import './FlayArticle.scss';

export default class FlayArticle extends FlayDiv {
  flay: Flay = BlankFlay;

  constructor(args: { mode?: string }) {
    super();
    if (args) {
      if (args.mode) this.classList.add(args.mode);
    }
  }

  connectedCallback() {
    this.innerHTML = `
      <div class="cover"></div>
      <dl>
        <dt class="studio"       ><span></span></dt>
        <dt class="opus"         ><span></span></dt>
        <dt class="title"        ><span></span></dt>
        <dt class="actress"      >             </dt>
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

    this.querySelector('.opus  span')!.addEventListener('click', () => popupFlayInfo(this.flay.opus));
    this.querySelector('.title span')!.addEventListener('click', () => popupFlay(this.flay.opus));
    this.querySelector('.cover')!.addEventListener('click', () => {
      if (!this.flay.archive)
        import(/* webpackChunkName: "FlayVideoPlayer" */ '@flay/panel/FlayVideoPlayer')
          .then((module) => module.playInLayer(this.flay.opus))
          .catch((err) => {
            console.error(err);
          });
    });
    this.querySelector('.actress')!.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'SPAN') popupActress(target.textContent!);
    });
  }

  set(flay: Flay): void {
    this.flay = flay;

    this.querySelector('.studio        span')!.innerHTML = flay.studio;
    this.querySelector('.opus          span')!.innerHTML = flay.opus;
    this.querySelector('.title         span')!.innerHTML = flay.title;
    this.querySelector('.actress           ')!.innerHTML = flay.actressList.map((name) => `<span>${name}</span>`).join('');
    this.querySelector('.release       span')!.innerHTML = flay.release;
    this.querySelector('.tags          span')!.innerHTML = toBlank(flay.video.tags?.map((tag) => tag.name).join(', '));
    this.querySelector('.rank          span')!.innerHTML = toBlank(flay.video.rank) + '<small>rank</small>';
    this.querySelector('.play          span')!.innerHTML = toBlank(flay.video.play) + '<small>play</small>';
    this.querySelector('.shot          span')!.innerHTML = toBlank(flay.video.likes?.length) + '<small>shot</small>';
    this.querySelector('.comment       span')!.innerHTML = toBlank(flay.video.comment);
    this.querySelector('.jp-title      span')!.innerHTML = toBlank(flay.video.title);
    this.querySelector('.jp-desc       span')!.innerHTML = toBlank(flay.video.desc);
    this.querySelector('.last-access   span')!.innerHTML = flay.video.lastAccess > 0 ? DateUtils.format(flay.video.lastAccess, 'yy.MM.dd') + '<small>accessed</small>' : '';
    this.querySelector('.last-modified span')!.innerHTML = flay.video.lastModified > 0 ? DateUtils.format(flay.video.lastModified, 'yy.MM.dd') + '<small>modified</small>' : '';
    this.querySelector('.last-play     span')!.innerHTML = flay.video.lastPlay > 0 ? DateUtils.format(flay.video.lastPlay, 'yy.MM.dd') + '<small>played</small>' : '';

    FlayFetch.getCoverURL(flay.opus)
      .then((url) => {
        const cover = this.querySelector('.cover') as HTMLDivElement;
        cover.style.backgroundImage = `url(${url})`;
      })
      .catch((error: unknown) => {
        console.error(error);
      });
  }
}

customElements.define('flay-article', FlayArticle);

function toBlank(text: string | null | undefined | number, def = ''): string {
  if (typeof text === 'number') text = String(text);
  return StringUtils.isBlank(text) ? def : (text as string);
}
