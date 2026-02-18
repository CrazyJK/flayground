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
   * 비디오 크기. 화면 대비 너비 %. landscape, portrait 중에 꽉 차는 쪽으로 자동 조정됩니다. (예: '50%')
   */
  size?: string;
  /**
   * 재생이 끝난 후 할 행동. 사라지기, 다음 비디오 재생, 멈추고 사용자 조작 대기 등
   */
  endedBehavior?: 'fadeOut' | 'next' | 'pause';
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
  private readonly options: FacadeWebMovieOptions;

  private video: HTMLVideoElement;
  private todayItems: TodayItem[] = [];
  private remainingItems: TodayItem[] = []; // 아직 선택되지 않은 아이템 목록

  private boundLoadHandler: EventListener;
  private boundEndedHandler: EventListener;
  private boundErrorHandler: (error?: unknown) => void;
  private boundClickHandler: (event: MouseEvent) => void;
  private boundWheelHandler: (event: WheelEvent) => void;
  private wheelState = { timer: null as ReturnType<typeof setTimeout> | null, deltaX: 0, deltaY: 0 };
  private endedResolve: (() => void) | null = null; // isEnded() 대기 중인 resolver

  constructor(options: Partial<FacadeWebMovieOptions> = {}) {
    super();

    this.options = { volume: 0.5, endedBehavior: 'pause', size: '80%', ...options };

    this.video = this.appendChild(document.createElement('video'));

    // 비디오 속성 설정
    this.video.autoplay = true;
    this.video.playsInline = true; // 모바일에서 인라인 재생
    this.video.loop = false;
    this.video.volume = this.options.volume;

    this.boundLoadHandler = this.handleVideoLoad.bind(this);
    this.boundEndedHandler = this.handleVideoEnded.bind(this);
    this.boundErrorHandler = this.handleVideoError.bind(this);
    this.boundClickHandler = this.handleVideoClick.bind(this);

    // 연속 휠 이벤트의 deltaX/Y를 누적하다가 마지막 이벤트 후 한 번에 처리
    this.boundWheelHandler = (event: WheelEvent) => {
      event.preventDefault();
      this.wheelState.deltaX += event.deltaX;
      this.wheelState.deltaY += event.deltaY;
      if (this.wheelState.timer !== null) clearTimeout(this.wheelState.timer);
      this.wheelState.timer = setTimeout(() => {
        const { deltaX, deltaY } = this.wheelState;
        this.wheelState = { timer: null, deltaX: 0, deltaY: 0 };
        this.handleVideoWheel(deltaX, deltaY);
      }, 300);
    };

    if (this.options.size) {
      this.style.height = this.options.size;
      this.style.width = this.options.size;
    }
  }

  connectedCallback(): void {
    this.video.addEventListener('loadstart', this.boundLoadHandler); // 로딩 시작 시 스타일 설정
    this.video.addEventListener('ended', this.boundEndedHandler); // 비디오 종료 처리
    this.video.addEventListener('error', this.boundErrorHandler as EventListener); // 에러 처리
    this.video.addEventListener('click', this.boundClickHandler); // 클릭 시 음소거 토글 또는 다음 비디오 재생
    this.video.addEventListener('wheel', this.boundWheelHandler); // 휠 이벤트로 볼륨 조절

    ApiClient.get<TodayItem[]>('/todayis')
      .then((todayItems) => {
        if (todayItems === null || todayItems.length === 0) {
          throw new Error('FacadeWebMovie: API 응답 형식이 올바르지 않습니다.');
        }
        this.todayItems = todayItems;
        this.playNext(); // 첫 비디오 재생
      })
      .catch(this.boundErrorHandler);
  }

  disconnectedCallback(): void {
    this.video.removeEventListener('loadstart', this.boundLoadHandler);
    this.video.removeEventListener('ended', this.boundEndedHandler);
    this.video.removeEventListener('error', this.boundErrorHandler as EventListener);
    this.video.removeEventListener('click', this.boundClickHandler);
    this.video.removeEventListener('wheel', this.boundWheelHandler);
    if (this.wheelState.timer !== null) clearTimeout(this.wheelState.timer);
    this.video.pause();
    this.video.src = ''; // 비디오 소스 초기화
  }

  /**
   * 다음 비디오 재생
   * - todayItems에서 랜덤으로 아이템을 선택하여 재생
   * - 이전에 선택된 아이템은 remainingItems에서 제외하고 선택
   * - 모두 선택되면 todayItems 전체에서 다시 선택
   */
  private playNext(): void {
    // isEnded()가 대기 중이면 resolve (사용자 액션으로 다음 비디오 이동)
    this.endedResolve?.();

    // 복제된 배열이 없거나 비어있으면 todayItems로 다시 채움
    if (this.remainingItems.length === 0) {
      this.remainingItems = [...this.todayItems];
    }

    const randomIndex = RandomUtils.getRandomInt(0, this.remainingItems.length);
    const todayItem = this.remainingItems.splice(randomIndex, 1)[0]!;

    this.video.src = ApiClient.buildUrl(`/todayis/stream/${todayItem.uuid}`);
    this.video.title = todayItem.name;
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
    this.video.loop = false;
  }

  /**
   * 비디오 플레이 종료 이벤트 처리
   * - 페이드 아웃 애니메이션 처리
   */
  private handleVideoEnded(): void {
    switch (this.options.endedBehavior) {
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
   * 비디오 에러 및 API 에러 통합 처리
   * - error가 Error 인스턴스면 API/로직 에러로 처리 → 요소 숨기기
   * - 그 외(미지정 또는 Event)는 MediaError 코드에 따라 분기
   *   - MEDIA_ERR_ABORTED(1): 사용자 중단 시 무시
   *   - MEDIA_ERR_NETWORK(2), MEDIA_ERR_DECODE(3), MEDIA_ERR_SRC_NOT_SUPPORTED(4): 다음 비디오로 이동
   */
  private handleVideoError(error?: unknown): void {
    // API 에러 또는 로직 에러 (Error 인스턴스)
    if (error instanceof Error) {
      console.error('FacadeWebMovie:', error.message);
      this.style.display = 'none';
      return;
    }

    // video MediaError 처리
    const mediaError = this.video.error;

    if (!mediaError) {
      console.warn('FacadeWebMovie: 알 수 없는 비디오 에러');
      this.style.display = 'none';
      return;
    }

    switch (mediaError.code) {
      case MediaError.MEDIA_ERR_ABORTED:
        // 사용자에 의한 중단 - 무시
        console.info('FacadeWebMovie: 비디오 재생이 중단되었습니다.');
        break;

      case MediaError.MEDIA_ERR_NETWORK:
      case MediaError.MEDIA_ERR_DECODE:
      case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
        console.warn(`FacadeWebMovie: 비디오 에러 (code: ${mediaError.code}) → 다음 비디오로 이동`);
        if (this.todayItems.length > 0) this.playNext();
        else this.style.display = 'none';
        break;

      default:
        console.warn(`FacadeWebMovie: 비디오 에러 (code: ${mediaError.code}): ${mediaError.message}`);
        this.style.display = 'none';
    }
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
  private handleVideoWheel(accumulatedDeltaX: number, accumulatedDeltaY: number): void {
    const deltaX = Math.sign(accumulatedDeltaX);
    const deltaY = Math.sign(accumulatedDeltaY);
    if (deltaX > 0) {
      // 다음 비디오
      this.playNext();
    } else if (deltaX < 0) {
      // 반복 재생
      this.video.loop = true;
    } else if (deltaY < 0) {
      // 휠을 위로 올릴 때 볼륨 증가
      this.video.volume = Math.min(1, this.video.volume + 0.1);
    } else if (deltaY > 0) {
      // 휠을 아래로 내릴 때 볼륨 감소
      this.video.volume = Math.max(0, this.video.volume - 0.1);
    }
  }

  /**
   * 비디오 재생이 끝나는지 확인
   * - 이미 종료되었으면 즉시 resolve
   * - 비디오 자연 종료(ended 이벤트) 또는 사용자가 다음 비디오로 넘김(playNext 호출) 시 resolve
   */
  async isEnded(): Promise<boolean> {
    if (this.video.ended) return true;

    return new Promise<boolean>((resolve) => {
      const done = () => {
        this.endedResolve = null;
        this.video.removeEventListener('ended', onEnded);
        resolve(true);
      };
      const onEnded = () => done();

      this.endedResolve = done;
      this.video.addEventListener('ended', onEnded, { once: true });
    });
  }
}

customElements.define('facade-web-movie', FacadeWebMovie);
