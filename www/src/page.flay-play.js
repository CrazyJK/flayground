import './init/Page';
import './page.flay-play.scss';

import FlayVideoPlayer, { toTime } from './flay/part/FlayVideoPlayer';
import { FlayProvider } from './lib/FlayProvider';
import SVG from './svg/SVG';
import FlayStorage from './util/FlayStorage';
import { getRandomInt } from './util/randomNumber';

class Page extends FlayProvider {
  sec = 10;
  videoPlayer;

  /** 최소 플레이 초 */
  MinPlayTime = 60 * 1;
  /** 최대 플레이 초 */
  MaxPlayTime = 60 * 5;

  constructor() {
    super();

    this.videoPlayer = document.querySelector('article').appendChild(new FlayVideoPlayer());
    this.progressBar = document.querySelector('.progress-bar');
    this.videoRemainingTime = document.querySelector('.video-remaining-time');

    this.#initVideoControls();
    this.#initVideoVolume();
    this.#initVideoInfo();
    this.#initPlayNext();
  }

  #initVideoControls() {
    this.videoControlChecker = document.querySelector('#video-control');
    this.videoControlChecker.addEventListener('change', () => {
      this.videoPlayer.setAttribute('controls', this.videoControlChecker.checked);
      FlayStorage.local.set('flay-play-video-control', this.videoControlChecker.checked);
    });
    this.videoControlChecker.checked = FlayStorage.local.getBoolean('flay-play-video-control', false);
    this.videoControlChecker.dispatchEvent(new Event('change'));
  }

  #initVideoVolume() {
    this.videoVolumeChecker = document.querySelector('#video-volume');
    this.videoVolumeChecker.addEventListener('change', () => {
      this.videoPlayer.setAttribute('volume', parseInt(this.videoVolumeChecker.value) / 100);
      FlayStorage.local.set('flay-play-video-volume', this.videoVolumeChecker.value);
    });
    this.videoVolumeChecker.value = FlayStorage.local.getNumber('flay-play-video-volume', 10);
    this.videoVolumeChecker.dispatchEvent(new Event('change'));
  }

  #initVideoInfo() {
    this.videoInfoChecker = document.querySelector('#video-info');
    this.videoInfoChecker.addEventListener('change', () => {
      this.videoPlayer.setAttribute('info', this.videoInfoChecker.checked);
      FlayStorage.local.set('flay-play-video-info', this.videoInfoChecker.checked);
    });
    this.videoInfoChecker.checked = FlayStorage.local.getBoolean('flay-play-video-info', false);
    this.videoInfoChecker.dispatchEvent(new Event('change'));
  }

  #initPlayNext() {
    this.playNextFlayBtn = document.querySelector('#play-next-flay');
    this.playNextFlayBtn.innerHTML = SVG.controls.nextTrack;
    this.playNextFlayBtn.addEventListener('click', () => this.play());
  }

  #displayTime() {
    this.progressBar.style.width = (this.sec / this.MaxPlayTime) * 100 + '%';
    this.videoRemainingTime.innerHTML = toTime(this.sec);
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
  }

  async start() {
    await this.play();

    setInterval(async () => {
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
