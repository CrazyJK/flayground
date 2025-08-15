import GroundFlay from '@base/GroundFlay';
import FlayMarker from '@flay/domain/FlayMarker';
import FlayFetch, { Flay } from '@lib/FlayFetch';
import { OpusProvider } from '@lib/OpusProvider';
import RandomUtils from '@lib/RandomUtils';
import StyleUtils from '@lib/StyleUtils';
import './FlayMarkerFloat.scss';

export class FlayMarkerFloat extends GroundFlay {
  #intervalIdOfMarker: number | undefined = undefined;
  #flayMarker = new FlayMarker();
  #opusProvider = new OpusProvider();

  connectedCallback(): void {
    this.appendChild(this.#flayMarker);
    this.#start();
  }

  disconnectedCallback(): void {
    this.#flayMarker.remove();
    clearInterval(this.#intervalIdOfMarker);
  }

  #start(): void {
    this.#updateMarker();
    this.#intervalIdOfMarker = window.setInterval(() => this.#updateMarker(), 1000 * 60); // Refresh every 1 minute
  }

  #updateMarker(): void {
    void this.#getRandomInfo().then(({ randomFlay, randomRem, randomX, randomY }) => {
      this.style.setProperty('--marker-size', `${randomRem}rem`);
      this.style.setProperty('--square-radius', `${randomRem * 0.25}rem`);
      this.style.setProperty('--shot-blur', `${randomRem * 3}rem`);
      this.style.setProperty('--shot-spread', `${randomRem * 0.25}rem`);

      this.#flayMarker.set(randomFlay, { tooltip: true, shape: 'square', cover: true });
      this.#flayMarker.style.left = `${randomX}px`;
      this.#flayMarker.style.top = `${randomY}px`;
    });
  }

  async #getRandomInfo(): Promise<{ randomFlay: Flay; randomRem: number; randomX: number; randomY: number }> {
    const randomOpus = await this.#opusProvider.getRandomOpus();
    const randomFlay = (await FlayFetch.getFlay(randomOpus))!;
    const maxRem = Math.max(6, randomFlay.video.likes?.length ?? 0); // Limit to 6 rems
    const randomRem = RandomUtils.getRandomIntInclusive(4, maxRem);
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
