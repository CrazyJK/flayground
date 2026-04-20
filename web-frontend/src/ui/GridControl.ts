import GroundUI from '@base/GroundUI';
import FlayStorage from '@lib/FlayStorage';
import './GridControl.scss';

const MAX = 7;
const MIN = 1;

export default class GridControl extends GroundUI {
  private readonly selectors: string;
  private readonly max: number;
  private readonly storageKey: string;
  private range: HTMLInputElement;
  private rangeMark: HTMLLabelElement;
  private rangeHandler: (e: Event) => void;
  private containers: HTMLElement[] = [];

  constructor(selectors: string, max = MAX) {
    super();

    if (!selectors) {
      throw new Error('Selectors are required for GridControl');
    }

    this.selectors = selectors;
    this.max = Math.min(max, MAX);
    this.storageKey = 'grid-control' + location.pathname.replace(/\//g, '_');

    this.dataset.max = this.max.toString();
    this.innerHTML = `
      <input type="range"
        min="${MIN}"
        max="${this.max}"
        step="1"
        value="${this.max}"
        title="column size">
      <label class="range-mark" data-value="${this.max}">${this.max}</label>
    `;

    this.range = this.querySelector('input[type="range"]')!;
    this.rangeMark = this.querySelector('.range-mark')!;
    this.rangeHandler = () => {
      this.containers.forEach((container) => (container.dataset.column = this.range.value));
      this.rangeMark.innerHTML = this.range.value;
      this.rangeMark.dataset.value = this.range.value;

      FlayStorage.local.set(this.storageKey, this.range.value);
    };
  }

  connectedCallback() {
    this.containers = Array.from(document.querySelectorAll(this.selectors));
    this.containers.forEach((container) => container.classList.add('grid-container'));
    this.range.value = Math.min(FlayStorage.local.getNumber(this.storageKey, this.max), this.max).toString();
    this.range.addEventListener('input', this.rangeHandler);
    this.range.dispatchEvent(new Event('input'));
  }

  disconnectedCallback() {
    this.range.removeEventListener('input', this.rangeHandler);
  }
}

customElements.define('grid-control', GridControl);
