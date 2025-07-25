/**
 * FacadeWebMovie.ts
 *
 * 첫페이지에서 짧은 동영상을 보여주는 커스텀 비디오 엘리먼트입니다.
 * 이 비디오는 자동 재생되며, 끝나면 서서히 사라집니다.
 * 스타일링을 통해 원형 모양으로 표시되며, 크기와 위치가 조정됩니다.
 */
export class FacadeWebMovie extends HTMLVideoElement {
  private fadeOutDuration = 1000; // 페이드 아웃 지속 시간 (ms)

  constructor() {
    super();

    // 원형 모양으로 클리핑
    this.style.clipPath = 'circle(50% at 50% 50%)';
    this.style.width = '30rem';
    this.style.maxWidth = '50%';
    this.style.objectFit = 'cover'; // 비디오가 컨테이너에 맞게 조정
    this.style.display = 'block'; // 블록 요소로 표시
    this.style.margin = '0 auto'; // 중앙 정렬

    // 비디오 속성 설정
    this.autoplay = true;
    this.loop = false;
    this.muted = true; // 자동 재생을 위해 음소거 설정
    this.volume = 0.5;
    this.playsInline = true; // 모바일에서 인라인 재생

    // 비디오 종료 시 서서히 사라지는 이벤트 리스너
    this.addEventListener('ended', this.handleVideoEnded.bind(this));

    // 에러 처리
    this.addEventListener('error', this.handleVideoError.bind(this));

    // 로딩 시작 시 스타일 설정
    this.addEventListener('loadstart', this.handleLoadStart.bind(this));

    // 클릭시 muted 설정 해제
    this.addEventListener('click', () => (this.muted = !this.muted));
  }

  /**
   * 비디오가 DOM에 연결될 때 실행
   */
  connectedCallback() {
    this.src = '/res/Cocks_not_standing.webm';
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

  // 재생이 끝나는지 알리기
  async isEnded(): Promise<boolean> {
    return new Promise((resolve) => {
      setInterval(() => {
        if (this.ended) {
          resolve(true);
        }
      }, 100); // 100ms 마다 확인
    });
  }
}

customElements.define('facade-web-movie', FacadeWebMovie, { extends: 'video' });
