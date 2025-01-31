import FlayFetch from '../../lib/FlayFetch';
import { getRandomIntInclusive } from '../../lib/randomNumber';
import { EVENT_TIMER_END, EVENT_TIMER_START, EVENT_TIMER_TICK, TickTimer } from '../../ui/TickTimer';
import FlayMarker from '../domain/FlayMarker';
import './FlayMarkerPanel.scss';

export class FlayMarkerPanel extends HTMLDivElement {
  constructor() {
    super();
    this.classList.add('flay-marker-panel');

    this.timer = new TickTimer();
    this.timer.addEventListener(EVENT_TIMER_START, () => document.startViewTransition(() => this.#render()));
    this.timer.addEventListener(EVENT_TIMER_END, () => this.#start());
    this.timer.addEventListener(EVENT_TIMER_TICK, (e) => (this.dataset.seconds = e.detail.seconds));
  }

  connectedCallback() {
    FlayFetch.getFlayList().then((list) => {
      this.markerList = list.map((flay) => new FlayMarker(flay, { showTitle: false }));
      this.#start();
    });
  }

  #start() {
    this.timer.start(getRandomIntInclusive(50, 70));
  }

  #render() {
    switch (getRandomIntInclusive(0, 5)) {
      case 0:
        this.dataset.order = 'studio';
        this.markerList.sort((m1, m2) => m2.flay.studio.localeCompare(m1.flay.studio));
        break;
      case 1:
        this.dataset.order = 'opus';
        this.markerList.sort((m1, m2) => m2.flay.opus.localeCompare(m1.flay.opus));
        break;
      case 2:
        this.dataset.order = 'title';
        this.markerList.sort((m1, m2) => m2.flay.title.localeCompare(m1.flay.title));
        break;
      case 3:
        this.dataset.order = 'actress';
        this.markerList.sort((m1, m2) => m2.flay.actressList.join(',').localeCompare(m1.flay.actressList.join(',')));
        break;
      case 4:
        this.dataset.order = 'release';
        this.markerList.sort((m1, m2) => m2.flay.release.localeCompare(m1.flay.release));
        break;
      case 5:
        this.dataset.order = 'random';
        for (let i = this.markerList.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [this.markerList[i], this.markerList[j]] = [this.markerList[j], this.markerList[i]];
        }
        break;
    }
    this.textContent = '';
    this.append(...this.markerList);
  }
}

customElements.define('flay-marker-panel', FlayMarkerPanel, { extends: 'div' });
