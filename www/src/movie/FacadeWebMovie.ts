import ApiClient from '@lib/ApiClient';
import RandomUtils from '../lib/RandomUtils';
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
export class FacadeWebMovie extends HTMLElement {
  private fadeOutDuration = 1000; // 페이드 아웃 지속 시간 (ms)
  private video: HTMLVideoElement;

  constructor() {
    super();

    this.video = this.appendChild(document.createElement('video'));

    // 원형 모양으로 클리핑
    this.style.clipPath = 'circle(50% at 50% 50%)';
    this.style.width = '30rem';
    this.style.maxWidth = '50%';
    this.style.objectFit = 'cover'; // 비디오가 컨테이너에 맞게 조정
    this.style.display = 'block'; // 블록 요소로 표시
    this.style.margin = '0 auto'; // 중앙 정렬

    // 비디오 속성 설정
    this.video.autoplay = true;
    this.video.loop = false;
    // this.video.muted = true; // 자동 재생을 위해 음소거 설정
    this.video.volume = 0.5;
    this.video.playsInline = true; // 모바일에서 인라인 재생

    // 비디오 종료 시 서서히 사라지는 이벤트 리스너
    this.video.addEventListener('ended', this.handleVideoEnded.bind(this));

    // 에러 처리
    this.video.addEventListener('error', this.handleVideoError.bind(this));

    // 로딩 시작 시 스타일 설정
    this.video.addEventListener('loadstart', this.handleLoadStart.bind(this));

    // 클릭시 muted 설정 해제
    this.video.addEventListener('click', (): void => {
      this.video.muted = !this.video.muted;
    });
  }

  /**
   * 비디오가 DOM에 연결될 때 실행
   */
  connectedCallback(): void {
    ApiClient.get('/todayis')
      .then((response: unknown) => {
        // 타입 가드를 사용하여 안전하게 타입 체크
        if (this.isTodayListValid(response)) {
          const todayList = response as TodayItem[];
          if (todayList.length > 0) {
            const randomToday = RandomUtils.getRandomElementFromArray(todayList);
            this.video.src = ApiClient.buildUrl(`/todayis/stream/${randomToday.uuid}`);
          }
        } else {
          console.warn('FacadeWebMovie: API 응답 형식이 올바르지 않습니다.');
        }
      })
      .catch((error: unknown) => {
        console.error('FacadeWebMovie: API 호출 실패:', error);
        this.handleVideoError();
      });
  }

  /**
   * API 응답이 유효한 TodayItem 배열인지 확인하는 타입 가드
   */
  private isTodayListValid(response: unknown): response is TodayItem[] {
    return Array.isArray(response) && response.every((item: unknown) => typeof item === 'object' && item !== null && typeof (item as Record<string, unknown>)['name'] === 'string' && typeof (item as Record<string, unknown>)['uuid'] === 'string');
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
      const handleEnded = (): void => {
        this.video.removeEventListener('ended', handleEnded);
        resolve(true);
      };
      this.video.addEventListener('ended', handleEnded);
    });
  }
}

customElements.define('facade-web-movie', FacadeWebMovie);
