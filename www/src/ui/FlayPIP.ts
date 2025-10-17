/**
 * FlayPIP - Document Picture-in-Picture 기능을 총괄하는 모듈
 *
 * 주요 기능:
 * - 외부에서 호출하면 PIP 화면을 켜주고
 * - PIP에 들어갈 내용을 설정할 수 있는 함수 제공
 * - PIP 크기 조절 함수
 * - PIP 위치 조정 함수
 *
 * @author CrazyJK
 * @since 2025-10-16
 */

interface PIPConfig {
  /** PIP 창 너비 */
  width?: number;
  /** PIP 창 높이 */
  height?: number;
  /** PIP 창 X 위치 */
  x?: number;
  /** PIP 창 Y 위치 */
  y?: number;
  /** 항상 위에 표시 여부 */
  alwaysOnTop?: boolean;
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
  private pipWindow: PIPWindow | null = null;
  private pipDocument: Document | null = null;
  private originalStyles: string[] = [];

  /** 기본 PIP 설정 */
  private defaultConfig: Required<PIPConfig> = {
    width: 400,
    height: 300,
    x: window.screen.width - 450,
    y: 50,
    alwaysOnTop: true,
  };

  /** 현재 PIP 설정 */
  private currentConfig: Required<PIPConfig> = { ...this.defaultConfig };

  /**
   * PIP 기능 지원 여부 확인
   * @returns PIP 기능 지원 여부
   */
  public isSupported(): boolean {
    return 'documentPictureInPicture' in window;
  }

  /**
   * 현재 PIP 창이 열려있는지 확인
   * @returns PIP 창 열림 상태
   */
  public isOpen(): boolean {
    return this.pipWindow !== null && !this.pipWindow.closed;
  }

  /**
   * PIP 창을 열고 콘텐츠 설정
   * @param element 표시할 HTML 요소
   * @param config PIP 설정 옵션
   * @returns Promise<boolean> 성공 여부
   */
  public async openPIP(element: HTMLElement, config?: Partial<PIPConfig>): Promise<boolean> {
    try {
      // 이미 열려있으면 닫기
      if (this.isOpen()) {
        this.closePIP();
      }

      // PIP 지원 여부 확인
      if (!this.isSupported()) {
        console.warn('Document Picture-in-Picture is not supported');
        return false;
      }

      // 설정 병합
      this.currentConfig = { ...this.defaultConfig, ...config };

      // PIP 창 열기
      this.pipWindow = await window.documentPictureInPicture!.requestWindow({
        width: this.currentConfig.width,
        height: this.currentConfig.height,
      });

      if (!this.pipWindow) {
        console.error('Failed to open PIP window');
        return false;
      }

      this.pipDocument = this.pipWindow.document;

      // 기본 스타일 복사
      this.copyStyles();

      // 콘텐츠 설정
      this.setContent(element);

      // PIP 창 위치 조정
      this.setPosition(this.currentConfig.x, this.currentConfig.y);

      // 창 닫힘 이벤트 처리
      this.pipWindow.addEventListener('beforeunload', () => {
        this.handlePIPClose();
      });

      console.log('PIP window opened successfully');
      return true;
    } catch (error) {
      console.error('Failed to open PIP window:', error);
      return false;
    }
  }

  /**
   * PIP 창 닫기
   */
  public closePIP(): void {
    if (this.isOpen() && this.pipWindow) {
      this.pipWindow.close();
      this.handlePIPClose();
    }
  }

  /**
   * PIP 창에 표시할 콘텐츠 설정
   * @param element 표시할 HTML 요소
   */
  public setContent(element: HTMLElement): void {
    if (!this.isOpen() || !this.pipDocument) {
      console.warn('PIP window is not open');
      return;
    }

    try {
      // 기존 콘텐츠 제거
      this.pipDocument.body.innerHTML = '';

      // 새 콘텐츠 추가 (복사본 생성)
      const clonedElement = element.cloneNode(true) as HTMLElement;
      this.pipDocument.body.appendChild(clonedElement);

      console.log('PIP content updated');
    } catch (error) {
      console.error('Failed to set PIP content:', error);
    }
  }

  /**
   * PIP 창 크기 조절
   * @param width 새 너비
   * @param height 새 높이
   */
  public resizePIP(width: number, height: number): void {
    if (!this.isOpen() || !this.pipWindow) {
      console.warn('PIP window is not open');
      return;
    }

    try {
      this.pipWindow.resizeTo(width, height);
      this.currentConfig.width = width;
      this.currentConfig.height = height;

      console.log(`PIP window resized to ${width}x${height}`);
    } catch (error) {
      console.error('Failed to resize PIP window:', error);
    }
  }

  /**
   * PIP 창 위치 조정
   * @param x X 좌표
   * @param y Y 좌표
   */
  public setPosition(x: number, y: number): void {
    if (!this.isOpen() || !this.pipWindow) {
      console.warn('PIP window is not open');
      return;
    }

    try {
      this.pipWindow.moveTo(x, y);
      this.currentConfig.x = x;
      this.currentConfig.y = y;

      console.log(`PIP window moved to (${x}, ${y})`);
    } catch (error) {
      console.error('Failed to move PIP window:', error);
    }
  }

  /**
   * 현재 PIP 설정 반환
   * @returns 현재 PIP 설정
   */
  public getConfig(): Required<PIPConfig> {
    return { ...this.currentConfig };
  }

  /**
   * 현재 PIP 도큐먼트 반환
   * @returns PIP 도큐먼트 또는 null
   */
  public getPIPDocument(): Document | null {
    return this.pipDocument;
  }

  /**
   * PIP 설정 업데이트
   * @param config 새 설정
   */
  public updateConfig(config: Partial<PIPConfig>): void {
    this.currentConfig = { ...this.currentConfig, ...config };

    if (this.isOpen()) {
      if (config.width !== undefined || config.height !== undefined) {
        this.resizePIP(this.currentConfig.width, this.currentConfig.height);
      }
      if (config.x !== undefined || config.y !== undefined) {
        this.setPosition(this.currentConfig.x, this.currentConfig.y);
      }
    }
  }

  /**
   * 메인 창의 스타일을 PIP 창으로 복사
   */
  private copyStyles(): void {
    if (!this.pipDocument) return;

    try {
      // 기존 스타일 저장
      this.originalStyles = [];

      // link 요소들 복사 (CSS 파일들)
      const linkElements = document.querySelectorAll('link[rel="stylesheet"]');
      linkElements.forEach((link) => {
        const newLink = this.pipDocument!.createElement('link');
        newLink.rel = 'stylesheet';
        newLink.href = (link as HTMLLinkElement).href;
        this.pipDocument!.head.appendChild(newLink);
        this.originalStyles.push(newLink.outerHTML);
      });

      // style 요소들 복사
      const styleElements = document.querySelectorAll('style');
      styleElements.forEach((style) => {
        const newStyle = this.pipDocument!.createElement('style');
        newStyle.textContent = style.textContent;
        this.pipDocument!.head.appendChild(newStyle);
        this.originalStyles.push(newStyle.outerHTML);
      });

      // 기본 PIP 스타일 추가
      const pipStyle = this.pipDocument.createElement('style');
      pipStyle.textContent = `
        body {
          margin: 0;
          padding: 8px;
          background: #fff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          overflow: auto;
        }

        .pip-container {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .pip-header {
          padding: 8px;
          border-bottom: 1px solid #e0e0e0;
          background: #f5f5f5;
          font-size: 12px;
          font-weight: bold;
        }

        .pip-content {
          flex: 1;
          overflow: auto;
          padding: 8px;
        }
      `;
      this.pipDocument.head.appendChild(pipStyle);
    } catch (error) {
      console.error('Failed to copy styles to PIP window:', error);
    }
  }

  /**
   * PIP 창 닫힘 처리
   */
  private handlePIPClose(): void {
    this.pipWindow = null;
    this.pipDocument = null;
    this.originalStyles = [];
    console.log('PIP window closed');
  }

  /**
   * PIP 창 토글 (열려있으면 닫고, 닫혀있으면 열기)
   * @param element 표시할 HTML 요소
   * @param config PIP 설정 옵션
   * @returns Promise<boolean> 성공 여부
   */
  public async togglePIP(element: HTMLElement, config?: Partial<PIPConfig>): Promise<boolean> {
    if (this.isOpen()) {
      this.closePIP();
      return false;
    } else {
      return await this.openPIP(element, config);
    }
  }

  /**
   * PIP 창에 HTML 콘텐츠 직접 설정
   * @param html HTML 문자열
   */
  public setHTMLContent(html: string): void {
    if (!this.isOpen() || !this.pipDocument) {
      console.warn('PIP window is not open');
      return;
    }

    try {
      this.pipDocument.body.innerHTML = html;
      console.log('PIP HTML content updated');
    } catch (error) {
      console.error('Failed to set PIP HTML content:', error);
    }
  }

  /**
   * PIP 창에 요소 추가
   * @param element 추가할 HTML 요소
   * @param clone 요소를 복제할지 여부 (기본값: true)
   * @returns
   */
  public addContent(element: HTMLElement, clone: boolean = true): void {
    if (!this.isOpen() || !this.pipDocument) {
      console.warn('PIP window is not open');
      return;
    }

    try {
      if (clone) {
        const clonedElement = element.cloneNode(true) as HTMLElement;
        this.pipDocument.body.appendChild(clonedElement);
      } else {
        this.pipDocument.body.appendChild(element);
      }
      console.log('PIP content added');
    } catch (error) {
      console.error('Failed to add PIP content:', error);
    }
  }
}

/**
 * 전역 FlayPIP 인스턴스
 */
export const flayPIP = new FlayPIP();

/**
 * 편의 함수들
 */

/**
 * PIP 창 열기 (편의 함수)
 * @param element 표시할 HTML 요소
 * @param config PIP 설정 옵션
 * @returns Promise<boolean> 성공 여부
 */
export const openPIP = (element: HTMLElement, config?: Partial<PIPConfig>): Promise<boolean> => {
  return flayPIP.openPIP(element, config);
};

/**
 * PIP 창 닫기 (편의 함수)
 */
export const closePIP = (): void => {
  flayPIP.closePIP();
};

/**
 * PIP 창 토글 (편의 함수)
 * @param element 표시할 HTML 요소
 * @param config PIP 설정 옵션
 * @returns Promise<boolean> 성공 여부
 */
export const togglePIP = (element: HTMLElement, config?: Partial<PIPConfig>): Promise<boolean> => {
  return flayPIP.togglePIP(element, config);
};

/**
 * PIP 지원 여부 확인 (편의 함수)
 * @returns PIP 기능 지원 여부
 */
export const isPIPSupported = (): boolean => {
  return flayPIP.isSupported();
};

/**
 * PIP 창 열림 상태 확인 (편의 함수)
 * @returns PIP 창 열림 상태
 */
export const isPIPOpen = (): boolean => {
  return flayPIP.isOpen();
};
