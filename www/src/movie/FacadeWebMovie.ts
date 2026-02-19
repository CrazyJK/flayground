import GroundMovie from '@base/GroundMovie';
import ApiClient from '@lib/ApiClient';
import RandomUtils from '@lib/RandomUtils';
import './FacadeWebMovie.scss';

interface TodayItem {
  name: string;
  uuid: string;
}

interface FacadeWebMovieOptions {
  /** 비디오 볼륨 (0.0 ~ 1.0) */
  volume: number;
  /** 화면 대비 크기. landscape, portrait 중에 꽉 차는 쪽으로 자동 조정. */
  size?: string;
  /** 재생이 끝난 후 할 행동. 사라지기, 다음 비디오 재생, 멈추고 사용자 조작 대기 */
  endedBehavior?: 'remove' | 'next' | 'pause';
}

/**
 * 첫 페이지에 원형으로 표시되는 커스텀 비디오 Web Component입니다.
 *
 * - `/todayis` API에서 목록을 가져와 랜덤 순서로 순차 재생
 * - 모든 아이템을 소진하면 전체 목록에서 다시 랜덤 선택
 * - 재생 종료 후 동작은 `endedBehavior` 옵션으로 제어 (remove / next / pause)
 *
 * 사용자 인터랙션:
 * - click       : 음소거 토글
 * - wheel →     : 다음 비디오
 * - wheel ←     : 반복 재생 토글 (일시정지 상태면 재개)
 * - wheel ↑     : 볼륨 증가 (+10%)
 * - wheel ↓     : 볼륨 감소 (-10%)
 *
 * @example
 * const movie = new FacadeWebMovie({ volume: 0.3, endedBehavior: 'next' });
 * document.body.appendChild(movie);
 * await movie.isEnded(); // 첫 번째 비디오가 끝나거나 다음으로 넘어갈 때까지 대기
 */
export class FacadeWebMovie extends GroundMovie {
  private readonly options: FacadeWebMovieOptions;

  private video: HTMLVideoElement;
  private description: HTMLDivElement;

  private todayItems: TodayItem[] = [];
  private remainingItems: TodayItem[] = []; // 아직 선택되지 않은 아이템 목록
  private currentItem: TodayItem | null = null; // 현재 재생 중인 아이템
  private descriptionTimeout: ReturnType<typeof setTimeout> | null = null; // 설명 표시 타이머

  private boundLoadHandler: EventListener;
  private boundEndedHandler: EventListener;
  private boundErrorHandler: (error?: unknown) => void;
  private boundClickHandler: (event: MouseEvent) => void;
  private boundWheelHandler: (event: WheelEvent) => void;
  private wheelState = { timer: null as ReturnType<typeof setTimeout> | null, deltaX: 0, deltaY: 0 };
  private endedResolve: (() => void) | null = null; // isEnded() 대기 중인 resolver

  constructor(options: Partial<FacadeWebMovieOptions> = {}) {
    super();

    this.video = this.appendChild(document.createElement('video'));
    this.description = this.appendChild(document.createElement('div'));

    this.options = { volume: 0.5, size: '50%', endedBehavior: 'remove', ...options };

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
    this.video.src = '';
  }

  /**
   * 비디오 재생이 끝나는지 확인
   * - 이미 종료되었으면 즉시 resolve
   * - 비디오 자연 종료(ended 이벤트) 또는 사용자가 다음 비디오로 넘김(playNext 호출) 시 resolve
   */
  async isEnded(): Promise<boolean> {
    if (this.video.ended) return true;

    return new Promise<boolean>((resolve) => {
      const cleanup = () => {
        this.endedResolve = null;
        this.video.removeEventListener('ended', cleanup);
        resolve(true);
      };
      this.endedResolve = cleanup;
      this.video.addEventListener('ended', cleanup, { once: true });
    });
  }

  /**
   * 다음 비디오 재생
   * - todayItems에서 랜덤으로 아이템을 선택하여 재생
   * - 이전에 선택된 아이템은 remainingItems에서 제외하고 선택
   * - 모두 선택되면 todayItems 전체에서 다시 선택
   */
  private playNext(): void {
    // 복제된 배열이 없거나 비어있으면 todayItems로 다시 채움
    if (this.remainingItems.length === 0) {
      this.remainingItems = [...this.todayItems];
    }

    const randomIndex = RandomUtils.getRandomInt(0, this.remainingItems.length);
    this.currentItem = this.remainingItems.splice(randomIndex, 1)[0]!;
    this.video.src = ApiClient.buildUrl(`/todayis/stream/${this.currentItem.uuid}`);
  }

  /**
   * 비디오 로딩 시작 이벤트 처리
   * - 로딩 시작 시 스타일 설정
   */
  private handleVideoLoad(): void {
    this.video.loop = false;
    this.show();
    this.setDescription();
  }

  /**
   * 비디오 플레이 종료 이벤트 처리
   */
  private handleVideoEnded(): void {
    this.endedResolve?.(); // 비디오가 자연 종료됨 - isEnded() 대기 중이면 resolve

    switch (this.options.endedBehavior) {
      case 'next':
        this.playNext();
        break;
      case 'remove':
        this.show(false);
        this.remove();
        break;
      default: // pause
        this.show(false);
        break;
    }
  }

  /**
   * 비디오 클릭 이벤트 처리
   */
  private handleVideoClick(): void {
    // 클릭 시 음소거 토글
    this.video.muted = !this.video.muted;
    this.setDescription();
  }

  /**
   * 비디오 휠 이벤트 처리
   * @param accumulatedDeltaX 연속된 휠 이벤트의 누적 deltaX
   * @param accumulatedDeltaY 연속된 휠 이벤트의 누적 deltaY
   */
  private handleVideoWheel(accumulatedDeltaX: number, accumulatedDeltaY: number): void {
    const deltaX = Math.sign(accumulatedDeltaX);
    const deltaY = Math.sign(accumulatedDeltaY);

    if (deltaX > 0) {
      // 오른쪽 → 다음 비디오
      this.endedResolve?.();
      this.playNext();
    } else if (deltaX < 0) {
      // 왼쪽 ← 반복 재생 토글 (일시정지 상태면 재개)
      this.video.loop = !this.video.loop;
      if (this.video.paused) {
        this.show();
        this.video.play();
      }
    } else if (deltaY < 0) {
      // 위 ↑ 볼륨 증가
      this.video.volume = Math.min(1, this.video.volume + 0.1);
    } else if (deltaY > 0) {
      // 아래 ↓ 볼륨 감소
      this.video.volume = Math.max(0, this.video.volume - 0.1);
    }

    this.setDescription();
  }

  /**
   * 비디오 에러 및 API 에러 통합 처리
   * @param error 발생한 에러 객체 또는 MediaError 코드 정보
   */
  private handleVideoError(error?: unknown): void {
    if (error instanceof Error) {
      console.error('FacadeWebMovie:', error.message);
    } else {
      const code = this.video.error?.code;
      if (code !== MediaError.MEDIA_ERR_ABORTED) {
        console.warn(`FacadeWebMovie: 비디오 에러 (code: ${code})`);
      }
    }
  }

  /**
   * 현재 비디오 상태를 설명 텍스트로 표시
   * - name, volume, muted, loop 상태를 표시하고 3초 후 자동 숨김
   */
  private setDescription(): void {
    if (!this.currentItem) return;

    const flags = [this.video.muted && 'muted', this.video.loop && 'loop'].filter(Boolean).join(', ');
    const status = `Vol. ${Math.round(this.video.volume * 100)}${flags ? `, ${flags}` : ''}`;
    this.description.innerHTML = `${this.currentItem.name}<br>${status}`;
    this.show(true, this.description);
    clearTimeout(this.descriptionTimeout ?? undefined);
    this.descriptionTimeout = setTimeout(() => this.show(false, this.description), 3000);
  }

  /**
   * 요소의 표시 상태를 토글
   * @param show 표시 여부 (기본값: true)
   * @param el 대상 요소 (기본값: this)
   */
  private show(show: boolean = true, el: HTMLElement = this): void {
    el.classList.toggle('show', show);
  }
}

customElements.define('facade-web-movie', FacadeWebMovie);
