import FlayFetch from '../../lib/FlayFetch';
import { getRandomInt, getRandomIntInclusive } from '../../lib/randomNumber';
import { addResizeListener } from '../../lib/windowAddEventListener';
import { EVENT_TIMER_END, EVENT_TIMER_START, EVENT_TIMER_TICK, TickTimer } from '../../ui/TickTimer';
import FlayMarker from '../domain/FlayMarker';
import './FlayMarkerPanel.scss';

export class FlayMarkerPanel extends HTMLDivElement {
  #timerID = 0;
  #maxX = 0;
  #maxY = 0;

  constructor() {
    super();
    this.classList.add('flay-marker-panel');

    this.timer = new TickTimer();
    this.timer.addEventListener(EVENT_TIMER_START, () => this.#render());
    this.timer.addEventListener(EVENT_TIMER_END, () => this.#start());
    this.timer.addEventListener(EVENT_TIMER_TICK, (e) => (this.dataset.seconds = e.detail.seconds));

    addResizeListener(() => this.#setRelativePositions());
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

    this.#stopMarker();

    document
      .startViewTransition(() => {
        this.append(...this.markerList);
      })
      .finished.then(() => {
        this.#setRelativePositions();
        this.#movingMarker();
      });
  }

  #setRelativePositions() {
    if (!this.markerList || this.markerList.length === 0) return;

    [this.#maxX, this.#maxY] = [0, 0];
    const firstMarker = this.markerList[0];
    const firstRect = firstMarker.getBoundingClientRect();
    this.markerList.forEach((marker, index) => {
      if (index === 0) {
        marker.dataset.xy = '0,0';
      } else {
        const rect = marker.getBoundingClientRect();
        const relativeX = (rect.left - firstRect.left) / firstRect.width;
        const relativeY = (rect.top - firstRect.top) / firstRect.height;
        marker.dataset.xy = `${relativeX},${relativeY}`;

        this.#maxX = Math.max(this.#maxX, relativeX);
        this.#maxY = Math.max(this.#maxY, relativeY);
      }
    });
  }

  #stopMarker() {
    clearInterval(this.#timerID);
    this.markerList.forEach((marker) => marker.classList.remove('highlight'));
  }

  #movingMarker() {
    const INTERVAL = 700;
    const DIRECTIONs = [
      [0, -1], // up
      [0, 1], // down
      [-1, 0], // left
      [1, 0], // right
      [-1, -1], // up-left
      [1, -1], // up-right
      [-1, 1], // down-left
      [1, 1], // down-right
    ];
    const highlightMarker = (marker) => {
      marker.classList.add('highlight');
      marker.animate([{ transform: 'scale(1.0)' }, { transform: 'scale(1.2)' }], { duration: INTERVAL });
      // setTimeout(() => marker.classList.remove('highlight'), INTERVAL * 10);
    };
    const getNextMarker = (x, y) => {
      const [dx, dy] = DIRECTIONs[getRandomInt(0, DIRECTIONs.length)];
      const nextX = Math.min(Math.max(x + dx, 0), this.#maxX);
      const nextY = Math.min(Math.max(y + dy, 0), this.#maxY);
      const nextMarker = this.markerList.find((marker) => marker.dataset.xy === `${nextX},${nextY}`);
      if (!nextMarker || nextMarker.classList.contains('highlight')) {
        return getNextMarker(nextX, nextY);
      } else {
        return nextMarker;
      }
    };

    const startMarker = this.markerList[getRandomInt(0, this.markerList.length)];
    let [x, y] = startMarker.dataset.xy.split(',').map(Number);
    highlightMarker(startMarker);

    this.#timerID = setInterval(() => {
      const marker = getNextMarker(x, y);
      [x, y] = marker.dataset.xy.split(',').map(Number);
      highlightMarker(marker);
    }, INTERVAL);
  }
}

customElements.define('flay-marker-panel', FlayMarkerPanel, { extends: 'div' });
