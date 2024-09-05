import './init/Page';
import './page.flay-play.scss';

import { FlayProvider } from './lib/FlayProvider';
import SVGbasket from './svg/basket.svg';
import SVGcontrolsNextTrack from './svg/controls_nextTrack.svg';
import SVGcontrolsPause from './svg/controls_pause.svg';
import SVGcontrolsVolume from './svg/controls_volume.svg';
import FlayStorage from './util/FlayStorage';
import { getRandomInt } from './util/randomNumber';

/** 최소 플레이 초 */
const MinPlayTime = 60 * 2;
/** 최대 플레이 초 */
const MaxPlayTime = 60 * 5;

class App extends FlayProvider {
  sec = 10;
  isPaused = false;

  constructor(opts) {
    super(opts);

    document.querySelector('#play-next-flay').innerHTML = SVGcontrolsNextTrack;
    document.querySelector('[for="pause-video"]').innerHTML = SVGcontrolsPause;
    document.querySelector('[for="video-volume"]').innerHTML = SVGcontrolsVolume;

    this.videoPlayer = document.querySelector('article').appendChild(new FlayVideoPlayer());

    this.progressBar = document.querySelector('.progress-bar');
    this.remainingTimeCheck = document.querySelector('#toggle-remaining-time');
    this.remainingTime = document.querySelector('[for="toggle-remaining-time"]');
    this.pauseVideo = document.querySelector('#pause-video');
    this.videoVolume = document.querySelector('#video-volume');

    this.#initControl(); // 재생 컨트롤 보일지 여부
    this.#initInfo(); // Flay 정보 보일지 여부
    this.#initCover(); // Flay 포스터 보일지 여부
    this.#initRemainingTime(); // 재생 남은 시간 멈출지 여부
    this.#initNextFlay(); // 다음 Flay로 넘어갈지 여부
    this.#initPause(); // 비디오 재생 멈출지
    this.#initVolume(); // 볼륨 조정
    this.#initKeepFlay(); // Flay 보관

    this.videoPlayer.addEventListener('play', (e) => {
      console.debug(e.type, e.detail.isPlay);
      this.pauseVideo.checked = !e.detail.isPlay;
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

  #initCover() {
    const videoPosterToggler = document.querySelector('#toggle-video-poster');
    videoPosterToggler.addEventListener('change', (e) => {
      this.videoPlayer.setAttribute('poster', e.target.checked);
      FlayStorage.local.set('flay-play-video-poster', e.target.checked);
    });
    videoPosterToggler.checked = FlayStorage.local.getBoolean('flay-play-video-poster', false);
    videoPosterToggler.dispatchEvent(new Event('change'));
  }

  #initRemainingTime() {
    this.remainingTimeCheck.addEventListener('change', (e) => (this.isPaused = !e.target.checked));
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

  #initKeepFlay() {
    document.querySelector('#keepFlay').innerHTML = SVGbasket;
    document.querySelector('#keepFlay').addEventListener('click', async () => {
      const { FlayBasket } = await import(/* webpackChunkName: "FlayBasket" */ './flay/FlayBasket');
      FlayBasket.add(this.videoPlayer.opus);
    });
  }

  #displayTime() {
    this.progressBar.style.width = (this.sec / MaxPlayTime) * 100 + '%';
    this.remainingTime.innerHTML = toTime(this.sec);
  }

  async play() {
    const { opus, flay, actress } = await this.random();

    try {
      await this.videoPlayer.load(opus, flay, actress);
      console.log('videoPlayer is loaded', opus);

      const seekTime = await this.videoPlayer.playRandomSeekOrContinuously(MaxPlayTime);
      console.log('videoPlayer is seeked', toTime(this.videoPlayer.currentTime));

      this.sec = getRandomInt(MinPlayTime, Math.min(this.videoPlayer.duration - seekTime, MaxPlayTime));
      console.log('videoPlayer will be played for', toTime(this.sec));

      this.#displayTime();

      this.isPaused = false;
      this.remainingTimeCheck.checked = true;
      this.pauseVideo.checked = false;
    } catch (e) {
      this.sec = 10;
      const message = `play Error ${e.message}. retry in ${this.sec}s`;
      console.error(message, e);
      window.emitNotice(message);
    }
  }

  async start() {
    await this.play();

    setInterval(async () => {
      if (this.isPaused) return;

      --this.sec;
      this.#displayTime();

      if (this.sec === 0) {
        this.sec = MaxPlayTime;
        this.#displayTime();

        await this.play();
      }
    }, 1000);
  }
}

let toTime;
let FlayVideoPlayer;
import(/* webpackChunkName: "FlayVideoPlayer" */ './flay/FlayVideoPlayer').then((module) => {
  FlayVideoPlayer = module.FlayVideoPlayer;
  toTime = module.toTime;
  new App().start().then(() => console.log('started'));
});
