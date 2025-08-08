import FlayStorage from '@lib/FlayStorage';
import './GridControl.scss';

const MAX = 7;
const MIN = 1;

export default class GridControl extends HTMLElement {
  constructor(selecters, max = MAX) {
    super();

    if (!selecters) {
      throw new Error('Selectors are required for GridControl');
    }

    this.selecters = selecters;
    this.max = Math.min(max, MAX);
    this.storageKey = null;

    this.dataset.max = this.max;
    this.classList.add('grid-control', 'flay-div');
    this.innerHTML = this.#createTemplate();
  }

  #createTemplate() {
    return `
      <input type="range"
        min="${MIN}"
        max="${this.max}"
        step="1"
        value="${this.max}"
        title="column size"
        aria-label="Grid columns"
        aria-valuemin="${MIN}"
        aria-valuemax="${this.max}"
        aria-valuenow="${this.max}">
      <label class="range-mark" data-value="${this.max}">${this.max}</label>
    `;
  }

  #updateGridLayout(value) {
    const rangeMark = this.querySelector('.range-mark');
    const containers = document.querySelectorAll(this.selecters);

    rangeMark.innerHTML = value;
    rangeMark.dataset.value = value;

    containers.forEach((container) => (container.dataset.column = value));

    if (this.storageKey) {
      FlayStorage.local.set(this.storageKey, value);
    }
  }

  #setupEventListeners() {
    const range = this.querySelector('input');
    range.addEventListener('input', (e) => {
      this.#updateGridLayout(e.target.value);
    });
  }

  #initializeFromStorage() {
    const range = this.querySelector('input');
    this.storageKey = 'grid-control' + location.pathname.replace(/\//g, '_');

    const savedValue = FlayStorage.local.getNumber(this.storageKey, this.max);
    range.value = Math.min(savedValue, this.max);

    // 초기 상태 설정
    this.#updateGridLayout(range.value);

    // ARIA 값도 업데이트
    range.setAttribute('aria-valuenow', range.value);
  }

  connectedCallback() {
    const containers = document.querySelectorAll(this.selecters);

    // 컨테이너 클래스 추가
    containers.forEach((container) => container.classList.add('grid-container'));

    // 이벤트 리스너 설정
    this.#setupEventListeners();

    // 저장된 값으로 초기화
    this.#initializeFromStorage();
  }

  disconnectedCallback() {
    // 메모리 누수 방지를 위한 정리 작업
    const range = this.querySelector('input');
    if (range) {
      range.removeEventListener('input', this.#updateGridLayout);
    }
  }
}

customElements.define('grid-control', GridControl);
