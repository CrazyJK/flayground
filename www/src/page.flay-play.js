import './init/Page';
import './page.flay-play.scss';

import FlayVideoPlayer, { toTime } from './flay/part/FlayVideoPlayer';
import { FlayProvider } from './lib/FlayProvider';
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
    this.videoPlayer.setAttribute('controls', true);
    this.videoPlayer.setAttribute('volume', 0.1);
    // this.videoPlayer.setAttribute('autoplay', true);
  }

  async play() {
    try {
      const { opus, flay, actress } = await this.random();

      document.querySelector('main').style.backgroundImage = `url(/static/cover/${opus})`;

      await this.videoPlayer.set(opus, flay, actress);
      console.log('videoPlayer is setted', opus);

      const duration = this.videoPlayer.getDuration();
      const seekTime = getRandomInt(1, duration - this.MaxPlayTime);

      await this.videoPlayer.seek(seekTime);
      console.log('videoPlayer is seeked', toTime(seekTime));

      this.#setPlayTimeAndNext(seekTime, duration);
    } catch (error) {
      console.error(error);
      await this.play();
    }
  }

  #setPlayTimeAndNext(seekTime, duration) {
    const leftTime = duration - seekTime; // 남은 시간 초
    const playTime = getRandomInt(this.MinPlayTime, Math.min(leftTime, this.MaxPlayTime));
    let sec = playTime;

    const progressBar = document.querySelector('.progress-bar');
    const progressMarker = document.querySelector('.progress-marker');

    progressBar.style.width = (sec / this.MaxPlayTime) * 100 + '%';
    progressMarker.innerHTML = toTime(sec);

    clearTimeout(this.progressTimer);
    this.progressTimer = setInterval(async () => {
      --sec;
      progressBar.style.width = (sec / this.MaxPlayTime) * 100 + '%';
      progressMarker.innerHTML = toTime(sec);

      if (sec === 0) {
        clearTimeout(this.progressTimer);
        progressBar.style.width = '100%';
        progressMarker.innerHTML = toTime(this.MaxPlayTime);
        await this.play();
      }
    }, 1000);
    console.log('videoPlayer will be played for', toTime(playTime));
  }

  async start() {
    document.querySelector('#nextFlay').addEventListener('click', async () => await this.play());
    document.querySelector('#nextFlay').dispatchEvent(new Event('click'));
  }
}

new Page().start();
