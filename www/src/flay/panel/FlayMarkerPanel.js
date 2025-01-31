import FlayFetch from '../../lib/FlayFetch';
import FlayMarker from '../domain/FlayMarker';
import './FlayMarkerPanel.scss';

export class FlayMarkerPanel extends HTMLDivElement {
  constructor() {
    super();
    this.classList.add('flay-marker-panel');
  }

  connectedCallback() {
    FlayFetch.getFlayList().then((list) => {
      this.append(...list.sort((f1, f2) => f2.release.localeCompare(f1.release)).map((flay) => new FlayMarker(flay)));
    });
  }
}

customElements.define('flay-marker-panel', FlayMarkerPanel, { extends: 'div' });
