import './flay/part/FlayActress';
import './flay/part/FlayOpus';
import './flay/part/FlayRank';
import './flay/part/FlayRelease';
import './flay/part/FlayStudio';
import './flay/part/FlayTag';
import './flay/part/FlayTitle';

import './flay/part/FlayVideoPlayer';

import './init/Page';
import { FlayProvider } from './lib/FlayProvider';
import './page.flay-play.scss';
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

    this.videoPlayer = document.querySelector('flay-video-player');
    this.videoPlayer.setAttribute('controls', true);
    this.videoPlayer.setAttribute('volume', 0.1);
  }

  async play() {
    try {
      const { opus, flay, actress } = await this.random();
      console.log('play', opus);

      document.querySelector('main').style.backgroundImage = `url(/static/cover/${opus})`;

      this.videoPlayer.set(opus, flay, actress);
      const duration = await this.videoPlayer.play();
      const seekTime = getRandomInt(1, duration - this.MaxPlayTime);
      await this.videoPlayer.play(seekTime);

      this.#setPlayTimeAndNext(seekTime, duration);
    } catch (error) {
      console.error(error);
      this.play();
    }
  }

  #setPlayTimeAndNext(seekTime, duration) {
    const leftTime = duration - seekTime; // 남은 시간 초
    const playTime = getRandomInt(this.MinPlayTime, Math.min(leftTime, this.MaxPlayTime));

    const progressBar = document.querySelector('.progress-bar');
    progressBar.title = playTime;
    progressBar.style.width = '100%';

    let sec = playTime;
    clearTimeout(this.progressTimer);
    this.progressTimer = setInterval(async () => {
      progressBar.style.width = (--sec / playTime) * 100 + '%';

      if (sec === 0) {
        clearTimeout(this.progressTimer);
        progressBar.style.width = '100%';
        await this.play();
      }
    }, 1000);
    console.log(`#setPlayTimeAndNext play for ${playTime} seconds`);
  }

  async start() {
    await this.play();

    document.querySelector('#nextFlay').addEventListener('click', async () => await this.play());

    console.log('started!');
  }
}

new Page().start();
