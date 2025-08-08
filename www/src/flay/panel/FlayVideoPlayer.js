import '@flay/domain/part/FlayActress';
import '@flay/domain/part/FlayCover';
import '@flay/domain/part/FlayOpus';
import '@flay/domain/part/FlayRank';
import '@flay/domain/part/FlayRelease';
import '@flay/domain/part/FlayStudio';
import '@flay/domain/part/FlayTag';
import '@flay/domain/part/FlayTitle';
import PlayTimeDB from '@flay/idb/PlayTimeDB';
import ApiClient from '@lib/ApiClient';
import FlayFetch from '@lib/FlayFetch';
import RandomUtils from '@lib/RandomUtils';
import { addResizeListener } from '@lib/windowAddEventListener';
import FlayVideo from './FlayVideoElement';
import './FlayVideoPlayer.scss';

const db = new PlayTimeDB();

const getFlayPlayTime = async (opus) => await db.select(opus);

/**
 * Flay Video Player implements HTMLVideoElement
 */
export class FlayVideoPlayer extends HTMLElement {
  opus;

  static get observedAttributes() {
    return ['controls', 'volume', 'autoplay', 'info', 'poster'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    console.debug('attributeChangedCallback', name, oldValue, newValue);
    switch (name) {
      case 'controls':
        this.flayVideo.controls = newValue === 'true';
        break;
      case 'volume':
        this.flayVideo.volume = parseFloat(newValue);
        break;
      case 'autoplay':
        this.flayVideo.autoplay = newValue === 'true';
        break;
      case 'info':
        this.flayVideoInfo.classList.toggle('hide', newValue !== 'true');
        break;
      case 'poster':
        this.flayVideoPoster.classList.toggle('hide', newValue !== 'true');
        break;
    }
  }

  constructor(opts) {
    super();

    this.options = {
      ...{
        controls: true,
        volume: 1,
        autoplay: false,
        info: true,
        poster: true,
      },
      ...opts,
    };

    this.classList.add('flay-video-player', 'flay-div');
    this.flayVideo = this.appendChild(new FlayVideo());
    this.flayVideoInfo = this.appendChild(new FlayVideoInfo());
    this.flayVideoPoster = this.appendChild(new FlayVideoPoster());

    this.#setOptions();
  }

  #setOptions() {
    console.log('FlayVideoPlayer #setOptions', this.options);

    this.setAttribute('controls', this.options.controls);
    this.setAttribute('volume', this.options.volume);
    this.setAttribute('autoplay', this.options.autoplay);
    this.setAttribute('info', this.options.info);
    this.setAttribute('poster', this.options.poster);
  }

  /**
   * flay 로드. 로딩까지 대기
   * @param {string} opus
   * @param {Flay} flay
   * @param {Actress[]} actress
   * @returns
   */
  load(opus, flay, actress) {
    this.classList.toggle('load', false);
    this.opus = opus;
    this.flayVideo.set(opus);
    if (this.options.info) this.flayVideoInfo.set(flay, actress);
    if (this.options.poster) this.flayVideoPoster.set(flay);

    return new Promise((resolve, reject) => {
      const timer = setInterval(() => {
        if (this.flayVideo.loaded) {
          this.classList.toggle('load', true);
          this.classList.toggle('error', false);
          clearInterval(timer);
          resolve(true);
        }
        if (this.flayVideo.error) {
          this.classList.toggle('load', false);
          this.classList.toggle('error', true);
          clearInterval(timer);
          reject(`load Error: [${this.opus}] ${this.flayVideo.error?.message}`);
        }
      }, 10);
    });
  }

  /**
   * flay 정보 리로드
   */
  async reload() {
    if (this.options.info) {
      const { flay, actress } = await FlayFetch.getFullyFlay(this.opus);
      this.flayVideoInfo.set(flay, actress, true);
    }
  }

  /**
   * playing의 상태 변화를 기다린다
   * @param {boolean} isPlay
   * @returns
   */
  #wait(isPlay) {
    return new Promise((resolve, reject) => {
      const timer = setInterval(() => {
        if (this.flayVideo.playing === isPlay) {
          clearInterval(timer);
          resolve(true);
        }
        if (this.flayVideo.error) {
          clearInterval(timer);
          reject(`${isPlay ? 'play' : 'pause'} Error: [${this.opus}] ${this.flayVideo.error?.message}`);
        }
      }, 10);
    });
  }

  /**
   * video play
   */
  async play() {
    if (!this.flayVideo.playing) {
      await this.flayVideo.play();
    }
    await this.#wait(true);
  }

  /**
   * video seek and play
   * @param {number} seekTime
   */
  async seek(seekTime) {
    this.flayVideo.currentTime = seekTime;
    await this.play();
  }

  /**
   * 랜덤 타임을 플레이 하거나, 이전 플레이 타임에 이어서 플레이 한다
   *
   * [ 1 ] ---- [ seekTime ] ---- [ lastTime = totalTime - lastOffsetTime ] -- [ endTime ]
   *
   * @param {number} lastOffsetTime 랜덤 타임 구할때, 총 플레이 시간에서 마이너스 할 초
   * @returns
   */
  async playRandomSeekOrContinuously(lastOffsetTime = 0) {
    const dbFlayPlayTime = await getFlayPlayTime(this.opus);

    const endTime = this.flayVideo.duration;
    const lastTime = endTime - lastOffsetTime;
    const prevTime = dbFlayPlayTime?.time || endTime + 1;
    const seekTime = lastTime < prevTime ? RandomUtils.getRandomInt(1, lastTime) : prevTime;

    await this.seek(seekTime);

    return seekTime;
  }

  /**
   * video pause
   */
  async pause() {
    if (this.flayVideo.playing) {
      this.flayVideo.pause();
    }
    await this.#wait(false);
  }

  /**
   * the total duration of the media in seconds
   * @returns {number}
   */
  get duration() {
    return this.flayVideo.duration;
  }

  get currentTime() {
    return this.flayVideo.currentTime;
  }

  get poster() {
    return this.flayVideo.poster;
  }

  get currentSrc() {
    return this.flayVideo.currentSrc;
  }

  get playing() {
    return this.flayVideo.playing;
  }

  get volume() {
    return this.flayVideo.volume;
  }
}

class FlayVideoInfo extends HTMLElement {
  constructor() {
    super();

    this.classList.add('flay-video-info', 'flay-div');
    this.innerHTML = `
      <div class="header">
        <flay-title mode="card"></flay-title>
      </div>
      <div class="footer">
        <flay-studio  mode="card"></flay-studio>
        <flay-opus    mode="card"></flay-opus>
        <flay-actress mode="card"></flay-actress>
        <flay-release mode="card"></flay-release>
        <flay-rank    mode="card"></flay-rank>
        <flay-tag     mode="card"></flay-tag>
      </div>
    `;
  }

  set(flay, actress, reload = false) {
    this.querySelector('flay-studio').set(flay, reload);
    this.querySelector('flay-opus').set(flay, reload);
    this.querySelector('flay-title').set(flay, reload);
    this.querySelector('flay-actress').set(flay, actress, reload);
    this.querySelector('flay-release').set(flay, reload);
    this.querySelector('flay-rank').set(flay, reload);
    this.querySelector('flay-tag').set(flay, reload);
  }
}

class FlayVideoPoster extends HTMLElement {
  constructor() {
    super();

    this.classList.add('flay-video-poster', 'flay-div');
  }

  set(flay) {
    this.style.backgroundImage = `url(${ApiClient.buildUrl(`/static/cover/${flay.opus}`)})`;
  }
}

customElements.define('flay-video-player', FlayVideoPlayer);
customElements.define('flay-video-info', FlayVideoInfo);
customElements.define('flay-video-poster', FlayVideoPoster);

let prevOpus = null;

/**
 * 현재 창에 플레이어를 레이어로 띄운다
 * @param {string} opus
 */
export const playInLayer = async (opus) => {
  const dispatchPlayEvent = (isPlay) => document.dispatchEvent(new CustomEvent('videoPlayer', { composed: true, bubbles: true, detail: { isPlay: isPlay } }));
  const setPlayerPosition = () => {
    const flayCoverRect = document.querySelector('flay-page')?.querySelector('flay-cover').getBoundingClientRect();
    if (flayCoverRect) {
      const { top, left, width, height } = flayCoverRect;
      layer.querySelector('article').style.cssText = `position: fixed; top: ${top}px; left: ${left}px; width: ${width}px; height: ${height}px;`;
    }
  };

  console.log('playInLayer', opus, prevOpus);

  let layer = document.querySelector('#playInLayer');
  if (layer === null) {
    layer = document.body.appendChild(document.createElement('div'));
    layer.id = 'playInLayer';
    layer.appendChild(document.createElement('article')).appendChild(new FlayVideoPlayer({ info: false, poster: false, volume: 0.05 }));
    layer.addEventListener('click', (e) => {
      console.debug('layer click', e.target.tagName);
      if (e.target.tagName !== 'FLAY-VIDEO-PLAYER') {
        layer.classList.add('hide');
        videoPlayer.pause();
        dispatchPlayEvent(false);
      }
    });
  }

  addResizeListener(() => setPlayerPosition(), true);

  layer.classList.remove('hide');

  const videoPlayer = layer.querySelector('flay-video-player');
  if (prevOpus !== opus) {
    await videoPlayer.load(opus);
    await videoPlayer.playRandomSeekOrContinuously();
  } else {
    await videoPlayer.play();
  }
  dispatchPlayEvent(true);

  prevOpus = opus;
};
