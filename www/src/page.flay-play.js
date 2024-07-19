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

    document.querySelector('#play-next-flay').innerHTML = SVG.controls.nextTrack;
    document.querySelector('[for="pause-video"]').innerHTML = SVG.controls.pause;
    document.querySelector('[for="video-volume"]').innerHTML = SVG.controls.volume;

    this.flayCoverImage = document.querySelector('body').appendChild(new FlayCoverImage());
    this.videoPlayer = document.querySelector('article').appendChild(new FlayVideoPlayer());

    this.progressBar = document.querySelector('.progress-bar');
    this.remainingTime = document.querySelector('[for="toggle-remaining-time"]');
    this.pauseVideo = document.querySelector('#pause-video');
    this.videoVolume = document.querySelector('#video-volume');

    this.#initControl(); // 재생 컨트롤 보일지 여부
    this.#initInfo(); // Flay 정보 보일지 여부
    this.#initRemainingTime(); // 재생 남은 시간 멈출지 여부
    this.#initNextFlay(); // 다음 Flay로 넘어갈지 여부
    this.#initPause(); // 비디오 재생 멈출지
    this.#initVolume(); // 볼륨 조정

    this.videoPlayer.addEventListener('play', (e) => {
      console.debug(e.type, e.detail.status);
      this.pauseVideo.checked = !e.detail.status;
    });

    this.videoPlayer.addEventListener('volume', (e) => {
      console.debug(e.type, e.detail.volume);
      this.videoVolume.value = e.detail.volume * 100;
      FlayStorage.local.set('flay-play-video-volume', e.detail.volume * 100);
    });
  }

  #initControl() {
    const videoControlsToggler = document.querySelector('#toggle-video-controls');
    videoControlsToggler.addEventListener('change', (e) => {
      this.videoPlayer.setAttribute('controls', e.target.checked);
      FlayStorage.local.set('flay-play-video-control', e.target.checked);
    });
    videoControlsToggler.checked = FlayStorage.local.getBoolean('flay-play-video-control', false);
    videoControlsToggler.dispatchEvent(new Event('change'));
  }

  #initInfo() {
    const videoInfoToggler = document.querySelector('#toggle-video-info');
    videoInfoToggler.addEventListener('change', (e) => {
      this.videoPlayer.setAttribute('info', e.target.checked);
      FlayStorage.local.set('flay-play-video-info', e.target.checked);
    });
    videoInfoToggler.checked = FlayStorage.local.getBoolean('flay-play-video-info', false);
    videoInfoToggler.dispatchEvent(new Event('change'));
  }

  #initRemainingTime() {
    document.querySelector('#toggle-remaining-time').addEventListener('change', (e) => (this.isPaused = !e.target.checked));
  }

  #initNextFlay() {
    document.querySelector('#play-next-flay').addEventListener('click', () => this.play());
  }

  #initPause() {
    this.pauseVideo.addEventListener('change', (e) => (e.target.checked ? this.videoPlayer.pause() : this.videoPlayer.play()));
  }

  #initVolume() {
    this.videoVolume.addEventListener('change', (e) => {
      this.videoPlayer.setAttribute('volume', parseInt(e.target.value) / 100);
      FlayStorage.local.set('flay-play-video-volume', e.target.value);
    });
    this.videoVolume.value = FlayStorage.local.getNumber('flay-play-video-volume', 10);
    this.videoVolume.dispatchEvent(new Event('change'));
  }

  #displayTime() {
    this.progressBar.style.width = (this.sec / this.MaxPlayTime) * 100 + '%';
    this.remainingTime.innerHTML = toTime(this.sec);
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
      console.log('videoPlayer will be played for', toTime(this.sec));

      this.#displayTime();

      this.isPaused = false;
      this.pauseVideo.checked = false;
    } catch (e) {
      this.sec = 10;
      console.error('play Error', e.message, `retry in ${this.sec}s`);
    }
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
      { duration: 800, iterations: 1, easing: 'cubic-bezier(0.42, 0, 0.58, 1)' }
    );
  }
}

customElements.define('flay-cover-image', FlayCoverImage, { extends: 'div' });

new App().start().then(() => console.log('started'));
