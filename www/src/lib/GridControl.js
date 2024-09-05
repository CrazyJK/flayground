import './GridControl.scss';

import FlayStorage from '../util/FlayStorage';

const MAX = 7;

export default class GridControl extends HTMLDivElement {
  constructor(selecters, max = MAX) {
    super();

    this.selecters = selecters;
    this.max = Math.min(max, MAX);

    this.dataset.max = this.max;
    this.classList.add('grid-control');
    this.innerHTML = `
      <input type="range" min="1" max="${this.max}" step="1" value="${this.max}">
      <label class="range-mark" data-value="${this.max}">${this.max}</label>
    `;
  }

  connectedCallback() {
    const GRID_CONTROL_KEY = 'grid-control' + location.pathname.replace(/\//g, '_');
    const containers = document.querySelectorAll(this.selecters);
    const range = this.querySelector('input');
    const rangeMark = this.querySelector('.range-mark');

    containers.forEach((container) => container.classList.add('grid-container'));
    range.addEventListener('change', () => {
      rangeMark.innerHTML = range.value;
      rangeMark.dataset.value = range.value;
      containers.forEach((container) => (container.dataset.column = range.value));
      FlayStorage.local.set(GRID_CONTROL_KEY, range.value);
    });
    range.value = Math.min(FlayStorage.local.getNumber(GRID_CONTROL_KEY, this.max), this.max);
    range.dispatchEvent(new Event('change'));
  }
}

customElements.define('grid-control', GridControl, { extends: 'div' });
