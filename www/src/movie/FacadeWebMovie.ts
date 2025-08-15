import GroundMovie from '@base/GroundMovie';
import ApiClient from '@lib/ApiClient';
import RandomUtils from '@lib/RandomUtils';
import './FacadeWebMovie.scss';

interface TodayItem {
  name: string;
  uuid: string;
}

/**
 * FacadeWebMovie.ts
 *
 * 첫페이지에서 짧은 동영상을 보여주는 커스텀 비디오 엘리먼트입니다.
 * 이 비디오는 자동 재생되며, 끝나면 서서히 사라집니다.
 * 스타일링을 통해 원형 모양으로 표시되며, 크기와 위치가 조정됩니다.
 */
export class FacadeWebMovie extends GroundMovie {
  private fadeOutDuration = 1000; // 페이드 아웃 지속 시간 (ms)
  private video: HTMLVideoElement;

  constructor() {
    super();

    this.video = this.appendChild(document.createElement('video'));

    // 비디오 속성 설정
    this.video.autoplay = true;
    this.video.loop = false;
    this.video.playsInline = true; // 모바일에서 인라인 재생
    this.video.volume = 0.5;
    // this.video.muted = true; // 자동 재생을 위해 음소거 설정

    this.video.addEventListener('loadstart', this.handleLoadStart.bind(this)); // 로딩 시작 시 스타일 설정
    this.video.addEventListener('error', this.handleVideoError.bind(this)); // 에러 처리
    this.video.addEventListener('ended', this.handleVideoEnded.bind(this)); // 비디오 종료 시 페이드 아웃 애니메이션
    this.video.addEventListener('click', this.toggleMute.bind(this));
  }

  /**
   * 비디오가 DOM에 연결될 때 실행
   */
  connectedCallback(): void {
    ApiClient.get<TodayItem[]>('/todayis')
      .then((todayItems) => {
        if (todayItems !== null && todayItems.length > 0) {
          const randomTodayItem = RandomUtils.getRandomElementFromArray(todayItems);
          console.log('FacadeWebMovie: 선택된 오늘의 아이템', randomTodayItem);
          this.video.src = ApiClient.buildUrl(`/todayis/stream/${randomTodayItem.uuid}`);
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
    this.video.pause();
    this.video.src = ''; // 비디오 소스 초기화
    this.video.removeEventListener('loadstart', this.handleLoadStart.bind(this));
    this.video.removeEventListener('error', this.handleVideoError.bind(this));
    this.video.removeEventListener('ended', this.handleVideoEnded.bind(this));
    this.video.removeEventListener('click', this.toggleMute.bind(this));
  }

  /**
   * 음소거 토글
   */
  private toggleMute(): void {
    this.video.muted = !this.video.muted;
  }

  /**
   * 비디오 종료 시 페이드 아웃 애니메이션 처리
   */
  private handleVideoEnded(): void {
    this.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: this.fadeOutDuration,
      fill: 'forwards',
      easing: 'ease-out',
    }).onfinish = () => {
      this.remove();
    };
  }

  /**
   * 비디오 로딩 에러 처리
   */
  private handleVideoError(): void {
    console.warn('FacadeWebMovie: 비디오 로딩에 실패했습니다.');
    this.style.display = 'none';
  }

  /**
   * 비디오 로딩 시작 시 처리
   */
  private handleLoadStart(): void {
    this.style.opacity = '1';
  }

  /**
   * 재생이 끝나는지 확인하는 Promise를 반환
   * 이미 끝났으면 즉시 resolve, 아니면 ended 이벤트를 기다림
   */
  async isEnded(): Promise<boolean> {
    if (this.video.ended) {
      return true;
    }

    return new Promise<boolean>((resolve) => {
      this.video.addEventListener('ended', () => resolve(true), { once: true });
    });
  }
}

customElements.define('facade-web-movie', FacadeWebMovie);
