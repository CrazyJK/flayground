import PlayTimeDB from '@flay/idb/PlayTimeDB';
import ApiClient from '@lib/ApiClient';
import './FlayVideoElement.scss';

// 싱글톤 패턴으로 변경하여 메모리 사용 최적화
let dbInstance = null;
function getDB() {
  if (!dbInstance) {
    dbInstance = new PlayTimeDB();
  }
  return dbInstance;
}

// 쓰로틀링을 위한 상수
const THROTTLE_DELAY = 5000; // 5초마다 DB 업데이트
const MAX_RECOVERY_ATTEMPTS = 2; // 최대 복구 시도 횟수

/**
 * 비디오 재생을 위한 커스텀 HTML Element
 *
 * @description HTML video 엘리먼트를 확장하여 다음 기능을 제공합니다:
 * - 재생 시간 자동 저장 (IndexedDB)
 * - 오류 복구 메커니즘
 * - 이벤트 기반 상태 관리
 * - 성능 최적화 (쓰로틀링, 메모리 관리)
 *
 * @fires FlayVideo#play - 재생 상태 변경 시 발생
 * @fires FlayVideo#volume - 볼륨 변경 시 발생
 * @fires FlayVideo#videoError - 비디오 오류 발생 시
 *
 * @example
 * ```html
 * <flay-video></flay-video>
 * ```
 *
 * @example
 * ```javascript
 * const video = document.querySelector('flay-video');
 * video.set('OPUS123');
 * video.play();
 * ```
 */
export default class FlayVideo extends HTMLElement {
  video: HTMLVideoElement;
  opus: string | null;
  loaded = false;
  playing = false;
  #eventListeners: Array<{ type: string; listener: () => void }> = []; // 이벤트 리스너 참조 저장
  #lastDbUpdateTime = 0; // 마지막 DB 업데이트 시간
  #errorHandler?: (type: string, message: string, opus: string | null, attempts: number) => void; // 오류 처리를 위한 핸들러
  #recoveryAttempts = 0; // 복구 시도 횟수
  #dbUpdateQueue = Promise.resolve(); // DB 업데이트를 위한 프로미스 큐
  #prevVolume: number | null = null; // 이전 볼륨 값
  #prevPlayingState: boolean | null = null; // 이전 재생 상태

  /**
   * Web Components 생성자
   * video 엘리먼트를 초기화하고 기본 속성을 설정합니다.
   */
  constructor() {
    super();
    this.video = this.appendChild(document.createElement('video'));
    this.video.preload = 'auto';
  }

  /**
   * 커스텀 엘리먼트가 DOM에 연결될 때 호출됩니다.
   * 비디오 이벤트 리스너를 등록합니다.
   */
  connectedCallback() {
    this.#addVideoEvent();
  }

  /**
   * 커스텀 엘리먼트가 DOM에서 분리될 때 호출됩니다.
   * 메모리 누수 방지를 위해 이벤트 리스너를 정리하고 현재 상태를 저장합니다.
   */
  disconnectedCallback() {
    // 등록된 모든 이벤트 리스너 제거
    this.#eventListeners.forEach(({ type, listener }) => {
      this.removeEventListener(type, listener);
    });
    this.#eventListeners = [];

    // 현재 상태 저장 (페이지 이동 등으로 인한 연결 해제 시)
    if (this.opus && this.video.currentTime > 0) {
      this.#throttledDbUpdate(true);
    }
  }

  /**
   * 비디오 소스를 설정하고 로드합니다.
   *
   * @param opus - 비디오 식별자 (OPUS 코드)
   *
   * @example
   * ```javascript
   * video.set('OPUS123');
   * ```
   */
  set(opus: string) {
    // 이전 재생 상태 정리
    if (this.opus && this.video.currentTime > 0) {
      this.#throttledDbUpdate(true);
    }

    this.opus = opus;
    this.loaded = false;
    this.playing = false;
    this.#recoveryAttempts = 0;
    this.video.poster = ApiClient.buildUrl(`/static/cover/${opus}`);
    this.video.src = ApiClient.buildUrl(`/stream/flay/movie/${opus}/0`);
    this.video.load();
  }

  /**
   * 비디오 재생을 시작합니다.
   *
   * @example
   * ```javascript
   * await video.play();
   * ```
   */
  async play() {
    await this.video.play();
  }

  pause() {
    this.video.pause();
  }

  /**
   * 쓰로틀링된 데이터베이스 업데이트 함수
   *
   * @description 성능 최적화를 위해 DB 업데이트를 쓰로틀링합니다.
   * 일정 시간 간격으로만 업데이트를 수행하여 과도한 DB 접근을 방지합니다.
   *
   * @param force - 강제 업데이트 여부 (기본값: false)
   */
  #throttledDbUpdate(force = false) {
    if (!this.opus || this.video.currentTime <= 0 || !this.duration) {
      return; // 유효한 데이터가 없으면 업데이트하지 않음
    }

    const now = Date.now();
    if (force || now - this.#lastDbUpdateTime > THROTTLE_DELAY) {
      this.#lastDbUpdateTime = now;

      // 비동기 작업을 큐에 추가하여 순차적으로 처리
      this.#dbUpdateQueue = this.#dbUpdateQueue.then(() => {
        return getDB()
          .update(this.opus, this.video.currentTime, this.duration)
          .catch((err) => {
            // DB 업데이트 실패 시 조용히 오류 처리
            console.error('Failed to update play time:', err);
          });
      });
    }
  }

  /**
   * 오류 핸들러 설정
   *
   * @description 비디오 오류 발생 시 호출될 커스텀 핸들러를 설정합니다.
   *
   * @param handler - 오류 처리 함수
   *
   * @example
   * ```javascript
   * video.setErrorHandler((type, message, opus, attempts) => {
   *   console.error(`Video error: ${type} - ${message}`);
   * });
   * ```
   */
  setErrorHandler(handler: (type: string, message: string, opus: string | null, attempts: number) => void) {
    this.#errorHandler = handler;
  }

  /**
   * 비디오 오류 처리 함수
   *
   * @description 비디오 오류 발생 시 호출되어 다음 작업을 수행합니다:
   * - 현재 재생 상태 저장
   * - videoError 커스텀 이벤트 발생
   * - 외부 핸들러 호출 (설정된 경우)
   * - 자동 복구 시도
   *
   * @param type - 오류 유형 ('error', 'abort' 등)
   * @param message - 오류 메시지
   *
   * @fires FlayVideo#videoError
   */
  #handleError(type: string, message: string) {
    // 현재 재생 상태 저장
    this.#throttledDbUpdate(true);

    // 커스텀 이벤트 발생
    this.dispatchEvent(
      new CustomEvent('videoError', {
        bubbles: false,
        composed: false,
        detail: {
          type,
          message,
          opus: this.opus,
          time: this.video.currentTime,
          duration: this.duration,
          attempts: this.#recoveryAttempts,
        },
      })
    );

    // 외부 핸들러가 설정된 경우 호출
    if (typeof this.#errorHandler === 'function') {
      this.#errorHandler(type, message, this.opus, this.#recoveryAttempts);
    }

    // 기본 오류 복구 시도
    this.#tryRecovery(type);
  }

  /**
   * 비디오 오류 복구 시도
   *
   * @description 오류 유형에 따라 적절한 복구 전략을 수행합니다:
   * - 'abort': 3초 후 비디오 재로드
   * - 'error': 대체 스트림 소스로 전환 또는 재시도
   *
   * @param type - 오류 유형
   */
  #tryRecovery(type: string): void {
    // 최대 복구 시도 횟수를 초과한 경우
    if (this.#recoveryAttempts >= MAX_RECOVERY_ATTEMPTS) {
      return;
    }

    this.#recoveryAttempts++;

    if (type === 'abort') {
      // 3초 후 다시 로드 시도
      setTimeout(() => {
        if (this.opus) {
          this.video.load();
        }
      }, 3000);
    } else if (type === 'error') {
      // 다른 스트림 소스로 전환 시도
      const currentSource = this.video.src;
      let newSource: string;

      if (currentSource.includes('/0')) {
        newSource = `/stream/flay/movie/${this.opus}/1`;
      } else if (currentSource.includes('/1')) {
        newSource = `/stream/flay/movie/${this.opus}/2`;
      } else {
        // 모든 스트림 소스 시도 실패시 재시도
        newSource = `/stream/flay/movie/${this.opus}/0?retry=${Date.now()}`;
      }

      // 새 소스 설정 및 로드
      this.video.src = ApiClient.buildUrl(newSource);
      this.video.load();

      // 이전에 재생 중이었다면 재생 시도
      if (this.#prevPlayingState) {
        const playPromise = this.video.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // 자동 재생 정책으로 인한 오류 무시
          });
        }
      }
    }
  }

  /**
   * HTMLMediaElement 이벤트 리스너를 등록합니다.
   *
   * @description 비디오 엘리먼트의 모든 중요 이벤트에 대한 핸들러를 등록합니다:
   * - 로드/재생 이벤트: loadeddata, playing, pause, ended
   * - 오류 이벤트: error, abort
   * - 상태 변경 이벤트: volumechange, seeking, timeupdate
   * - 네트워크 이벤트: online (window)
   */
  #addVideoEvent() {
    // 초기 상태 저장
    this.#prevVolume = this.volume;
    this.#prevPlayingState = false;

    // 오류 관련 이벤트 핸들링
    this.#addEventListenerWithTracking('error', () => {
      this.#handleError('error', this.video.error?.message || '비디오 로드 오류');
    });

    this.#addEventListenerWithTracking('abort', () => {
      this.#handleError('abort', '비디오 로드가 중단됨');
    });

    // 비디오 로드 및 재생 관련 이벤트
    this.#addEventListenerWithTracking('loadeddata', () => {
      this.loaded = true;
      // 복구 시도 카운터 리셋
      if (this.#recoveryAttempts > 0) {
        this.#recoveryAttempts = 0;
      }
    });

    this.#addEventListenerWithTracking('playing', () => this.#handlePlayStatusChange(true));

    // progress 이벤트에 쓰로틀링 적용
    this.#addEventListenerWithTracking('progress', () => this.#throttledDbUpdate());

    // 중요 이벤트에 강제 DB 업데이트 적용
    this.#addEventListenerWithTracking('pause', () => {
      this.#handlePlayStatusChange(false);
      this.#throttledDbUpdate(true);
    });

    this.#addEventListenerWithTracking('seeking', () => {
      // 시킹 시 DB 업데이트 (사용자가 특정 시점으로 이동했을 때)
      this.#throttledDbUpdate(true);
    });

    this.#addEventListenerWithTracking('waiting', () => this.#handlePlayStatusChange(false));

    this.#addEventListenerWithTracking('ended', () => {
      this.playing = false;
      this.#prevPlayingState = false;
      this.#throttledDbUpdate(true);
    });

    this.#addEventListenerWithTracking('volumechange', () => this.#handleVolumeChange());

    // 주기적 저장 - 5초마다 현재 상태 저장 (충돌 등으로 인한 데이터 손실 방지)
    this.#addEventListenerWithTracking('timeupdate', () => {
      if (this.playing) {
        this.#throttledDbUpdate();
      }
    });

    // 네트워크 상태 변경 이벤트 처리
    window.addEventListener('online', () => {
      // 네트워크 연결이 복구되면 비디오 다시 로드
      if (this.opus && !this.playing && this.video.error) {
        this.video.load();
      }
    });
  }

  /**
   * 이벤트 리스너를 추가하고 추적 목록에 등록합니다.
   *
   * @description 이벤트 리스너를 비디오 엘리먼트에 등록하고,
   * disconnectedCallback에서 정리할 수 있도록 추적 목록에 저장합니다.
   *
   * @param type - 이벤트 타입
   * @param listener - 이벤트 리스너 함수
   */
  #addEventListenerWithTracking(type: string, listener: () => void): void {
    this.video.addEventListener(type, listener);
    this.#eventListeners.push({ type, listener });
  }

  /**
   * 재생 상태 변경을 처리합니다.
   *
   * @description 재생 상태가 실제로 변경된 경우에만 'play' 커스텀 이벤트를 발생시킵니다.
   * 중복 이벤트 발생을 방지하여 성능을 최적화합니다.
   *
   * @param isPlay - 현재 재생 중인지 여부
   *
   * @fires FlayVideo#play
   */
  #handlePlayStatusChange(isPlay: boolean): void {
    // 상태가 변경된 경우에만 이벤트 발생
    if (this.playing !== isPlay) {
      this.playing = isPlay;
      this.#prevPlayingState = isPlay;

      this.dispatchEvent(
        new CustomEvent('play', {
          bubbles: false,
          composed: false,
          detail: { isPlay: this.playing },
        })
      );
    }
  }

  /**
   * 볼륨 변경을 처리합니다.
   *
   * @description 볼륨이 실제로 변경된 경우에만 'volume' 커스텀 이벤트를 발생시킵니다.
   * 중복 이벤트 발생을 방지하여 성능을 최적화합니다.
   *
   * @fires FlayVideo#volume
   */
  #handleVolumeChange(): void {
    // 볼륨이 실제로 변경된 경우에만 이벤트 발생
    if (this.video.volume !== this.#prevVolume) {
      this.#prevVolume = this.video.volume;

      this.dispatchEvent(
        new CustomEvent('volume', {
          bubbles: false,
          composed: false,
          detail: { volume: this.video.volume },
        })
      );
    }
  }

  /**
   * 현재 재생 시간을 가져옵니다.
   *
   * @returns 현재 재생 시간 (초)
   */
  get currentTime(): number {
    return this.video.currentTime;
  }

  /**
   * 재생 시간을 설정합니다.
   *
   * @param value - 설정할 재생 시간 (초)
   */
  set currentTime(value: number) {
    this.video.currentTime = value;
  }

  /**
   * 비디오의 총 길이를 가져옵니다.
   *
   * @returns 비디오 총 길이 (초)
   */
  get duration(): number {
    return this.video.duration;
  }

  /**
   * 현재 볼륨을 가져옵니다.
   *
   * @returns 현재 볼륨 (0.0 ~ 1.0)
   */
  get volume(): number {
    return this.video.volume;
  }

  /**
   * 볼륨을 설정합니다.
   *
   * @param value - 설정할 볼륨 (0.0 ~ 1.0)
   */
  set volume(value: number) {
    this.video.volume = value;
  }
}

customElements.define('flay-video', FlayVideo);
