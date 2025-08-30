import GroundMovie from '@base/GroundMovie';
import ApiClient from '@lib/ApiClient';
import RandomUtils from '@lib/RandomUtils';
import './FacadeWebMovie.scss';

interface TodayItem {
  name: string;
  uuid: string;
}

interface FacadeWebMovieOptions {
  volume: number;
  /**
   * 비디오가 끝나면 다음 비디오로 넘어갑니다.
   */
  continue: boolean;
  width?: string;
  maxWidth?: string;
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
    continue: false,
  };
  private video: HTMLVideoElement;
  private todayItems: TodayItem[] = [];
  private movieIndex = -1;

  #boundLoadHandler: EventListener;
  #boundErrorHandler: EventListener;
  #boundEndedHandler: EventListener;
  #boundClickHandler: EventListener;

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

    if (this.options.width) this.video.style.width = this.options.width;
    if (this.options.maxWidth) this.video.style.maxWidth = this.options.maxWidth;
  }

  connectedCallback(): void {
    this.video.addEventListener('loadstart', this.#boundLoadHandler); // 로딩 시작 시 스타일 설정
    this.video.addEventListener('ended', this.#boundEndedHandler); // 비디오 종료 시 페이드 아웃 애니메이션
    this.video.addEventListener('error', this.#boundErrorHandler); // 에러 처리
    this.video.addEventListener('click', this.#boundClickHandler);

    ApiClient.get<TodayItem[]>('/todayis')
      .then((todayItems) => {
        if (todayItems !== null && todayItems.length > 0) {
          this.todayItems = todayItems;
          this.movieIndex = RandomUtils.getRandomInt(0, todayItems.length - 1);
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

  private playNext(): void {
    this.movieIndex = (this.movieIndex + 1) % this.todayItems.length;
    const randomTodayItem = this.todayItems[this.movieIndex]!;
    this.video.src = ApiClient.buildUrl(`/todayis/stream/${randomTodayItem.uuid}`);
    console.log('FacadeWebMovie: 선택된 다음 아이템', randomTodayItem);
  }

  /**
   * 비디오 로딩 시작 이벤트 처리
   * - 로딩 시작 시 스타일 설정
   */
  private handleVideoLoad(): void {
    this.style.opacity = '1';
  }

  /**
   * 비디오 플레이 종료 이벤트 처리
   * - 페이드 아웃 애니메이션 처리
   */
  private handleVideoEnded(): void {
    if (this.options.continue) {
      this.playNext(); // 다음 비디오로 교체
    } else {
      this.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: this.fadeOutDuration,
        fill: 'forwards',
        easing: 'ease-out',
      }).onfinish = () => {
        this.remove();
      };
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
