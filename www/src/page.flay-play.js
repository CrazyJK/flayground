import './init/Page';
import './page.flay-play.scss';

import FlayMonitor from './flay/FlayMonitor';
import FlayVideoPlayer, { toTime } from './flay/FlayVideoPlayer';
import { FlayProvider } from './lib/FlayProvider';
import SVG from './svg/SVG';
import FlayStorage from './util/FlayStorage';
import { getRandomInt } from './util/randomNumber';

class Page extends FlayProvider {
  sec = 10;
  videoPlayer;
  isPaused = false;

  /** 최소 플레이 초 */
  MinPlayTime = 60 * 1;
  /** 최대 플레이 초 */
  MaxPlayTime = 60 * 5;

  constructor() {
    super();

    this.videoPlayer = document.querySelector('article').appendChild(new FlayVideoPlayer());
    this.progressBar = document.querySelector('.progress-bar');
    this.playRemainingTime = document.querySelector('#play-remaining-time');

    this.#initVideoControls();
    this.#initVideoVolume();
    this.#initVideoInfo();
    this.#initPlayNext();
    this.#initPauseNext();

    document.querySelector('footer').prepend(new FlayMonitor());
  }

  #initVideoControls() {
    this.videoControlsToggler = document.querySelector('#toggle-video-controls');
    this.videoControlsToggler.addEventListener('change', () => {
      this.videoPlayer.setAttribute('controls', this.videoControlsToggler.checked);
      FlayStorage.local.set('flay-play-video-control', this.videoControlsToggler.checked);
    });
    this.videoControlsToggler.checked = FlayStorage.local.getBoolean('flay-play-video-control', false);
    this.videoControlsToggler.dispatchEvent(new Event('change'));
  }

  #initVideoInfo() {
    this.videoInfoToggler = document.querySelector('#toggle-video-info');
    this.videoInfoToggler.addEventListener('change', () => {
      this.videoPlayer.setAttribute('info', this.videoInfoToggler.checked);
      FlayStorage.local.set('flay-play-video-info', this.videoInfoToggler.checked);
    });
    this.videoInfoToggler.checked = FlayStorage.local.getBoolean('flay-play-video-info', false);
    this.videoInfoToggler.dispatchEvent(new Event('change'));
  }

  #initVideoVolume() {
    document.querySelector('#video-volume-label').innerHTML = SVG.controls.volume;
    this.videoVolume = document.querySelector('#video-volume');
    this.videoVolume.addEventListener('change', () => {
      this.videoPlayer.setAttribute('volume', parseInt(this.videoVolume.value) / 100);
      FlayStorage.local.set('flay-play-video-volume', this.videoVolume.value);
    });
    this.videoVolume.value = FlayStorage.local.getNumber('flay-play-video-volume', 10);
    this.videoVolume.dispatchEvent(new Event('change'));
  }

  #initPlayNext() {
    this.playNextFlayBtn = document.querySelector('#play-next-flay');
    this.playNextFlayBtn.innerHTML = SVG.controls.nextTrack;
    this.playNextFlayBtn.addEventListener('click', () => this.play());
  }

  #initPauseNext() {
    this.pauseNextFlayBtn = document.querySelector('#pause-next-flay');
    this.pauseNextFlayBtn.innerHTML = SVG.controls.pause;
    this.pauseNextFlayBtn.addEventListener('click', () => this.pauseToggle());
  }

  #displayTime() {
    this.progressBar.style.width = (this.sec / this.MaxPlayTime) * 100 + '%';
    this.playRemainingTime.innerHTML = toTime(this.sec);
  }

  async play() {
    const { opus, flay, actress } = await this.random();

    document.title = `${opus} ${flay.title} ${flay.actressList.join(' ')}`;
    document.querySelector('main').style.backgroundImage = `url(/static/cover/${opus})`;

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

new Page().start().then(() => console.log('started'));
