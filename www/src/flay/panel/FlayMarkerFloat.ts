import FlayMarker, { ShapeType } from '@flay/domain/FlayMarker';
import FlayFetch, { Flay } from '@lib/FlayFetch';
import StyleUtils from '@lib/StyleUtils';
import './FlayMarkerFloat.scss';

export class FlayMarkerFloat extends HTMLDivElement {
  #flayMarker: FlayMarker | null = null;
  #opusList: string[] = [];
  #intervalIdOfMarker: number | null = null;
  #intervalIdOfShape: number | null = null;

  constructor() {
    super();
    this.classList.add('flay-marker-float');
  }

  connectedCallback(): void {
    this.#start();
  }

  disconnectedCallback(): void {
    clearInterval(this.#intervalIdOfMarker);
    clearInterval(this.#intervalIdOfShape);
    this.querySelectorAll('.flay-marker').forEach((marker) => marker.remove());
  }

  async #start(): Promise<void> {
    this.#opusList = await FlayFetch.getOpusList({});
    this.#flayMarker = new FlayMarker(null, {});
    this.appendChild(this.#flayMarker);
    await this.#updateMarker();
    this.#intervalIdOfMarker = window.setInterval(() => this.#updateMarker(), 1000 * 60); // Refresh every 1 minute
    this.#intervalIdOfShape = window.setInterval(() => this.#updateShape(), 1000 * 10); // Change shape every 10 seconds
  }

  async #updateMarker(): Promise<void> {
    const { randomFlay, randomRem, randomX, randomY, shape } = await this.#getRandomInfo();
    this.#flayMarker.set(randomFlay, { tooltip: true, shape: shape });
    this.#flayMarker.style.left = `${randomX}px`;
    this.#flayMarker.style.top = `${randomY}px`;
    this.#flayMarker.style.width = `${randomRem}rem`;
    this.#flayMarker.style.height = `${randomRem}rem`;
  }

  #updateShape(): void {
    this.#flayMarker.setShape(this.#randomShape());
  }

  async #getRandomInfo(): Promise<{ randomFlay: Flay; randomRem: number; randomX: number; randomY: number; shape: ShapeType }> {
    const randomIndex = Math.floor(Math.random() * this.#opusList.length);
    const randomOpus = this.#opusList[randomIndex];
    const randomFlay = await FlayFetch.getFlay(randomOpus);
    const randomRem = Math.floor(Math.random() * 3) + 2; // 2 ~ 4 randomly select a size
    const [randomX, randomY] = this.#randomPosition(randomRem);
    const shape = this.#randomShape();
    return { randomFlay, randomRem, randomX, randomY, shape };
  }

  #randomPosition(rem: number): [number, number] {
    const widthPx = StyleUtils.remToPx(rem); // Marker width
    const excludesPx = StyleUtils.remToPx(10); // 10rem in pixels
    const randomX = Math.random() * (this.clientWidth - excludesPx * 2) + excludesPx;
    const randomY = Math.random() * (this.clientHeight - excludesPx * 2) + excludesPx;
    return [Math.round(randomX - widthPx / 2), Math.round(randomY - widthPx / 2)]; // Center the marker
  }

  #randomShape(): ShapeType {
    return ['square', 'circle', 'star', 'heart', 'rhombus'][Math.floor(Math.random() * 5)] as ShapeType;
  }
}

customElements.define('flay-marker-float', FlayMarkerFloat, { extends: 'div' });
