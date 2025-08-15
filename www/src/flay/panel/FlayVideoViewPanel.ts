import { EVENT_BASKET_ADD, EVENT_CHANGE_TITLE } from '@base/GroundConstant';
import GroundFlay from '@base/GroundFlay';
import { FlayProvider } from '@lib/FlayProvider';
import FlayStorage from '@lib/FlayStorage';
import RandomUtils from '@lib/RandomUtils';
import TimeUtils from '@lib/TimeUtils';
import basketSVG from '@svg/basket';
import controlsSVG from '@svg/controls';
import { FlayVideoPlayer } from './FlayVideoPlayer';
import './FlayVideoViewPanel.scss';

/** Window 객체에 알림 함수 추가 */
declare global {
  interface Window {
    emitNotice?: (data: string, warn?: boolean) => void;
  }
}

/** 최소 플레이 시간 (초) */
const MinPlayTime = 60 * 2;
/** 최대 플레이 시간 (초) */
const MaxPlayTime = 60 * 5;

/**
 * 비디오 재생 및 제어 패널 컴포넌트
 *
 * 랜덤한 Flay 비디오를 자동으로 재생하고, 재생 시간, 볼륨,
 * 일시정지 등을 제어할 수 있는 인터페이스를 제공합니다.
 */
export class FlayVideoViewPanel extends GroundFlay {
  /** 타이머 ID */
  #timer: ReturnType<typeof setInterval> | undefined;
  /** Flay 데이터 제공자 */
  flayProvider: FlayProvider;
  /** 비디오 플레이어 컴포넌트 */
  videoPlayer: FlayVideoPlayer;

  /** 진행률 표시 바 */
  progressBar: HTMLElement;
  /** 남은 시간 표시 체크박스 */
  remainingTimeCheck: HTMLInputElement;
  /** 남은 시간 표시 요소 */
  remainingTime: HTMLElement;
  /** 비디오 일시정지 체크박스 */
  pauseVideo: HTMLInputElement;
  /** 비디오 볼륨 조절 입력 */
  videoVolume: HTMLInputElement;

  /** 일시정지 상태 */
  isPaused: boolean = false;
  /** 남은 재생 시간 (초) */
  sec: number = 0;

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

    this.querySelector('#play-next-flay')!.innerHTML = controlsSVG.nextTrack;
    this.querySelector('[for="pause-video"]')!.innerHTML = controlsSVG.pause;
    this.querySelector('[for="video-volume"]')!.innerHTML = controlsSVG.volume;

    this.videoPlayer = this.querySelector('main > article')!.appendChild(new FlayVideoPlayer({}));

    this.progressBar = this.querySelector('.progress-bar')!;
    this.remainingTimeCheck = this.querySelector('#toggle-remaining-time')!;
    this.remainingTime = this.querySelector('[for="toggle-remaining-time"]')!;
    this.pauseVideo = this.querySelector('#pause-video')!;
    this.videoVolume = this.querySelector('#video-volume')!;

    this.#initControl(); // 비디오 컨트롤 표시 여부
    this.#initInfo(); // Flay 정보 표시 여부
    this.#initCover(); // 비디오 포스터 표시 여부
    this.#initRemainingTime(); // 남은 시간 표시 기능
    this.#initNextFlay(); // 다음 Flay 재생 기능
    this.#initPause(); // 비디오 일시정지 기능
    this.#initVolume(); // 볼륨 조절 기능
    this.#initKeepFlay(); // Flay 보관 기능

    this.videoPlayer.addEventListener('play', (e: Event) => {
      console.debug(e.type, (e as CustomEvent).detail.isPlay);
      this.pauseVideo.checked = !(e as CustomEvent).detail.isPlay;
    });

    this.videoPlayer.addEventListener('volume', (e: Event) => {
      console.debug(e.type, (e as CustomEvent).detail.volume);
      this.videoVolume.value = String((e as CustomEvent).detail.volume * 100);
      FlayStorage.local.set('flay-play-video-volume', String((e as CustomEvent).detail.volume * 100));
    });
  }

  connectedCallback() {
    void this.start();
  }

  disconnectedCallback() {
    if (this.#timer) {
      clearInterval(this.#timer);
    }
  }

  /** 비디오 컨트롤 표시 여부를 초기화합니다. */
  #initControl() {
    const videoControlsToggler = this.querySelector('#toggle-video-controls') as HTMLInputElement;
    videoControlsToggler.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      const checked = String(target.checked);
      this.videoPlayer.setAttribute('controls', checked);
      FlayStorage.local.set('flay-play-video-control', checked);
    });
    videoControlsToggler.checked = FlayStorage.local.getBoolean('flay-play-video-control', false);
    videoControlsToggler.dispatchEvent(new Event('change'));
  }

  /** Flay 정보 표시 여부를 초기화합니다. */
  #initInfo() {
    const videoInfoToggler = this.querySelector('#toggle-video-info') as HTMLInputElement;
    videoInfoToggler.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      const checked = String(target.checked);
      this.videoPlayer.setAttribute('info', checked);
      FlayStorage.local.set('flay-play-video-info', checked);
    });
    videoInfoToggler.checked = FlayStorage.local.getBoolean('flay-play-video-info', false);
    videoInfoToggler.dispatchEvent(new Event('change'));
  }

  /** 비디오 포스터 표시 여부를 초기화합니다. */
  #initCover() {
    const videoPosterToggler = this.querySelector('#toggle-video-poster') as HTMLInputElement;
    videoPosterToggler.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      const checked = String(target.checked);
      this.videoPlayer.setAttribute('poster', checked);
      FlayStorage.local.set('flay-play-video-poster', checked);
    });
    videoPosterToggler.checked = FlayStorage.local.getBoolean('flay-play-video-poster', false);
    videoPosterToggler.dispatchEvent(new Event('change'));
  }

  /** 남은 시간 표시 기능을 초기화합니다. */
  #initRemainingTime() {
    this.remainingTimeCheck.addEventListener('change', (e) => (this.isPaused = !(e.target as HTMLInputElement).checked));
  }

  /** 다음 Flay 재생 버튼을 초기화합니다. */
  #initNextFlay() {
    this.querySelector('#play-next-flay')!.addEventListener('click', () => this.play());
  }

  /** 비디오 일시정지 기능을 초기화합니다. */
  #initPause() {
    this.pauseVideo.addEventListener('change', (e) => ((e.target as HTMLInputElement).checked ? this.videoPlayer.pause() : this.videoPlayer.play()));
  }

  /** 볼륨 조절 기능을 초기화합니다. */
  #initVolume() {
    this.videoVolume.addEventListener('change', (e) => {
      this.videoPlayer.setAttribute('volume', String(parseInt((e.target as HTMLInputElement).value) / 100));
      FlayStorage.local.set('flay-play-video-volume', (e.target as HTMLInputElement).value);
    });
    this.videoVolume.value = FlayStorage.local.get('flay-play-video-volume', '10');
    this.videoVolume.dispatchEvent(new Event('change'));
  }

  /** Flay 보관 기능을 초기화합니다. */
  #initKeepFlay() {
    this.querySelector('#keepFlay')!.innerHTML = basketSVG;
    this.querySelector('#keepFlay')!.addEventListener('click', async () => {
      const { FlayBasket } = await import(/* webpackChunkName: "FlayBasket" */ './FlayBasket');
      FlayBasket.add(this.videoPlayer.opus!);
      this.dispatchEvent(new CustomEvent(EVENT_BASKET_ADD, { bubbles: true }));
    });
  }

  /** 재생 시간 및 진행률을 화면에 표시합니다. */
  #displayTime() {
    this.progressBar.style.width = (this.sec / MaxPlayTime) * 100 + '%';
    this.remainingTime.innerHTML = TimeUtils.toTime(this.sec);
  }

  /** 랜덤한 Flay를 선택하여 재생을 시작합니다. */
  async play() {
    const { opus, flay, actress } = await this.flayProvider.random();
    this.dispatchEvent(new CustomEvent(EVENT_CHANGE_TITLE, { detail: { title: `[${flay.opus}] ${flay.actressList.join(',')} - ${flay.title}` } }));
    this.dispatchEvent(new CustomEvent('flay-load', { detail: { opus, flay, actress } }));

    try {
      await this.videoPlayer.load(opus, flay, actress);
      console.log('videoPlayer is loaded', opus);

      const seekTime = await this.videoPlayer.playRandomSeekOrContinuously(MaxPlayTime);
      console.log('videoPlayer is seeked', TimeUtils.toTime(this.videoPlayer.currentTime));

      this.sec = RandomUtils.getRandomInt(MinPlayTime, Math.min(this.videoPlayer.duration - seekTime, MaxPlayTime));
      console.log('videoPlayer will be played for', TimeUtils.toTime(this.sec));

      this.#displayTime();

      this.isPaused = false;
      this.remainingTimeCheck.checked = true;
      this.pauseVideo.checked = false;
    } catch (e: unknown) {
      this.sec = 10;
      const message = `play Error ${(e as Error).message}. retry in ${this.sec}s`;
      console.error(message, e);
      if (window.emitNotice) {
        window.emitNotice(message, true);
      }
    }
  }

  /** 비디오 재생을 시작하고 타이머를 설정합니다. */
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

/** 커스텀 엘리먼트 등록 */
customElements.define('flay-video-view-panel', FlayVideoViewPanel);
