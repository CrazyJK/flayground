import GroundFlay from '@base/GroundFlay';
import FlayMarker from '@flay/domain/FlayMarker';
import FlayFetch, { Flay } from '@lib/FlayFetch';
import { OpusProvider } from '@lib/OpusProvider';
import RandomUtils from '@lib/RandomUtils';
import StyleUtils from '@lib/StyleUtils';
import './FlayMarkerFloat.scss';

export class FlayMarkerFloat extends GroundFlay {
  #intervalIdOfMarker: number | undefined = undefined;
  #flayMarker: FlayMarker;
  #opusProvider: OpusProvider;

  constructor() {
    super();
    this.#flayMarker = new FlayMarker();
    this.#opusProvider = new OpusProvider();
  }

  connectedCallback(): void {
    this.appendChild(this.#flayMarker);
    this.#updateMarker();
    this.#intervalIdOfMarker = window.setInterval(() => this.#updateMarker(), 1000 * 60); // Refresh every 1 minute
  }

  disconnectedCallback(): void {
    this.#flayMarker.remove();
    clearInterval(this.#intervalIdOfMarker);
  }

  #updateMarker(): void {
    void this.#getRandomInfo().then(({ randomFlay, randomRem, randomX, randomY }) => {
      this.style.setProperty('--marker-size', `${randomRem}rem`);
      this.style.setProperty('--square-radius', `${randomRem * 0.25}rem`);

      this.#flayMarker.set(randomFlay, { tooltip: true, shape: FlayMarker.SHAPE.SQUARE, cover: true });
      this.#flayMarker.style.left = `${randomX}px`;
      this.#flayMarker.style.top = `${randomY}px`;

      this.dispatchEvent(new CustomEvent('changeFlay', { detail: { randomFlay, randomRem, randomX, randomY }, composed: true }));
    });
  }

  async #getRandomInfo(): Promise<{ randomFlay: Flay; randomRem: number; randomX: number; randomY: number }> {
    const randomOpus = await this.#opusProvider.getRandomOpus();
    const randomFlay = (await FlayFetch.getFlay(randomOpus))!;
    const rank = Math.max(0, randomFlay.video.rank) || 5;
    const shot = randomFlay.video.likes?.length ?? 0;
    const randomRem = rank + RandomUtils.getRandomIntInclusive(0, shot);
    const [randomX, randomY] = this.#randomPosition(randomRem);
    return { randomFlay, randomRem, randomX, randomY };
  }

  #randomPosition(rem: number): [number, number] {
    const [markerSize, edgeSize] = [StyleUtils.remToPx(rem), StyleUtils.remToPx(10)];
    const randomX = RandomUtils.getRandomInt(edgeSize, this.clientWidth - edgeSize * 2);
    const randomY = RandomUtils.getRandomInt(edgeSize, this.clientHeight - edgeSize * 2);
    return [Math.round(randomX - markerSize / 2), Math.round(randomY - markerSize / 2)]; // Center the marker
  }
}

customElements.define('flay-marker-float', FlayMarkerFloat);
