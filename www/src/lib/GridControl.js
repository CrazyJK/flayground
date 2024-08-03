import './GridControl.scss';

import FlayStorage from '../util/FlayStorage';

export default class GridControl extends HTMLDivElement {
  constructor(selecters) {
    super();

    this.selecters = selecters;
    this.classList.add('grid-control');
    this.innerHTML = `<input type="range" min="1" max="5" step="1" value="5">`;
  }

  connectedCallback() {
    const GRID_CONTROL_KEY = 'grid-control' + location.pathname.replace(/\//g, '_');
    const containers = document.querySelectorAll(this.selecters);
    const range = this.querySelector('input');

    containers.forEach((container) => container.classList.add('grid-container'));
    range.addEventListener('change', () => {
      containers.forEach((container) => (container.dataset.column = range.value));
      FlayStorage.local.set(GRID_CONTROL_KEY, range.value);
    });
    range.value = FlayStorage.local.getNumber(GRID_CONTROL_KEY, 5);
    range.dispatchEvent(new Event('change'));
  }
}

customElements.define('grid-control', GridControl, { extends: 'div' });
