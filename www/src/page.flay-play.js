import './flay/part/FlayActress';
import './flay/part/FlayOpus';
import './flay/part/FlayRank';
import './flay/part/FlayRelease';
import './flay/part/FlayStudio';
import './flay/part/FlayTag';
import './flay/part/FlayTitle';

import './init/Page';
import { FlayProvider } from './lib/FlayProvider';
import './page.flay-play.scss';
import { getRandomInt } from './util/randomNumber';

class Page extends FlayProvider {
  video;
  progressTimer;

  /** 최소 플레이 초 */
  MinPlayTime = 60 * 1;
  MaxPlayTime = 60 * 5;

  constructor() {
    super();

    this.video = document.querySelector('video');
    this.video.toggleAttribute('controls', true);
    this.video.volume = 0.1;
  }

  async play() {
    const { opus, flay, actress } = await this.random();
    console.log('play', opus);
    this.video.poster = `/static/cover/${opus}`;
    this.video.src = `/stream/flay/movie/${opus}/0`;

    await this.video.play();
    this.video.currentTime = getRandomInt(1, this.video.duration - this.MaxPlayTime);
    console.log(`played from ${this.video.currentTime} seconds`);

    this.#showFlayInfo(opus, flay, actress);
    this.#setPlayTimeAndNext();
  }

  #showFlayInfo(opus, flay, actress) {
    document.querySelector('main').style.backgroundImage = `url(/static/cover/${opus})`;
    document.querySelector('flay-studio').set(flay);
    document.querySelector('flay-opus').set(flay);
    document.querySelector('flay-title').set(flay);
    document.querySelector('flay-actress').set(flay, actress);
    document.querySelector('flay-release').set(flay);
    document.querySelector('flay-rank').set(flay);
    document.querySelector('flay-tag').set(flay);
    document.querySelector('flay-tag').setCard();
  }

  #setPlayTimeAndNext() {
    const leftTime = this.video.duration - this.video.currentTime; // 남은 시간 초
    const playTime = getRandomInt(this.MinPlayTime, Math.min(leftTime, this.MaxPlayTime));

    document.querySelector('.progress-bar').dataset.time = playTime;
    document.querySelector('.progress-bar').style.width = '100%';

    console.log(`#setPlayTimeAndNext play for ${playTime} seconds`);

    let sec = playTime;
    this.progressTimer = setInterval(async () => {
      document.querySelector('.progress-bar').style.width = (--sec / playTime) * 100 + '%';

      if (sec === 0) {
        clearTimeout(this.progressTimer);
        document.querySelector('.progress-bar').style.width = '100%';
        await this.play();
      }
    }, 1000);
  }

  async start() {
    await this.play();

    console.log('started!');
  }
}

new Page().start();
