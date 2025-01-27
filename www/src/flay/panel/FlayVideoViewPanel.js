import { EVENT_BASKET_ADD, EVENT_CHANGE_TITLE } from '../../GroundConstant';
import { FlayProvider } from '../../lib/FlayProvider';
import FlayStorage from '../../lib/FlayStorage';
import { getRandomInt } from '../../lib/randomNumber';
import basketSVG from '../../svg/basket';
import controlsSVG from '../../svg/controls';
import { FlayVideoPlayer, toTime } from './FlayVideoPlayer';
import './FlayVideoViewPanel.scss';

/** 최소 플레이 초 */
const MinPlayTime = 60 * 2;
/** 최대 플레이 초 */
const MaxPlayTime = 60 * 5;

export class FlayVideoViewPanel extends HTMLDivElement {
  #timer = -1;

  constructor() {
    super();

    this.classList.add('flay-video-view-panel');
    this.innerHTML = `
      <header></header>
      <main>
        <article></article>
      </main>
      <footer>
        <div class="video-control-panel">
          <div>
            <input type="checkbox" id="toggle-video-controls" />
            <label for="toggle-video-controls">controls</label>
          </div>
          <div>
            <input type="checkbox" id="toggle-video-info" />
            <label for="toggle-video-info">info</label>
          </div>
          <div>
            <input type="checkbox" id="toggle-video-poster" />
            <label for="toggle-video-poster">poster</label>
          </div>
          <div>
            <input type="checkbox" id="toggle-remaining-time" checked />
            <label for="toggle-remaining-time">00:00:00</label>
          </div>
          <div>
            <button type="button" id="play-next-flay" title="next Flay">⏭️</button>
          </div>
          <div>
            <input type="checkbox" id="pause-video" title="pause video" />
            <label for="pause-video">⏸pause</label>
          </div>
          <div>
            <label for="video-volume" title="volume">🛜</label>
            <input type="number" id="video-volume" min="0" step="5" max="100" value="10" />
          </div>
          <div>
            <button type="button" id="keepFlay" title="keep flay in basket">keep</button>
          </div>
        </div>
        <div class="progress">
          <div class="progress-bar"></div>
        </div>
      </footer>
    `;

    this.flayProvider = new FlayProvider();

    this.querySelector('#play-next-flay').innerHTML = controlsSVG.nextTrack;
    this.querySelector('[for="pause-video"]').innerHTML = controlsSVG.pause;
    this.querySelector('[for="video-volume"]').innerHTML = controlsSVG.volume;

    this.videoPlayer = this.querySelector('main > article').appendChild(new FlayVideoPlayer());

    this.progressBar = this.querySelector('.progress-bar');
    this.remainingTimeCheck = this.querySelector('#toggle-remaining-time');
    this.remainingTime = this.querySelector('[for="toggle-remaining-time"]');
    this.pauseVideo = this.querySelector('#pause-video');
    this.videoVolume = this.querySelector('#video-volume');

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

  connectedCallback() {
    this.start();
  }

  disconnectedCallback() {
    clearInterval(this.#timer);
  }

  #initControl() {
    const videoControlsToggler = this.querySelector('#toggle-video-controls');
    videoControlsToggler.addEventListener('change', (e) => {
      this.videoPlayer.setAttribute('controls', e.target.checked);
      FlayStorage.local.set('flay-play-video-control', e.target.checked);
    });
    videoControlsToggler.checked = FlayStorage.local.getBoolean('flay-play-video-control', false);
    videoControlsToggler.dispatchEvent(new Event('change'));
  }

  #initInfo() {
    const videoInfoToggler = this.querySelector('#toggle-video-info');
    videoInfoToggler.addEventListener('change', (e) => {
      this.videoPlayer.setAttribute('info', e.target.checked);
      FlayStorage.local.set('flay-play-video-info', e.target.checked);
    });
    videoInfoToggler.checked = FlayStorage.local.getBoolean('flay-play-video-info', false);
    videoInfoToggler.dispatchEvent(new Event('change'));
  }

  #initCover() {
    const videoPosterToggler = this.querySelector('#toggle-video-poster');
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
    this.querySelector('#play-next-flay').addEventListener('click', () => this.play());
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
    this.querySelector('#keepFlay').innerHTML = basketSVG;
    this.querySelector('#keepFlay').addEventListener('click', async () => {
      const { FlayBasket } = await import(/* webpackChunkName: "FlayBasket" */ './FlayBasket');
      FlayBasket.add(this.videoPlayer.opus);
      this.dispatchEvent(new CustomEvent(EVENT_BASKET_ADD, { bubbles: true }));
    });
  }

  #displayTime() {
    this.progressBar.style.width = (this.sec / MaxPlayTime) * 100 + '%';
    this.remainingTime.innerHTML = toTime(this.sec);
  }

  async play() {
    const { opus, flay, actress } = await this.flayProvider.random();
    this.dispatchEvent(new CustomEvent(EVENT_CHANGE_TITLE, { detail: { title: `[${flay.opus}] ${flay.actressList.join(',')} - ${flay.title}` } }));

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

    this.#timer = setInterval(async () => {
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

customElements.define('flay-video-view-panel', FlayVideoViewPanel, { extends: 'div' });
