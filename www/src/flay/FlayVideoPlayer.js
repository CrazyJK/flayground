import FlayPlayTimeDB from '../idb/FlayPlayTimeDB';
import { getRandomInt } from '../util/randomNumber';
import './FlayVideoPlayer.scss';
import './part/FlayActress';
import './part/FlayCover';
import './part/FlayOpus';
import './part/FlayRank';
import './part/FlayRelease';
import './part/FlayStudio';
import './part/FlayTag';
import './part/FlayTitle';

const db = new FlayPlayTimeDB();

const putFlayPlayTime = (opus, time, duration) => db.update(opus, time, duration);
const getFlayPlayTime = async (opus) => await db.select(opus);

/**
 * Flay Video Player implements HTMLVideoElement
 */
export default class FlayVideoPlayer extends HTMLElement {
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
  }

  connectedCallback() {
    this.attachShadow({ mode: 'open' });

    const link = this.shadowRoot.appendChild(document.createElement('link'));
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = 'style.css';

    const wrapper = this.shadowRoot.appendChild(document.createElement('article'));
    wrapper.classList.add(this.tagName.toLowerCase());

    this.flayVideo = wrapper.appendChild(new FlayVideo());
    this.flayVideoInfo = wrapper.appendChild(new FlayVideoInfo());
    this.flayVideoPoster = wrapper.appendChild(new FlayVideoPoster());

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
          clearInterval(timer);
          resolve(true);
        }
        if (this.flayVideo.error) {
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
      const { flay, actress } = await fetch('/flay/' + this.opus + '/fully').then((res) => res.json());
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
    const seekTime = lastTime < prevTime ? getRandomInt(1, lastTime) : prevTime;

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

class FlayVideo extends HTMLVideoElement {
  opus;
  loaded;
  playing;

  constructor() {
    super();

    this.preload = 'auto';
    this.#addVideoEvent();
  }

  set(opus) {
    this.opus = opus;
    this.loaded = false;
    this.playing = false;
    this.poster = `/static/cover/${opus}`;
    this.src = `/stream/flay/movie/${opus}/0`;
    this.load();
  }

  #addVideoEvent() {
    /* 에러가 발생하여 리소스를 로드할 수 없는 시점에 발생합니다. */
    this.addEventListener('error', (e) => console.warn(this.opus, `[${e.type}]`, this.error?.message));
    /* 에러 외의 원인으로 전체 리소스가 로드 되지 못했을 때 발생합니다. */
    this.addEventListener('abort', (e) => console.warn(this.opus, `[${e.type}]`, this.error?.message));

    /* 미디어가 제거된 시점에 발생합니다. 예를 들어 미디어가 이미 (부분적으로라도) 로드 되었는데. HTMLMediaElement.load() 메소드 호출로 재 로드할 경우 발생합니다 */
    this.addEventListener('emptied', (e) => console.debug('🎦', this.opus, `[${e.type}]`));

    /* 브라우저가 리소스를 로드하기 시작하는 시점에 발생합니다. */
    this.addEventListener('loadstart', (e) => console.debug('🎦', this.opus, `[${e.type}]`));
    /* 메타데이터가 로드 된 시점에 발생합니다. */
    this.addEventListener('loadedmetadata', (e) => console.debug('🎦', this.opus, `[${e.type}]`, 'duration', toTime(this.duration)));
    /* 미디어의 첫번째 프레임이 로딩 완료된 시점에 발생합니다. */
    this.addEventListener('loadeddata', (e) => {
      this.loaded = true;
      console.debug('🎦', this.opus, `[${e.type}]`, 'loaded', this.loaded);
    });

    /* User agent가 미디어를 재생 가능한 시점에 발생합니다. 다만 전체 미디어를 재생하기 위해서는 콘텐츠의 버퍼링이 더 필요할 수 있습니다. */
    this.addEventListener('canplay', (e) => console.debug('🎦', this.opus, `[${e.type}]`));
    /* 추가 버퍼링 없이 전체 미디어를 재생할 수 있는 시점에 발생합니다. */
    this.addEventListener('canplaythrough', (e) => console.debug('🎦', this.opus, `[${e.type}]`));

    /* HTMLMediaElement.play() 메소드 호출이나 autoplay 속성에 의해 paused 프로퍼티가 true 에서 false로 전환되는 시점에 발생합니다. */
    this.addEventListener('play', (e) => console.debug('🎦', this.opus, `[${e.type}]`));
    /* 일시 정지 되거나 버퍼 부족으로 재생 정지 된 이후 재생 가능한 시점에 발생합니다. */
    this.addEventListener('playing', (e) => this.#dispatchPlayEvent(e, true));

    /* 브라우저가 리소르를 로딩 중일 때 주기적으로 발생합니다. */
    this.addEventListener('progress', (e) => {
      // console.debug('🎦', this.opus, `[${e.type}]`, this.currentTime);
      this.playing && putFlayPlayTime(this.opus, this.currentTime, this.duration);
    });
    /* 미디어 로딩이 중지된 시점에 발생합니다. */
    // this.addEventListener('suspend', (e) => console.debug('🎦', this.opus, `[${e.type}]`, 'time', toTime(this.currentTime)));

    /* currentTime 속성이 변경되는 시점에 발생합니다. */
    // this.addEventListener('timeupdate', (e) => console.debug('🎦', this.opus, `[${e.type}]`, 'time', toTime(this.currentTime)));
    /* 미디어 시킹이 시작되는 시점에 발생합니다. */
    this.addEventListener('seeking', (e) => console.debug('🎦', this.opus, `[${e.type}]`, 'time', toTime(this.currentTime)));
    /* 미디어 시킹이 완료되는 시점에 발생합니다. */
    this.addEventListener('seeked', (e) => console.debug('🎦', this.opus, `[${e.type}]`, 'time', toTime(this.currentTime)));

    /* 미디어 일시 정지를 요청하고 paused 상태로 진입하는 시점에 발생합니다. 일반적으로 HTMLMediaElement.pause() 메소드가 호출되는 시점입니다 */
    this.addEventListener('pause', (e) => this.#dispatchPlayEvent(e, false));

    /* 일시적인 버퍼 부족으로 재생이 정지된 시점에 발생합니다. */
    this.addEventListener('waiting', (e) => this.#dispatchPlayEvent(e, false));

    /* 미디어가 끝까지 재생 완료 된 시점에 발생합니다. */
    this.addEventListener('ended', (e) => console.debug('🎦', this.opus, `[${e.type}]`));

    /* 볼륨이 변경되는 시점에 발생합니다. */
    this.addEventListener('volumechange', (e) => this.#dispatchVolumeEvent(e));
  }

  #dispatchPlayEvent(e, isPlay) {
    this.playing = isPlay;
    console.log('🎥', this.opus, `[${e.type}]`, 'playing', this.playing, 'time', toTime(this.currentTime));
    this.dispatchEvent(new CustomEvent('play', { bubbles: true, composed: true, detail: { isPlay: this.playing } }));
  }

  #dispatchVolumeEvent(e) {
    console.log('🎥', this.opus, `[${e.type}]`, this.volume);
    this.dispatchEvent(new CustomEvent('volume', { bubbles: true, composed: true, detail: { volume: this.volume } }));
  }
}

class FlayVideoInfo extends HTMLDivElement {
  constructor() {
    super();

    this.classList.add('flay-video-info');
    this.innerHTML = `
      <div class="header">
        <flay-title mode="card"></flay-title>
      </div>
      <div class="footer">
        <flay-studio mode="card"></flay-studio>
        <flay-opus mode="card"></flay-opus>
        <flay-actress mode="card"></flay-actress>
        <flay-release mode="card"></flay-release>
        <flay-rank mode="card"></flay-rank>
        <flay-tag mode="card"></flay-tag>
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

class FlayVideoPoster extends HTMLDivElement {
  constructor() {
    super();

    this.classList.add('flay-video-poster');
    this.innerHTML = `
      <flay-cover mode="card"></flay-cover>
    `;
  }

  set(flay) {
    this.querySelector('flay-cover').set(flay);
  }
}

customElements.define('flay-video-player', FlayVideoPlayer);
customElements.define('flay-video', FlayVideo, { extends: 'video' });
customElements.define('flay-video-info', FlayVideoInfo, { extends: 'div' });
customElements.define('flay-video-poster', FlayVideoPoster, { extends: 'div' });

/**
 * 초를 시:분:초 형식으로 구한다
 * @param {number} seconds
 * @returns
 */
export function toTime(seconds) {
  return new Date(seconds * 1000).toISOString().slice(11, 19);
}

let prevOpus = null;

/**
 * 현재 창에 플레이어를 레이어로 띄운다
 * @param {string} opus
 */
export const playInLayer = async (opus) => {
  console.log('playInLayer', opus, prevOpus);

  let videoPlayer = null;
  let layer = document.querySelector('.layer-play');
  if (layer === null) {
    layer = document.querySelector('body').appendChild(document.createElement('div'));
    layer.classList.add('layer-play');
    layer.innerHTML = '<article></article>';
    layer.addEventListener('click', (e) => {
      console.debug('layer click', e.target.tagName);
      if (e.target.tagName !== 'FLAY-VIDEO-PLAYER') {
        layer.classList.add('hide');
        videoPlayer.pause();
        document.dispatchEvent(new CustomEvent('videoPlayer', { composed: true, bubbles: true, detail: { isPlay: false } }));
      }
    });
    videoPlayer = layer.querySelector('article').appendChild(new FlayVideoPlayer({ info: false, poster: false, volume: 0.05 }));
  } else {
    layer.classList.remove('hide');
    videoPlayer = layer.querySelector('flay-video-player');
  }

  if (prevOpus !== opus) {
    await videoPlayer.load(opus);
    await videoPlayer.playRandomSeekOrContinuously();
  } else {
    await videoPlayer.play();
  }
  document.dispatchEvent(new CustomEvent('videoPlayer', { composed: true, bubbles: true, detail: { isPlay: true } }));

  prevOpus = opus;
};
