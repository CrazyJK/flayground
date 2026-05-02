import { applyTheme } from '../browser/ThemeListener';
import './FlayPIP.scss';

/**
 * PIP 옵션 인터페이스
 * - width: PIP 창 너비 (기본값: 400)
 * - height: PIP 창 높이 (기본값: 300)
 * - append: 기존 콘텐츠를 유지하고 뒤에 추가할지 여부 (기본값: false)
 * - clone: HTMLElement 전달 시 복제 후 추가할지 여부 (기본값: false)
 */
interface PIPOptions {
  /** PIP 창 너비 */
  width: number;
  /** PIP 창 높이 */
  height: number;
  /** 기존 콘텐츠를 유지하고 뒤에 추가할지 여부 */
  append: boolean;
  /** HTMLElement 전달 시 복제 후 추가할지 여부 */
  clone: boolean;
}

declare global {
  interface Window {
    documentPictureInPicture?: {
      requestWindow: (options: { width: number; height: number }) => Promise<Window>;
    };
  }
}

interface PIPWindow extends Window {}

/**
 * FlayPIP 클래스
 * Document Picture-in-Picture 기능을 관리하는 메인 클래스
 */
export class FlayPIP {
  /** 기본 PIP 설정 */
  private defaultOptions: Required<PIPOptions> = {
    width: 400,
    height: 300,
    append: false,
    clone: false,
  };

  /** 현재 인스턴스의 PIP 창 */
  private pipWindow: PIPWindow | null = null;

  /** 현재 인스턴스의 PIP 도큐먼트 */
  private pipDocument: Document | null = null;

  /** 현재 PIP 설정 */
  private currentOptions: Required<PIPOptions> = { ...this.defaultOptions };

  /** PIP 창 닫힘 이벤트 핸들러 */
  private readonly onPIPBeforeUnload = (): void => {
    this.handlePIPClose();
  };

  constructor() {
    if (!FlayPIP.isSupported()) {
      console.warn('Document Picture-in-Picture is not supported');
    }
  }

  /**
   * PIP 기능 지원 여부 확인
   * @returns PIP 기능 지원 여부
   */
  public static isSupported(): boolean {
    return 'documentPictureInPicture' in window;
  }

  /**
   * 현재 PIP 창이 열려있는지 확인
   * @returns PIP 창 열림 상태
   */
  public isOpen(): boolean {
    const pipWindow = this.pipWindow;
    return pipWindow !== null && pipWindow !== undefined && !pipWindow.closed;
  }

  /**
   * PIP 창 열기 내부 로직
   * @param element 표시할 HTML 요소 또는 HTML 문자열
   * @param options PIP 옵션
   * @returns Promise<boolean> 성공 여부
   */
  public async open(element: string | HTMLElement, options?: Partial<PIPOptions>): Promise<boolean> {
    try {
      this.currentOptions = { ...this.defaultOptions, ...options };

      if (!this.isOpen()) {
        this.pipWindow = await window.documentPictureInPicture!.requestWindow({
          width: this.currentOptions.width,
          height: this.currentOptions.height,
        });
        this.pipWindow.addEventListener('beforeunload', this.onPIPBeforeUnload);
        this.pipDocument = this.pipWindow.document;
        this.copyStyles();
      }

      this.setContent(element, this.currentOptions);
      return true;
    } catch (error) {
      console.error('Failed to open PIP window:', error);
      return false;
    }
  }

  /**
   * PIP 창 콘텐츠를 공통 방식으로 갱신
   * @param content HTML 문자열 또는 HTML 요소
   */
  private setContent(content: string | HTMLElement, options: PIPOptions): void {
    if (content) {
      if (!options.append) {
        this.pipDocument!.body.innerHTML = ''; // 기존 콘텐츠 제거
      }
      if (typeof content === 'string') {
        this.pipDocument!.body.insertAdjacentHTML('beforeend', content); // 문자열 콘텐츠 추가
      } else {
        this.pipDocument!.body.appendChild(options.clone ? content.cloneNode(true) : content); // 요소 콘텐츠 추가
      }
    }
  }

  /**
   * PIP 창 닫기
   */
  public closePIP(): void {
    if (this.isOpen()) {
      this.pipWindow!.close();
      this.handlePIPClose();
    }
  }

  /**
   * PIP 창 닫힘 처리
   */
  private handlePIPClose(): void {
    this.pipWindow = null;
    this.pipDocument = null;
  }

  /**
   * 메인 창의 스타일을 PIP 창으로 복사
   */
  private copyStyles(): void {
    applyTheme(this.pipDocument!);

    this.pipDocument!.body.classList.add('flay-pip-body');

    // link 요소들 복사 (CSS 파일들)
    const linkElements = document.querySelectorAll('link[rel="stylesheet"]');
    linkElements.forEach((link) => {
      const newLink = this.pipDocument!.createElement('link');
      newLink.rel = 'stylesheet';
      newLink.href = (link as HTMLLinkElement).href;
      this.pipDocument!.head.appendChild(newLink);
    });

    // style 요소들 복사
    const styleElements = document.querySelectorAll('style');
    styleElements.forEach((style) => {
      const newStyle = this.pipDocument!.createElement('style');
      newStyle.textContent = style.textContent;
      this.pipDocument!.head.appendChild(newStyle);
    });
  }
}
