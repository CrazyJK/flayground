import './init/Page';
import './page.flay-play.scss';

import FlayVideoPlayer, { toTime } from './flay/part/FlayVideoPlayer';
import { FlayProvider } from './lib/FlayProvider';
import SVG from './svg/SVG';
import FlayStorage from './util/FlayStorage';
import { getRandomInt } from './util/randomNumber';

class Page extends FlayProvider {
  videoPlayer;
  progressTimer;

  /** 최소 플레이 초 */
  MinPlayTime = 60 * 1;
  /** 최대 플레이 초 */
  MaxPlayTime = 60 * 5;

  constructor() {
    super();

    this.videoPlayer = document.querySelector('article').appendChild(new FlayVideoPlayer());
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

  async play() {
    const { opus, flay, actress } = await this.random();

    document.title = `${opus} ${flay.title} ${flay.actressList.join(' ')}`;
    document.querySelector('main').style.backgroundImage = `url(/static/cover/${opus})`;

    let [totalTime, seekTime] = [-1, -1];
    try {
      await this.videoPlayer.set(opus, flay, actress);
      console.log('videoPlayer is setted', opus);

      totalTime = this.videoPlayer.getDuration();
      seekTime = getRandomInt(1, totalTime - this.MaxPlayTime);

      await this.videoPlayer.seek(seekTime);
      console.log('videoPlayer is seeked', toTime(seekTime));
    } catch (e) {
      console.error('play Error', e.message);
    }
    if (totalTime > seekTime) this.#setPlayTimeAndNext(totalTime - seekTime);
  }

  #setPlayTimeAndNext(leftTime) {
    const playTime = getRandomInt(this.MinPlayTime, Math.min(leftTime, this.MaxPlayTime));
    let sec = playTime;

    const progressBar = document.querySelector('.progress-bar');
    const videoRemainingTimer = document.querySelector('.video-remaining-time');

    progressBar.style.width = (sec / this.MaxPlayTime) * 100 + '%';
    videoRemainingTimer.innerHTML = toTime(sec);

    clearTimeout(this.progressTimer);
    this.progressTimer = setInterval(() => {
      --sec;
      progressBar.style.width = (sec / this.MaxPlayTime) * 100 + '%';
      videoRemainingTimer.innerHTML = toTime(sec);

      if (sec === 0) {
        clearTimeout(this.progressTimer);
        progressBar.style.width = '100%';
        videoRemainingTimer.innerHTML = toTime(this.MaxPlayTime);

        this.#next();
      }
    }, 1000);
    console.log('videoPlayer will be played for', toTime(playTime));
  }

  #next() {
    this.playNextFlayBtn.dispatchEvent(new Event('click'));
  }

  async start() {
    this.#next();
  }
}

new Page().start();
