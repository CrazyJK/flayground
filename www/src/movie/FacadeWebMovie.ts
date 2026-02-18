import GroundMovie from '@base/GroundMovie';
import ApiClient from '@lib/ApiClient';
import RandomUtils from '@lib/RandomUtils';
import './FacadeWebMovie.scss';

interface TodayItem {
  name: string;
  uuid: string;
}

interface FacadeWebMovieOptions {
  /**
   * 비디오 볼륨 (0.0 ~ 1.0)
   */
  volume: number;
  /**
   * 비디오 너비 (예: '100%', '300px' 등)
   */
  width?: string;
  /**
   * 최대 너비 (예: '100%', '300px' 등)
   */
  maxWidth?: string;
  /**
   * 재생이 끝난 후 할 행동. 사라지기, 다음 비디오 재생, 멈추고 사용자 조작 대기 등
   */
  stopBehavior?: 'fadeOut' | 'next' | 'pause';
}

/**
 * FacadeWebMovie.ts
 *
 * 첫페이지에서 짧은 동영상을 보여주는 커스텀 비디오 엘리먼트입니다.
 * 이 비디오는 자동 재생되며, 끝나면 서서히 사라집니다.
 * 스타일링을 통해 원형 모양으로 표시되며, 크기와 위치가 조정됩니다.
 */
export class FacadeWebMovie extends GroundMovie {
  private readonly fadeOutDuration = 1000; // 페이드 아웃 지속 시간 (ms)
  private readonly options: FacadeWebMovieOptions = {
    volume: 0.5,
    stopBehavior: 'pause',
  };

  private video: HTMLVideoElement;
  private todayItems: TodayItem[] = [];
  private remainingItems: TodayItem[] = []; // 아직 선택되지 않은 아이템 목록

  #boundLoadHandler: EventListener;
  #boundErrorHandler: EventListener;
  #boundEndedHandler: EventListener;
  #boundClickHandler: (event: MouseEvent) => void;
  #boundWheelHandler: (event: WheelEvent) => void;
  #wheelTimer: ReturnType<typeof setTimeout> | null = null;
  #wheelAccumulatedDeltaY = 0;
  #wheelAccumulatedDeltaX = 0;

  constructor(options: Partial<FacadeWebMovieOptions> = {}) {
    super();

    this.options = { ...this.options, ...options };

    this.video = this.appendChild(document.createElement('video'));

    // 비디오 속성 설정
    this.video.autoplay = true;
    this.video.playsInline = true; // 모바일에서 인라인 재생
    this.video.loop = false;
    this.video.volume = this.options.volume;

    this.#boundLoadHandler = this.handleVideoLoad.bind(this);
    this.#boundEndedHandler = this.handleVideoEnded.bind(this);
    this.#boundErrorHandler = this.handleVideoError.bind(this);
    this.#boundClickHandler = this.handleVideoClick.bind(this);

    // 연속 휠 이벤트의 deltaY를 누적하다가 마지막 이벤트 후 한 번에 처리
    const wheelHandler = this.handleVideoWheel.bind(this);
    this.#boundWheelHandler = (event: WheelEvent) => {
      event.preventDefault();
      this.#wheelAccumulatedDeltaX += event.deltaX;
      this.#wheelAccumulatedDeltaY += event.deltaY;
      if (this.#wheelTimer !== null) clearTimeout(this.#wheelTimer);
      this.#wheelTimer = setTimeout(() => {
        this.#wheelTimer = null;
        wheelHandler(event, this.#wheelAccumulatedDeltaX, this.#wheelAccumulatedDeltaY);
        this.#wheelAccumulatedDeltaX = 0;
        this.#wheelAccumulatedDeltaY = 0;
      }, 300);
    };

    if (this.options.width) this.video.style.width = this.options.width;
    if (this.options.maxWidth) this.video.style.maxWidth = this.options.maxWidth;
  }

  connectedCallback(): void {
    this.video.addEventListener('loadstart', this.#boundLoadHandler); // 로딩 시작 시 스타일 설정
    this.video.addEventListener('ended', this.#boundEndedHandler); // 비디오 종료 처리
    this.video.addEventListener('error', this.#boundErrorHandler); // 에러 처리
    this.video.addEventListener('click', this.#boundClickHandler); // 클릭 시 음소거 토글 또는 다음 비디오 재생
    this.video.addEventListener('wheel', this.#boundWheelHandler); // 휠 이벤트로 볼륨 조절

    ApiClient.get<TodayItem[]>('/todayis')
      .then((todayItems) => {
        if (todayItems !== null && todayItems.length > 0) {
          this.todayItems = todayItems;
          this.playNext(); // 첫 비디오 재생
        } else {
          console.warn('FacadeWebMovie: API 응답 형식이 올바르지 않습니다.');
        }
      })
      .catch((error: unknown) => {
        console.error('FacadeWebMovie: API 호출 실패:', error);
        this.handleVideoError();
      });
  }

  disconnectedCallback(): void {
    this.video.removeEventListener('loadstart', this.#boundLoadHandler);
    this.video.removeEventListener('ended', this.#boundEndedHandler);
    this.video.removeEventListener('error', this.#boundErrorHandler);
    this.video.removeEventListener('click', this.#boundClickHandler);
    this.video.pause();
    this.video.src = ''; // 비디오 소스 초기화
  }

  /**
   * 무작위로 TodayItem 선택
   * - todayItems 배열에서 무작위로 하나의 아이템을 선택하여 반환합니다.
   * - 다음 수행시는 이전 선택된 아이템 제외하고 랜덤 선택
   * - 더 선택할 아이템이 없으면 todayItems 배열 전체에서 다시 선택
   * @returns 선택된 TodayItem
   */
  private pickRandomTodayItem(): TodayItem {
    if (this.todayItems.length === 0) {
      throw new Error('Today items are not loaded yet.');
    }
    // 복제된 배열이 없거나 비어있으면 todayItems로 다시 채움
    if (!this.remainingItems || this.remainingItems.length === 0) {
      this.remainingItems = [...this.todayItems];
    }

    const randomIndex = RandomUtils.getRandomInt(0, this.remainingItems.length);
    const selectedItem = this.remainingItems[randomIndex]!;

    // 선택된 아이템을 배열에서 제거
    this.remainingItems.splice(randomIndex, 1);

    return selectedItem;
  }

  /**
   * 다음 비디오 재생
   */
  private playNext(): void {
    const todayItem = this.pickRandomTodayItem();
    this.video.src = ApiClient.buildUrl(`/todayis/stream/${todayItem.uuid}`);
  }

  /**
   * 페이드 아웃 애니메이션 후 요소 제거
   */
  private fadeOutAndRemove(): void {
    this.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: this.fadeOutDuration,
      fill: 'forwards',
      easing: 'ease-out',
    }).onfinish = () => {
      this.remove();
    };
  }

  /**
   * 비디오 로딩 시작 이벤트 처리
   * - 로딩 시작 시 스타일 설정
   */
  private handleVideoLoad(): void {
    this.style.opacity = '1';
    this.video.muted = false; // 로딩이 시작되면 음소거 해제
  }

  /**
   * 비디오 플레이 종료 이벤트 처리
   * - 페이드 아웃 애니메이션 처리
   */
  private handleVideoEnded(): void {
    switch (this.options.stopBehavior) {
      case 'next':
        this.playNext();
        break;
      case 'pause':
        // 재생이 종료되었으므로, 추가로 할게 없다.
        break;
      default:
        this.fadeOutAndRemove();
        break;
    }
  }

  /**
   * 비디오 에러 이벤트 처리
   * - 에러 메시지 출력 및 요소 숨기기
   */
  private handleVideoError(): void {
    console.warn('FacadeWebMovie: 비디오 로딩에 실패했습니다.');
    this.style.display = 'none';
  }

  /**
   * 비디오 클릭 이벤트 처리
   * - 음소거 토글
   */
  private handleVideoClick(): void {
    this.video.muted = !this.video.muted;
  }

  /**
   * 비디오 휠 이벤트 처리
   * @param event
   */
  private handleVideoWheel(event: WheelEvent, accumulatedDeltaX = event.deltaX, accumulatedDeltaY = event.deltaY): void {
    const deltaX = Math.sign(accumulatedDeltaX);
    const deltaY = Math.sign(accumulatedDeltaY);
    if (deltaX !== 0) {
      // 다음 비디오
      this.playNext();
      return;
    }
    if (!this.video.ended) {
      if (deltaY < 0) {
        // 휠을 위로 올릴 때 볼륨 증가
        this.video.volume = Math.min(1, this.video.volume + 0.1);
      } else if (deltaY > 0) {
        // 휠을 아래로 내릴 때 볼륨 감소
        this.video.volume = Math.max(0, this.video.volume - 0.1);
      }
    }
  }

  /**
   * 재생이 끝나는지 확인
   * - 이미 끝났으면 즉시 resolve, 아니면 ended 이벤트를 기다림
   */
  async isEnded(): Promise<boolean> {
    if (this.video.ended) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return true;
    }

    return new Promise<boolean>((resolve) => {
      this.video.addEventListener(
        'ended',
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          resolve(true);
        },
        { once: true }
      );
    });
  }
}

customElements.define('facade-web-movie', FacadeWebMovie);
