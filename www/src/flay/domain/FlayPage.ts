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
import FlayFetch, { Actress, BlankFlay, Flay, FullyFlay } from '@lib/FlayFetch';
import './FlayPage.scss';

export default class FlayPage extends HTMLElement {
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
    this.classList.add('flay-div');

    this.opus = '';
    this.flay = BlankFlay;
    this.actress = [];

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
  async set(data: string | FullyFlay, reload: boolean = false): Promise<FullyFlay> {
    if (typeof data === 'string') {
      this.opus = data;
      const fullFlay = await FlayFetch.getFullyFlay(data);
      if (!fullFlay) {
        throw new Error(`Flay not found for opus: ${data}`);
      }
      const { flay, actress } = fullFlay;
      this.flay = flay;
      this.actress = actress;
    } else {
      this.opus = data.flay.opus;
      this.flay = data.flay;
      this.actress = data.actress;
    }

    this.setAttribute('opus', this.opus);

    this.flayStudio.set(this.flay);
    this.flayOpus.set(this.flay);
    this.flayComment.set(this.flay);
    this.flayTitle.set(this.flay);
    this.flayCover.set(this.flay);
    this.flayActress.set(this.flay, this.actress);
    this.flayRelease.set(this.flay);
    this.flayRank.set(this.flay);
    this.flayFiles.set(this.flay);
    this.flayTag.set(this.flay, reload);

    return { flay: this.flay, actress: this.actress };
  }

  /**
   * 현재 설정된 작품 데이터를 다시 로드합니다.
   */
  reload(): void {
    if (this.opus) {
      this.set(this.opus, true).catch((error: unknown) => {
        console.error('Error reloading FlayPage:', error);
      });
    }
  }
}

customElements.define('flay-page', FlayPage);
