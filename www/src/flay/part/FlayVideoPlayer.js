import './FlayActress';
import './FlayOpus';
import './FlayRank';
import './FlayRelease';
import './FlayStudio';
import './FlayTag';
import './FlayTitle';
import './FlayVideoPlayer.scss';

/**
 * Flay Video Player implements HTMLVideoElement
 */
export default class FlayVideoPlayer extends HTMLElement {
  opus;
  duration;
  loaded;
  playing;
  error;
  showInfo = false;

  constructor() {
    super();

    this.#initiate();
  }

  static get observedAttributes() {
    return ['controls', 'volume', 'autoplay', 'info'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    console.debug('attributeChangedCallback', name, oldValue, newValue);
    switch (name) {
      case 'controls':
        this.video.controls = newValue === 'true';
        break;
      case 'volume':
        this.video.volume = parseFloat(newValue);
        break;
      case 'autoplay':
        this.video.autoplay = newValue === 'true';
        break;
      case 'info':
        this.showInfo = newValue === 'true';
        this.shadowRoot.querySelector('.info').classList.toggle('hide', !this.showInfo);
        break;
    }
  }

  connectedCallback() {
    this.attachShadow({ mode: 'open' });

    const link = this.shadowRoot.appendChild(document.createElement('link'));
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = 'style.css';

    this.wrapper = this.shadowRoot.appendChild(document.createElement('article'));
    this.wrapper.classList.add(this.tagName.toLowerCase());
    this.wrapper.innerHTML = `<video></video>
    <div class="info hide">
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
    </div>`;

    this.video = this.shadowRoot.querySelector('video');
    this.video.preload = 'auto';

    this.#addVideoEvent();
  }

  #initiate(opus = null) {
    this.opus = opus;
    this.duration = -1;
    this.loaded = false;
    this.playing = false;
    this.error = false;
  }

  /**
   * playing의 상태 변화를 기다린다
   * @param {boolean} isPlay
   * @returns
   */
  #wait(isPlay) {
    return new Promise((resolve, reject) => {
      const timer = setInterval(() => {
        if (this.playing === isPlay) {
          clearInterval(timer);
          resolve(true);
        }
        if (this.error) {
          clearInterval(timer);
          reject('Error: ' + this.opus);
        }
      }, 10);
    });
  }

  #addVideoEvent() {
    // 에러가 발생하여 리소스를 로드할 수 없는 시점에 발생합니다.
    this.video.addEventListener('error', (e) => {
      this.error = true;
      console.error(this.opus, `[${e.type}]`, e);
    });
    // 에러 외의 원인으로 전체 리소스가 로드 되지 못했을 때 발생합니다.
    this.video.addEventListener('abort', (e) => {
      this.error = true;
      console.error(this.opus, `[${e.type}]`, e);
    });

    // 미디어가 제거된 시점에 발생합니다. 예를 들어 미디어가 이미 (부분적으로라도) 로드 되었는데. HTMLMediaElement.load() 메소드 호출로 재 로드할 경우 발생합니다
    this.video.addEventListener('emptied', (e) => console.debug(this.opus, `[${e.type}]`));

    // 브라우저가 리소스를 로드하기 시작하는 시점에 발생합니다.
    this.video.addEventListener('loadstart', (e) => console.debug(this.opus, `[${e.type}]`));
    // 메타데이터가 로드 된 시점에 발생합니다.
    this.video.addEventListener('loadedmetadata', (e) => {
      this.duration = this.video.duration;
      console.debug(this.opus, `[${e.type}]`, 'duration', toTime(this.duration));
    });
    // 미디어의 첫번째 프레임이 로딩 완료된 시점에 발생합니다.
    this.video.addEventListener('loadeddata', (e) => {
      this.loaded = true;
      console.debug(this.opus, `[${e.type}]`, 'loaded', this.loaded);
    });

    // User agent가 미디어를 재생 가능한 시점에 발생합니다. 다만 전체 미디어를 재생하기 위해서는 콘텐츠의 버퍼링이 더 필요할 수 있습니다.
    this.video.addEventListener('canplay', (e) => console.debug(this.opus, `[${e.type}]`));
    // HTMLMediaElement.play() 메소드 호출이나 autoplay 속성에 의해 paused 프로퍼티가 true 에서 false로 전환되는 시점에 발생합니다.
    this.video.addEventListener('play', (e) => console.debug(this.opus, `[${e.type}]`));
    // 일시 정지 되거나 버퍼 부족으로 재생 정지 된 이후 재생 가능한 시점에 발생합니다.
    this.video.addEventListener('playing', (e) => {
      this.playing = true;
      console.debug(this.opus, `[${e.type}]`, 'playing', this.playing, 'time', toTime(this.video.currentTime));
    });
    // 추가 버퍼링 없이 전체 미디어를 재생할 수 있는 시점에 발생합니다.
    this.video.addEventListener('canplaythrough', (e) => console.debug(this.opus, `[${e.type}]`));

    // 미디어 일시 정지를 요청하고 paused 상태로 진입하는 시점에 발생합니다. 일반적으로 HTMLMediaElement.pause() 메소드가 호출되는 시점입니다
    this.video.addEventListener('pause', (e) => {
      this.playing = false;
      console.debug(this.opus, `[${e.type}]`, 'playing', this.playing);
    });
    // 미디어 시킹이 완료되는 시점에 발생합니다.
    this.video.addEventListener('seeked', (e) => console.debug(this.opus, `[${e.type}]`, 'time', toTime(this.video.currentTime)));
    // 일시적인 버퍼 부족으로 재생이 정지된 시점에 발생합니다.
    this.video.addEventListener('waiting', (e) => {
      this.playing = false;
      console.debug(this.opus, `[${e.type}]`, 'playing', this.playing);
    });
    // 미디어가 끝까지 재생 완료 된 시점에 발생합니다.
    this.video.addEventListener('ended', (e) => console.debug(this.opus, `[${e.type}]`));
  }

  /**
   * flay 설정
   * @param {string} opus
   * @param {Flay} flay
   * @param {Actress[]} actress
   * @returns
   */
  set(opus, flay, actress) {
    this.#initiate(opus);

    this.video.poster = `/static/cover/${opus}`;
    this.video.src = `/stream/flay/movie/${opus}/0`;
    this.video.load();

    this.shadowRoot.querySelector('flay-studio').set(flay);
    this.shadowRoot.querySelector('flay-opus').set(flay);
    this.shadowRoot.querySelector('flay-title').set(flay);
    this.shadowRoot.querySelector('flay-actress').set(flay, actress);
    this.shadowRoot.querySelector('flay-release').set(flay);
    this.shadowRoot.querySelector('flay-rank').set(flay);
    this.shadowRoot.querySelector('flay-tag').set(flay);
    this.shadowRoot.querySelector('flay-tag').setCard();

    return new Promise((resolve, reject) => {
      const timer = setInterval(() => {
        if (this.loaded) {
          clearInterval(timer);
          resolve(true);
        }
        if (this.error) {
          clearInterval(timer);
          reject('Error: ' + this.opus);
        }
      }, 10);
    });
  }

  /**
   * video play
   */
  async play() {
    if (!this.playing) {
      await this.video.play();
    }
    await this.#wait(true);
  }

  /**
   * video seek and play
   * @param {number} seekTime
   */
  async seek(seekTime) {
    this.video.currentTime = seekTime;
    await this.play();
  }

  /**
   * video pause
   */
  async pause() {
    if (this.playing) {
      this.video.pause();
    }
    await this.#wait(false);
  }

  /**
   * the total duration of the media in seconds
   * @returns {number}
   */
  getDuration() {
    return this.duration;
  }
}

customElements.define('flay-video-player', FlayVideoPlayer);

export function toTime(seconds) {
  // Convert seconds to milliseconds
  return new Date(seconds * 1000).toISOString().slice(11, 19);
}
