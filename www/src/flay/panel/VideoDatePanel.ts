import FlayMarker from '@flay/domain/FlayMarker';
import FlayDiv from '@flay/FlayDiv';
import DateUtils from '@lib/DateUtils';
import { Flay } from '../../lib/FlayFetch';
import './VideoDatePanel.scss';

/**
 * 비디오 날짜별 패널 컴포넌트
 *
 * 플레이, 접근, 수정 날짜 기준으로 비디오 목록을 년/월별로 그룹화하여 표시하는 웹 컴포넌트입니다.
 * 다양한 날짜 모드를 지원하며, 각 모드에 따라 정렬 및 필터링된 결과를 보여줍니다.
 */
export default class VideoDatePanel extends FlayDiv {
  /** 표시할 Flay 목록 */
  flayList: Flay[];

  /**
   * VideoDatePanel 생성자
   * @param flayList - 표시할 Flay 객체 배열
   */
  constructor(flayList: Flay[]) {
    super();

    this.flayList = flayList;
    this.classList.add('video-date-panel');
    this.innerHTML = `
      <div class="mode-select">
        <button type="button" value="P" id="lastPlay">Play</button>
        <button type="button" value="A" id="lastAccess">Access</button>
        <button type="button" value="VM" id="lastModified">Modified(V)</button>
        <button type="button" value="FM" id="lastModified">Modified(F)</button>
      </div>
      <div class="display-wrap"></div>
    `;

    this.querySelectorAll('button').forEach((button) => button.addEventListener('click', (e) => this.#show(e)));
  }

  /**
   * 선택된 모드에 따라 날짜별 비디오 목록을 표시합니다.
   * @param e - 클릭 이벤트 객체
   */
  #show(e: Event): void {
    const target = e.target as HTMLButtonElement;
    const mode = target.value;
    const getDate = (flay: Flay): number => {
      switch (mode) {
        case 'P':
          return flay.video.lastPlay;
        case 'A':
          return flay.video.lastAccess;
        case 'VM':
          return flay.video.lastModified;
        case 'FM':
          return flay.lastModified;
        default:
          return 0;
      }
    };

    const mmList = Array.from({ length: 12 }).map((_, i) => String(i + 1).padStart(2, '0'));
    const displayWrap = this.querySelector('.display-wrap');

    if (!displayWrap) return;

    displayWrap.textContent = null;

    this.flayList
      .filter((flay) => flay.video.rank > 0)
      .sort((f1, f2) => (getDate(f2) ?? 0) - (getDate(f1) ?? 0))
      .forEach((flay) => {
        const dateStr = DateUtils.format(getDate(flay), 'yyyy-MM');
        const [yyyy, mm] = dateStr?.split('-') ?? ['0000', '00'];

        if (!yyyy || !mm) return;

        const unknownY = ['0000', '1970'].includes(yyyy);

        let $yyyy = displayWrap.querySelector('#Y' + yyyy);
        if ($yyyy === null) {
          $yyyy = displayWrap.appendChild(document.createElement('div'));
          $yyyy.id = 'Y' + yyyy;
          $yyyy.innerHTML = `
            <h5>${yyyy}</h5>
            <div class="${unknownY ? 'unknown-date' : ''}">
              ${unknownY ? `<fieldset><legend>unknown</legend><div id="Munknown"></div></fieldset>` : mmList.map((mm) => `<fieldset><legend>${mm}</legend><div id="M${yyyy}${mm}"></div></fieldset>`).join('')}
            </div>`;
        }

        const targetElement = this.querySelector(`#M${unknownY ? 'unknown' : yyyy + mm}`);
        if (targetElement) {
          targetElement.append(new FlayMarker(flay));
        }
      });
  }
}

customElements.define('video-date-panel', VideoDatePanel);
