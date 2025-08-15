import GroundFlay from '@base/GroundFlay';
import FlayMarker, { SHAPES, ShapeType } from '@flay/domain/FlayMarker';
import FlayFetch, { Flay } from '@lib/FlayFetch';
import { OpusProvider } from '@lib/OpusProvider';
import RandomUtils from '@lib/RandomUtils';
import StyleUtils from '@lib/StyleUtils';
import './FlayMarkerFloat.scss';

export class FlayMarkerFloat extends GroundFlay {
  #intervalIdOfMarker: number | undefined = undefined;
  #intervalIdOfShape: number | undefined = undefined;
  #flayMarker = new FlayMarker();
  #opusProvider = new OpusProvider();

  connectedCallback(): void {
    this.appendChild(this.#flayMarker);
    this.#start();
  }

  disconnectedCallback(): void {
    this.#flayMarker.remove();
    clearInterval(this.#intervalIdOfMarker);
    clearInterval(this.#intervalIdOfShape);
  }

  #start(): void {
    this.#updateMarker();
    this.#intervalIdOfMarker = window.setInterval(() => this.#updateMarker(), 1000 * 60); // Refresh every 1 minute
    this.#intervalIdOfShape = window.setInterval(() => this.#updateShape(), 1000 * 10); // Change shape every 10 seconds
  }

  #updateMarker(): void {
    void this.#getRandomInfo().then(({ randomFlay, randomRem, randomX, randomY, shape }) => {
      this.style.setProperty('--marker-size', `${randomRem}rem`);
      this.style.setProperty('--shot-blur', `${randomRem * 0.75}rem`);
      this.style.setProperty('--shot-spread', `${randomRem * 0.5}rem`);
      this.style.setProperty('--square-radius', `${randomRem * 0.25}rem`);

      this.#flayMarker.set(randomFlay, { tooltip: true, shape: shape });
      this.#flayMarker.style.left = `${randomX}px`;
      this.#flayMarker.style.top = `${randomY}px`;
    });
  }

  #updateShape(): void {
    this.#flayMarker.setShape(this.#randomShape());
  }

  async #getRandomInfo(): Promise<{ randomFlay: Flay; randomRem: number; randomX: number; randomY: number; shape: ShapeType }> {
    const randomOpus = await this.#opusProvider.getRandomOpus();
    const randomFlay = (await FlayFetch.getFlay(randomOpus))!;
    const randomRem = RandomUtils.getRandomIntInclusive(2, 4); // 2 ~ 4 randomly select a size
    const [randomX, randomY] = this.#randomPosition(randomRem);
    const shape = this.#randomShape();
    return { randomFlay, randomRem, randomX, randomY, shape };
  }

  #randomPosition(rem: number): [number, number] {
    const [markerSize, edgeSize] = [StyleUtils.remToPx(rem), StyleUtils.remToPx(10)];
    const randomX = RandomUtils.getRandomInt(edgeSize, this.clientWidth - edgeSize * 2);
    const randomY = RandomUtils.getRandomInt(edgeSize, this.clientHeight - edgeSize * 2);
    return [Math.round(randomX - markerSize / 2), Math.round(randomY - markerSize / 2)]; // Center the marker
  }

  #randomShape(): ShapeType {
    return RandomUtils.getRandomElementFromArray(SHAPES);
  }
}

customElements.define('flay-marker-float', FlayMarkerFloat);
