import PlayTimeDB from '@flay/idb/PlayTimeDB';
import ApiClient from '@lib/ApiClient';

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

export default class FlayVideo extends HTMLVideoElement {
  opus;
  loaded = false;
  playing = false;
  #eventListeners = []; // 이벤트 리스너 참조 저장
  #lastDbUpdateTime = 0; // 마지막 DB 업데이트 시간
  #errorHandler; // 오류 처리를 위한 핸들러
  #recoveryAttempts = 0; // 복구 시도 횟수
  #dbUpdateQueue = Promise.resolve(); // DB 업데이트를 위한 프로미스 큐
  #prevVolume; // 이전 볼륨 값
  #prevPlayingState; // 이전 재생 상태

  constructor() {
    super();
    this.preload = 'auto';
  }

  connectedCallback() {
    this.#addVideoEvent();
  }

  // 연결 해제시 정리 작업
  disconnectedCallback() {
    // 등록된 모든 이벤트 리스너 제거
    this.#eventListeners.forEach(({ type, listener }) => {
      this.removeEventListener(type, listener);
    });
    this.#eventListeners = [];

    // 현재 상태 저장 (페이지 이동 등으로 인한 연결 해제 시)
    if (this.opus && this.currentTime > 0) {
      this.#throttledDbUpdate(true);
    }
  }

  set(opus) {
    // 이전 재생 상태 정리
    if (this.opus && this.currentTime > 0) {
      this.#throttledDbUpdate(true);
    }

    this.opus = opus;
    this.loaded = false;
    this.playing = false;
    this.#recoveryAttempts = 0;
    this.poster = ApiClient.buildUrl(`/static/cover/${opus}`);
    this.src = `/stream/flay/movie/${opus}/0`;
    this.load();
  }

  /**
   * 쓰로틀링된 데이터베이스 업데이트 함수
   * @param {boolean} force 강제 업데이트 여부
   */
  #throttledDbUpdate(force = false) {
    if (!this.opus || this.currentTime <= 0 || !this.duration) {
      return; // 유효한 데이터가 없으면 업데이트하지 않음
    }

    const now = Date.now();
    if (force || now - this.#lastDbUpdateTime > THROTTLE_DELAY) {
      this.#lastDbUpdateTime = now;

      // 비동기 작업을 큐에 추가하여 순차적으로 처리
      this.#dbUpdateQueue = this.#dbUpdateQueue.then(() => {
        return getDB()
          .update(this.opus, this.currentTime, this.duration)
          .catch((err) => {
            // DB 업데이트 실패 시 조용히 오류 처리
            console.error('Failed to update play time:', err);
          });
      });
    }
  }

  /**
   * 오류 핸들러 설정
   * @param {Function} handler 오류 처리 함수
   */
  setErrorHandler(handler) {
    this.#errorHandler = handler;
  }

  /**
   * 오류 처리 함수
   * @param {Event} event 이벤트 객체
   * @param {string} type 오류 유형
   * @param {string} message 오류 메시지
   */
  #handleError(event, type, message) {
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
          time: this.currentTime,
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
   * 오류 복구 시도
   * @param {string} type 오류 유형
   */
  #tryRecovery(type) {
    // 최대 복구 시도 횟수를 초과한 경우
    if (this.#recoveryAttempts >= MAX_RECOVERY_ATTEMPTS) {
      return;
    }

    this.#recoveryAttempts++;

    if (type === 'abort') {
      // 3초 후 다시 로드 시도
      setTimeout(() => {
        if (this.opus) {
          this.load();
        }
      }, 3000);
    } else if (type === 'error') {
      // 다른 스트림 소스로 전환 시도
      const currentSource = this.src;
      let newSource;

      if (currentSource.includes('/0')) {
        newSource = `/stream/flay/movie/${this.opus}/1`;
      } else if (currentSource.includes('/1')) {
        newSource = `/stream/flay/movie/${this.opus}/2`;
      } else {
        // 모든 스트림 소스 시도 실패시 재시도
        newSource = `/stream/flay/movie/${this.opus}/0?retry=${Date.now()}`;
      }

      // 새 소스 설정 및 로드
      this.src = newSource;
      this.load();

      // 이전에 재생 중이었다면 재생 시도
      if (this.#prevPlayingState) {
        const playPromise = this.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // 자동 재생 정책으로 인한 오류 무시
          });
        }
      }
    }
  }

  /**
   * HTMLMediaElement 이벤트를 추가합니다.
   */
  #addVideoEvent() {
    // 초기 상태 저장
    this.#prevVolume = this.volume;
    this.#prevPlayingState = false;

    // 오류 관련 이벤트 핸들링
    this.#addEventListenerWithTracking('error', (e) => {
      this.#handleError(e, 'error', this.error?.message || '비디오 로드 오류');
    });

    this.#addEventListenerWithTracking('abort', (e) => {
      this.#handleError(e, 'abort', '비디오 로드가 중단됨');
    });

    // 비디오 로드 및 재생 관련 이벤트
    this.#addEventListenerWithTracking('loadeddata', () => {
      this.loaded = true;
      // 복구 시도 카운터 리셋
      if (this.#recoveryAttempts > 0) {
        this.#recoveryAttempts = 0;
      }
    });

    this.#addEventListenerWithTracking('playing', (e) => this.#handlePlayStatusChange(e, true));

    // progress 이벤트에 쓰로틀링 적용
    this.#addEventListenerWithTracking('progress', () => this.#throttledDbUpdate());

    // 중요 이벤트에 강제 DB 업데이트 적용
    this.#addEventListenerWithTracking('pause', (e) => {
      this.#handlePlayStatusChange(e, false);
      this.#throttledDbUpdate(true);
    });

    this.#addEventListenerWithTracking('seeking', () => {
      // 시킹 시 DB 업데이트 (사용자가 특정 시점으로 이동했을 때)
      this.#throttledDbUpdate(true);
    });

    this.#addEventListenerWithTracking('waiting', (e) => this.#handlePlayStatusChange(e, false));

    this.#addEventListenerWithTracking('ended', () => {
      this.playing = false;
      this.#prevPlayingState = false;
      this.#throttledDbUpdate(true);
    });

    this.#addEventListenerWithTracking('volumechange', (e) => this.#handleVolumeChange(e));

    // 주기적 저장 - 5초마다 현재 상태 저장 (충돌 등으로 인한 데이터 손실 방지)
    this.#addEventListenerWithTracking('timeupdate', () => {
      if (this.playing) {
        this.#throttledDbUpdate();
      }
    });

    // 네트워크 상태 변경 이벤트 처리
    window.addEventListener('online', () => {
      // 네트워크 연결이 복구되면 비디오 다시 로드
      if (this.opus && !this.playing && this.error) {
        this.load();
      }
    });
  }

  /**
   * 이벤트 리스너를 추가하고 추적합니다.
   * @param {string} type 이벤트 타입
   * @param {Function} listener 이벤트 리스너
   */
  #addEventListenerWithTracking(type, listener) {
    this.addEventListener(type, listener);
    this.#eventListeners.push({ type, listener });
  }

  #handlePlayStatusChange(e, isPlay) {
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

  #handleVolumeChange(e) {
    // 볼륨이 실제로 변경된 경우에만 이벤트 발생
    if (this.volume !== this.#prevVolume) {
      this.#prevVolume = this.volume;

      this.dispatchEvent(
        new CustomEvent('volume', {
          bubbles: false,
          composed: false,
          detail: { volume: this.volume },
        })
      );
    }
  }
}

customElements.define('flay-video', FlayVideo, { extends: 'video' });
