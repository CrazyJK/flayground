import FlayActress from '@flay/domain/part/FlayActress';
import FlayComment from '@flay/domain/part/FlayComment';
import FlayCover from '@flay/domain/part/FlayCover';
import FlayFiles from '@flay/domain/part/FlayFiles';
import FlayOpus from '@flay/domain/part/FlayOpus';
import FlayRank from '@flay/domain/part/FlayRank';
import FlayRelease from '@flay/domain/part/FlayRelease';
import FlayStudio from '@flay/domain/part/FlayStudio';
import FlayTag from '@flay/domain/part/FlayTag';
import FlayTitle from '@flay/domain/part/FlayTitle';
import FlayFetch, { Actress, Flay, FullyFlay } from '@lib/FlayFetch';
import './FlayPage.scss';

export default class FlayPage extends HTMLDivElement {
  flayStudio: FlayStudio;
  flayOpus: FlayOpus;
  flayComment: FlayComment;
  flayTitle: FlayTitle;
  flayCover: FlayCover;
  flayActress: FlayActress;
  flayRelease: FlayRelease;
  flayRank: FlayRank;
  flayFiles: FlayFiles;
  flayTag: FlayTag;

  opus: string;
  flay: Flay;
  actress: Actress[];

  constructor() {
    super();
    this.classList.add('flay-page', 'flay-div');
  }

  connectedCallback() {
    this.flayStudio = this.appendChild(new FlayStudio());
    this.flayOpus = this.appendChild(new FlayOpus());
    this.flayComment = this.appendChild(new FlayComment());
    this.flayTitle = this.appendChild(new FlayTitle());
    this.flayCover = this.appendChild(new FlayCover());
    this.flayActress = this.appendChild(new FlayActress());
    this.flayRelease = this.appendChild(new FlayRelease());
    this.flayRank = this.appendChild(new FlayRank());
    this.flayFiles = this.appendChild(new FlayFiles());
    this.flayTag = this.appendChild(new FlayTag());
  }

  /**
   * Flay 데이터를 설정하고 각 컴포넌트에 적용합니다.
   * @param opus 작품 번호
   * @param reload 데이터 재로드 여부
   * @returns Promise<FullyFlay> Flay와 Actress 데이터
   */
  async set(opus: string, reload: boolean): Promise<FullyFlay> {
    this.opus = opus;
    this.setAttribute('opus', opus);

    const { flay, actress } = await FlayFetch.getFullyFlay(opus);
    this.flay = flay;
    this.actress = actress;

    this.flayStudio.set(flay);
    this.flayOpus.set(flay);
    this.flayComment.set(flay);
    this.flayTitle.set(flay);
    this.flayCover.set(flay);
    this.flayActress.set(flay, actress);
    this.flayRelease.set(flay);
    this.flayRank.set(flay);
    this.flayFiles.set(flay);
    this.flayTag.set(flay, reload);

    return { flay, actress };
  }

  /**
   * 현재 설정된 작품 데이터를 다시 로드합니다.
   */
  reload(): void {
    if (this.opus) {
      this.set(this.opus, true);
    }
  }
}

customElements.define('flay-page', FlayPage, { extends: 'div' });
