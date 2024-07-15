import './init/Page';
import './page.flay-play.scss';

import FlayVideoPlayer, { toTime } from './flay/FlayVideoPlayer';
import { FlayProvider } from './lib/FlayProvider';
import SVG from './svg/SVG';
import FlayStorage from './util/FlayStorage';
import { getRandomInt } from './util/randomNumber';

class App extends FlayProvider {
  sec = 10;
  videoPlayer;
  isPaused = false;

  /** 최소 플레이 초 */
  MinPlayTime = 60 * 1;
  /** 최대 플레이 초 */
  MaxPlayTime = 60 * 5;

  constructor() {
    super();

    this.flayCoverImage = document.querySelector('body').appendChild(new FlayCoverImage());
    this.videoPlayer = document.querySelector('article').appendChild(new FlayVideoPlayer());
    this.progressBar = document.querySelector('.progress-bar');
    this.playRemainingTime = document.querySelector('#play-remaining-time');

    const videoControlsToggler = document.querySelector('#toggle-video-controls');
    videoControlsToggler.addEventListener('change', () => {
      this.videoPlayer.setAttribute('controls', videoControlsToggler.checked);
      FlayStorage.local.set('flay-play-video-control', videoControlsToggler.checked);
    });
    videoControlsToggler.checked = FlayStorage.local.getBoolean('flay-play-video-control', false);
    videoControlsToggler.dispatchEvent(new Event('change'));

    const videoInfoToggler = document.querySelector('#toggle-video-info');
    videoInfoToggler.addEventListener('change', () => {
      this.videoPlayer.setAttribute('info', videoInfoToggler.checked);
      FlayStorage.local.set('flay-play-video-info', videoInfoToggler.checked);
    });
    videoInfoToggler.checked = FlayStorage.local.getBoolean('flay-play-video-info', false);
    videoInfoToggler.dispatchEvent(new Event('change'));

    const playNextFlayBtn = document.querySelector('#play-next-flay');
    playNextFlayBtn.innerHTML = SVG.controls.nextTrack;
    playNextFlayBtn.addEventListener('click', () => this.play());

    this.pauseNextFlayBtn = document.querySelector('#pause-next-flay');
    this.pauseNextFlayBtn.innerHTML = SVG.controls.pause;
    this.pauseNextFlayBtn.addEventListener('click', () => this.pauseToggle());

    document.querySelector('#video-volume-label').innerHTML = SVG.controls.volume;
    const videoVolume = document.querySelector('#video-volume');
    videoVolume.addEventListener('change', () => {
      this.videoPlayer.setAttribute('volume', parseInt(videoVolume.value) / 100);
      FlayStorage.local.set('flay-play-video-volume', videoVolume.value);
    });
    videoVolume.value = FlayStorage.local.getNumber('flay-play-video-volume', 10);
    videoVolume.dispatchEvent(new Event('change'));
  }

  #displayTime() {
    this.progressBar.style.width = (this.sec / this.MaxPlayTime) * 100 + '%';
    this.playRemainingTime.innerHTML = toTime(this.sec);
  }

  async play() {
    const { opus, flay, actress } = await this.random();

    document.title = `${opus} ${flay.title} ${flay.actressList.join(' ')}`;

    this.flayCoverImage.set(opus);

    try {
      await this.videoPlayer.set(opus, flay, actress);
      console.log('videoPlayer is setted', opus);

      const totalTime = this.videoPlayer.getDuration();
      const seekTime = getRandomInt(1, totalTime - this.MaxPlayTime);

      await this.videoPlayer.seek(seekTime);
      console.log('videoPlayer is seeked', toTime(seekTime));

      this.sec = getRandomInt(this.MinPlayTime, Math.min(totalTime - seekTime, this.MaxPlayTime));
      this.#displayTime();
      console.log('videoPlayer will be played for', toTime(this.sec));
    } catch (e) {
      this.sec = 10;
      console.error('play Error', e.message, `retry in ${this.sec}s`);
    }

    this.pauseToggle(false);
  }

  pauseToggle(force = null) {
    this.isPaused = force !== null ? force : !this.isPaused;
    this.pauseNextFlayBtn.classList.toggle('active', this.isPaused);
  }

  async start() {
    await this.play();

    setInterval(async () => {
      if (this.isPaused) return;

      --this.sec;
      this.#displayTime();

      if (this.sec === 0) {
        this.sec = this.MaxPlayTime;
        this.#displayTime();

        await this.play();
      }
    }, 1000);
  }
}

class FlayCoverImage extends HTMLDivElement {
  constructor() {
    super();
    this.classList.add('flay-cover-image');
  }

  connectedCallback() {
    this.style.aspectRatio = 'var(--cover-aspect-ratio)';
    this.style.background = 'transparent no-repeat center / cover';
    this.style.boxShadow = 'inset 0 0 1rem 0.5rem var(--color-bg-hover)';
    this.style.borderRadius = '0.25rem';
    this.style.margin = '1rem auto';
    this.style.width = 'min(100%, 800px)';
    this.style.zIndex = -1;
  }

  set(opus) {
    this.style.backgroundImage = `url(/static/cover/${opus})`;
    this.animate(
      [
        { transform: 'scale(0)', opacity: 0 },
        { transform: 'scale(1)', opacity: 1 },
      ],
      { duration: 800, iterations: 1 }
    );
  }
}

customElements.define('flay-cover-image', FlayCoverImage, { extends: 'div' });

new App().start().then(() => console.log('started'));
