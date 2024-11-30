import DateUtils from '../../lib/DateUtils';
import FlayMarker from '../domain/FlayMarker';
import './VideoDatePanel.scss';

export default class VideoDatePanel extends HTMLDivElement {
  constructor(flayList) {
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

  #show(e) {
    const mode = e.target.value;
    const getDate = (flay) => {
      switch (mode) {
        case 'P':
          return flay.video.lastPlay;
        case 'A':
          return flay.video.lastAccess;
        case 'VM':
          return flay.video.lastModified;
        case 'FM':
          return flay.lastModified;
      }
    };

    const mmList = Array.from({ length: 12 }).map((v, i) => String(i + 1).padStart(2, 0));
    const displayWrap = this.querySelector('.display-wrap');
    displayWrap.textContent = null;

    this.flayList
      .filter((flay) => flay.video.rank > 0)
      .sort((f1, f2) => getDate(f2) - getDate(f1))
      .forEach((flay) => {
        const [yyyy, mm] = DateUtils.format(getDate(flay), 'yyyy-MM').split('-');
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

        this.querySelector(`#M${unknownY ? 'unknown' : yyyy + mm}`).append(new FlayMarker(flay));
      });
  }
}

customElements.define('video-date-panel', VideoDatePanel, { extends: 'div' });
