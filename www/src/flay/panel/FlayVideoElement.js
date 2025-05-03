import TimeUtils from '../../lib/TimeUtils';
import PlayTimeDB from '../idb/PlayTimeDB';

const db = new PlayTimeDB();

export default class FlayVideo extends HTMLVideoElement {
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
    this.addEventListener('emptied', (e) => this.#handleDummy(e));

    /* 브라우저가 리소스를 로드하기 시작하는 시점에 발생합니다. */
    this.addEventListener('loadstart', (e) => this.#handleDummy(e));
    /* 메타데이터가 로드 된 시점에 발생합니다. */
    this.addEventListener('loadedmetadata', (e) => this.#handleDummy(e));
    /* 미디어의 첫번째 프레임이 로딩 완료된 시점에 발생합니다. */
    this.addEventListener('loadeddata', (e) => {
      this.loaded = true;
      this.#handleDummy(e);
    });

    /* User agent가 미디어를 재생 가능한 시점에 발생합니다. 다만 전체 미디어를 재생하기 위해서는 콘텐츠의 버퍼링이 더 필요할 수 있습니다. */
    this.addEventListener('canplay', (e) => this.#handleDummy(e));
    /* 추가 버퍼링 없이 전체 미디어를 재생할 수 있는 시점에 발생합니다. */
    this.addEventListener('canplaythrough', (e) => this.#handleDummy(e));

    /* HTMLMediaElement.play() 메소드 호출이나 autoplay 속성에 의해 paused 프로퍼티가 true 에서 false로 전환되는 시점에 발생합니다. */
    this.addEventListener('play', (e) => this.#handleDummy(e));
    /* 일시 정지 되거나 버퍼 부족으로 재생 정지 된 이후 재생 가능한 시점에 발생합니다. */
    this.addEventListener('playing', (e) => this.#handlePlayStatusChange(e, true));

    /* currentTime 속성이 변경되는 시점에 발생합니다. */
    this.addEventListener('timeupdate', (e) => this.#handleDummy(e));
    /* 브라우저가 리소르를 로딩 중일 때 주기적으로 발생합니다. */
    this.addEventListener('progress', (e) => {
      db.update(this.opus, this.currentTime, this.duration);
      this.#handleDummy(e);
    });
    /* 미디어 로딩이 중지된 시점에 발생합니다. */
    this.addEventListener('suspend', (e) => this.#handleDummy(e));

    /* 미디어 시킹이 시작되는 시점에 발생합니다. */
    this.addEventListener('seeking', (e) => this.#handleDummy(e));
    /* 미디어 시킹이 완료되는 시점에 발생합니다. */
    this.addEventListener('seeked', (e) => this.#handleDummy(e));

    /* 미디어 일시 정지를 요청하고 paused 상태로 진입하는 시점에 발생합니다. 일반적으로 HTMLMediaElement.pause() 메소드가 호출되는 시점입니다 */
    this.addEventListener('pause', (e) => this.#handlePlayStatusChange(e, false));

    /* 일시적인 버퍼 부족으로 재생이 정지된 시점에 발생합니다. */
    this.addEventListener('waiting', (e) => this.#handlePlayStatusChange(e, false));

    /* 미디어가 끝까지 재생 완료 된 시점에 발생합니다. */
    this.addEventListener('ended', (e) => this.#handleDummy(e));

    /* 볼륨이 변경되는 시점에 발생합니다. */
    this.addEventListener('volumechange', (e) => this.#handleVolumeChange(e));
  }

  #handlePlayStatusChange(e, isPlay) {
    this.playing = isPlay;
    console.log('🎥', this.opus, `[${e.type}]`, 'playing', this.playing, 'time', TimeUtils.toTime(this.currentTime));
    this.dispatchEvent(new CustomEvent('play', { bubbles: true, composed: true, detail: { isPlay: this.playing } }));
  }

  #handleVolumeChange(e) {
    console.log('🎥', this.opus, `[${e.type}]`, this.volume);
    this.dispatchEvent(new CustomEvent('volume', { bubbles: true, composed: true, detail: { volume: this.volume } }));
  }

  #handleDummy(e) {
    // console.debug('🎦', this.opus, `[${e.type}]`, 'time', TimeUtils.toTime(this.currentTime), 'duration', TimeUtils.toTime(this.duration));
  }
}

customElements.define('flay-video', FlayVideo, { extends: 'video' });
