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
    const ORDERs = ['studio', 'opus', 'title', 'actress', 'release', 'random', 'rank', 'shot', 'play', 'modified'];
    this.dataset.order = ORDERs[getRandomInt(0, ORDERs.length)];
    this.markerList.sort((m1, m2) => {
      switch (this.dataset.order) {
        case ORDERs[0]:
          return m2.flay.studio.localeCompare(m1.flay.studio);
        case ORDERs[1]:
          return m2.flay.opus.localeCompare(m1.flay.opus);
        case ORDERs[2]:
          return m2.flay.title.localeCompare(m1.flay.title);
        case ORDERs[3]:
          return m2.flay.actressList.join(',').localeCompare(m1.flay.actressList.join(','));
        case ORDERs[4]:
          return m2.flay.release.localeCompare(m1.flay.release);
        case ORDERs[5]:
          return getRandomIntInclusive(-1, 1);
        case ORDERs[6]:
          return m2.flay.video.rank - m1.flay.video.rank;
        case ORDERs[7]:
          return (m2.flay.video.likes?.length || 0) - (m1.flay.video.likes?.length || 0);
        case ORDERs[8]:
          return m2.flay.video.play - m1.flay.video.play;
        case ORDERs[9]:
          return m2.flay.lastModified - m1.flay.lastModified;
      }
    });

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

    clearInterval(this.#timerID);
    this.markerList.forEach((marker) => marker.classList.remove('highlight'));

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
