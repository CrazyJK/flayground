import './init/Page';
import { FlayProvider } from './lib/FlayProvider';
import './page.flay-play.scss';
import { getRandomInt } from './util/randomNumber';

class Page extends FlayProvider {
  video;

  constructor() {
    super();

    this.video = document.querySelector('video');
    this.video.toggleAttribute('controls', true);

    this.video.addEventListener('canplay', (e) => {
      console.log('canplay', e);

      console.log('seekable', this.video.seekable);
      console.log('duration', this.video.duration);
    });
  }

  async start() {
    const { opus, flay } = await this.random();
    console.log(opus, flay);
    this.video.poster = `/static/cover/${opus}`;
    this.video.src = `/stream/flay/movie/${opus}/0`;
    this.video.volume = 0.2;

    await this.video.play();

    this.video.currentTime = getRandomInt(1, this.video.duration);

    console.log('started!');
  }
}

new Page().start();
