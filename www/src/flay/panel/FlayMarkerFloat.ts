import GroundFlay from '@base/GroundFlay';
import FlayMarker from '@flay/domain/FlayMarker';
import FlayFetch, { Flay } from '@lib/FlayFetch';
import { OpusProvider } from '@lib/OpusProvider';
import RandomUtils from '@lib/RandomUtils';
import StyleUtils from '@lib/StyleUtils';
import './FlayMarkerFloat.scss';

export class FlayMarkerFloat extends GroundFlay {
  #intervalIdOfMarker: number | undefined = undefined;
  #intervalSeconds: number;
  #flayMarker: FlayMarker;
  #opusProvider: OpusProvider;

  constructor(intervalSeconds = 60) {
    super();

    this.#intervalSeconds = intervalSeconds;
    this.#flayMarker = new FlayMarker();
    this.#opusProvider = new OpusProvider();
  }

  connectedCallback(): void {
    this.appendChild(this.#flayMarker);
    this.#updateMarker();
    this.#intervalIdOfMarker = window.setInterval(() => this.#updateMarker(), 1000 * this.#intervalSeconds);
  }

  disconnectedCallback(): void {
    this.#flayMarker.remove();
    clearInterval(this.#intervalIdOfMarker);
  }

  #updateMarker(): void {
    void this.#getRandomInfo().then(({ randomFlay, randomRem, randomX, randomY }) => {
      this.style.setProperty('--marker-size', `${randomRem}rem`);
      this.style.setProperty('--square-radius', `${randomRem * 0.25}rem`);
      this.style.setProperty('--marker-x', `${randomX}%`);
      this.style.setProperty('--marker-y', `${randomY}%`);

      this.#flayMarker.set(randomFlay, { tooltip: true, shape: FlayMarker.SHAPE.SQUARE, cover: true });

      this.dispatchEvent(new CustomEvent('changeFlay', { detail: { randomFlay, randomRem, randomX, randomY }, composed: true }));
    });
  }

  async #getRandomInfo(): Promise<{ randomFlay: Flay; randomRem: number; randomX: number; randomY: number }> {
    const randomOpus = await this.#opusProvider.getRandomOpus();
    const randomFlay = (await FlayFetch.getFlay(randomOpus))!;
    const rank = Math.max(0, randomFlay.video.rank) || 5;
    const shot = randomFlay.video.likes?.length ?? 0;
    const randomRem = rank + RandomUtils.getRandomIntInclusive(0, shot) + 4;
    const [randomX, randomY] = this.#randomPosition(randomRem);
    return { randomFlay, randomRem, randomX, randomY };
  }

  #randomPosition(rem: number): [number, number] {
    const [markerSize, edgeSize] = [StyleUtils.remToPx(rem), StyleUtils.remToPx(10)];
    const markerSizePercent = (markerSize / this.clientWidth) * 100;
    const edgeSizePercent = (edgeSize / this.clientWidth) * 100;

    const randomX = RandomUtils.getRandomInt(edgeSizePercent, 100 - edgeSizePercent - markerSizePercent);
    const randomY = RandomUtils.getRandomInt(edgeSizePercent, 100 - edgeSizePercent - markerSizePercent);
    return [randomX, randomY];
  }
}

customElements.define('flay-marker-float', FlayMarkerFloat);
