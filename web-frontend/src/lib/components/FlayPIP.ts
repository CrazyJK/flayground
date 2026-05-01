/*
 * FlayPIP - Document Picture-in-Picture 기능을 총괄하는 모듈
 *
 * 주요 기능:
 * - 외부에서 호출하면 PIP 화면을 켜주고 (기존 창이 있으면 재사용)
 * - PIP에 들어갈 내용을 설정할 수 있는 함수 제공
 * - PIP 크기 조절 함수
 * - PIP 위치 조정 함수
 * - 기존 PIP 창 재사용 또는 강제로 새 창 생성 옵션 제공
 * - 서로 다른 창/탭 간 PIP 상태 공유 및 접근
 *
 * 동작 방식:
 * - openPIP(): 기존 PIP 창이 있으면 재사용, 콘텐츠만 업데이트
 * - forceOpenNewPIP(): 기존 PIP 창을 닫고 새로운 창 생성
 * - 전역 상태 관리: window.__flayPIPGlobal을 통해 모든 창에서 PIP 상태 공유
 * - 다중 인스턴스 지원: 여러 창에서 FlayPIP 인스턴스 생성 가능, 상태는 공유됨
 *
 * 전역 접근 함수:
 * - isGlobalPIPOpen(): 전역 PIP 창 열림 상태 확인
 * - getGlobalPIPInfo(): 전역 PIP 상태 정보 조회
 * - getGlobalPIPDocument(): 전역 PIP 도큐먼트 접근
 * - getGlobalPIPWindow(): 전역 PIP 창 접근
 *
 * @author CrazyJK
 * @since 2025-10-16
 * @updated 2025-10-19 - PIP 창 재사용 기능 추가
 * @updated 2025-10-19 - 전역 상태 공유 및 다중 창 지원 추가
 */

/**
 * PIP 설정 옵션 인터페이스
 * - width: PIP 창 너비 (기본값: 400)
 * - height: PIP 창 높이 (기본값: 300)
 * - x: PIP 창 X 위치 (기본값: 화면 오른쪽 상단에서 50px 떨어진 위치)
 * - y: PIP 창 Y 위치 (기본값: 화면 오른쪽 상단에서 50px 떨어진 위치)
 * - alwaysOnTop: 항상 위에 표시 여부 (기본값: true)
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

/**
 * PIP 콘텐츠 설정 옵션
 * - append: 기존 콘텐츠를 유지하고 뒤에 추가할지 여부 (기본값: false)
 * - clone: HTMLElement 전달 시 복제 후 추가할지 여부 (기본값: false)
 *   - true로 설정하면 원본 요소는 PIP 창에 추가되지 않고, 대신 복제된 요소가 추가됩니다.
 *   - false로 설정하면 원본 요소가 PIP 창에 직접 추가됩니다. 이 경우 원본 요소는 현재 문서에서 제거되고 PIP 창으로 이동합니다.
 */
interface PIPContentOptions {
  /** 기존 콘텐츠를 유지하고 뒤에 추가할지 여부 */
  append?: boolean;
  /** HTMLElement 전달 시 복제 후 추가할지 여부 */
  clone?: boolean;
}

declare global {
  interface Window {
    documentPictureInPicture?: {
      requestWindow: (options: { width: number; height: number }) => Promise<Window>;
    };
    /** 전역 PIP 상태 공유를 위한 객체 */
    __flayPIPGlobal?: {
      pipWindow: PIPWindow | null;
      pipDocument: Document | null;
      currentConfig: Required<PIPConfig>;
      originalStyles: string[];
      instances: Set<FlayPIP>;
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
  private defaultConfig: Required<PIPConfig> = {
    width: 400,
    height: 300,
    x: window.screen.width - 450,
    y: 50,
    alwaysOnTop: true,
  };

  /** PIP 창 닫힘 이벤트 핸들러 */
  private readonly onPIPBeforeUnload = (): void => {
    this.handlePIPClose();
  };

  constructor() {
    // 전역 상태 초기화
    if (!window.__flayPIPGlobal) {
      window.__flayPIPGlobal = {
        pipWindow: null,
        pipDocument: null,
        currentConfig: { ...this.defaultConfig },
        originalStyles: [],
        instances: new Set(),
      };
    }
    // 현재 인스턴스를 전역 인스턴스 목록에 추가
    window.__flayPIPGlobal.instances.add(this);
  }

  /** 전역 PIP 창 참조 */
  private get pipWindow(): PIPWindow | null {
    return window.__flayPIPGlobal?.pipWindow ?? null;
  }

  private set pipWindow(value: PIPWindow | null) {
    if (window.__flayPIPGlobal) {
      window.__flayPIPGlobal.pipWindow = value;
    }
  }

  /** 전역 PIP 도큐먼트 참조 */
  private get pipDocument(): Document | null {
    return window.__flayPIPGlobal?.pipDocument ?? null;
  }

  private set pipDocument(value: Document | null) {
    if (window.__flayPIPGlobal) {
      window.__flayPIPGlobal.pipDocument = value;
    }
  }

  /** 전역 현재 설정 참조 */
  private get currentConfig(): Required<PIPConfig> {
    return window.__flayPIPGlobal?.currentConfig ?? this.defaultConfig;
  }

  private set currentConfig(value: Required<PIPConfig>) {
    if (window.__flayPIPGlobal) {
      window.__flayPIPGlobal.currentConfig = value;
    }
  }

  /** 전역 원본 스타일 참조 */
  private get originalStyles(): string[] {
    return window.__flayPIPGlobal?.originalStyles ?? [];
  }

  private set originalStyles(value: string[]) {
    if (window.__flayPIPGlobal) {
      window.__flayPIPGlobal.originalStyles = value;
    }
  }

  /**
   * 전역에서 열려있는 PIP 창 정보 반환
   * @returns 전역 PIP 상태 정보
   */
  public static getGlobalPIPInfo(): {
    isOpen: boolean;
    pipWindow: PIPWindow | null;
    pipDocument: Document | null;
    currentConfig: Required<PIPConfig> | null;
    instanceCount: number;
  } {
    const global = window.__flayPIPGlobal;
    return {
      isOpen: global?.pipWindow !== null && global?.pipWindow !== undefined && !global.pipWindow.closed,
      pipWindow: global?.pipWindow ?? null,
      pipDocument: global?.pipDocument ?? null,
      currentConfig: global?.currentConfig ?? null,
      instanceCount: global?.instances.size ?? 0,
    };
  }

  /**
   * 전역 PIP 창이 열려있는지 확인 (정적 메서드)
   * @returns 전역 PIP 창 열림 상태
   */
  public static isGlobalPIPOpen(): boolean {
    const global = window.__flayPIPGlobal;
    return global?.pipWindow !== null && global?.pipWindow !== undefined && !global.pipWindow.closed;
  }

  /**
   * PIP 기능 지원 여부 확인
   * @returns PIP 기능 지원 여부
   */
  public static isSupported(): boolean {
    return 'documentPictureInPicture' in window;
  }

  /**
   * PIP 창 열기 내부 로직
   * @param element 표시할 HTML 요소 또는 HTML 문자열
   * @param options PIP 콘텐츠 옵션
   * @param config PIP 설정 옵션
   * @param forceNew true면 기존 창을 닫고 새로 연다. default는 false로, 기존 창이 있으면 재사용한다.
   * @returns Promise<boolean> 성공 여부
   */
  public async openPIP(element: string | HTMLElement, options?: PIPContentOptions, config?: Partial<PIPConfig> | undefined, forceNew: boolean = false): Promise<boolean> {
    try {
      if (!forceNew && this.isOpen()) {
        console.log('PIP window is already open, reusing existing window');
        if (config) {
          this.updateConfig(config);
        }
        this.setContent(element);
        return true;
      }

      if (forceNew && this.isOpen()) {
        this.closePIP();
      }

      if (!FlayPIP.isSupported()) {
        console.warn('Document Picture-in-Picture is not supported');
        return false;
      }

      this.currentConfig = { ...this.defaultConfig, ...config };

      this.pipWindow = await window.documentPictureInPicture!.requestWindow({
        width: this.currentConfig.width,
        height: this.currentConfig.height,
      });

      if (!this.pipWindow) {
        console.error('Failed to open PIP window');
        return false;
      }

      this.pipDocument = this.pipWindow.document;
      this.copyStyles();
      this.setContent(element, options);
      this.updateConfig(this.currentConfig);

      this.pipWindow.addEventListener('beforeunload', this.onPIPBeforeUnload);

      console.log('PIP window opened successfully');
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
  public setContent(content: string | HTMLElement, options?: PIPContentOptions): void {
    const pipDocument = this.getPIPDocument();
    if (!pipDocument) {
      return;
    }

    try {
      const shouldAppend = options?.append ?? false;

      if (typeof content === 'string') {
        if (shouldAppend) {
          pipDocument.body.insertAdjacentHTML('beforeend', content);
        } else {
          pipDocument.body.innerHTML = content;
        }
        console.log('PIP HTML content updated');
        return;
      }

      if (!shouldAppend) {
        pipDocument.body.innerHTML = '';
      }

      if (options?.clone ?? true) {
        const clonedElement = content.cloneNode(true) as HTMLElement;
        pipDocument.body.appendChild(clonedElement);
      } else {
        pipDocument.body.appendChild(content);
      }

      console.log('PIP content updated');
    } catch (error) {
      console.error('Failed to update PIP content:', error);
    }
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
   * 현재 PIP 창이 열려있는지 확인
   * @returns PIP 창 열림 상태
   */
  public isOpen(): boolean {
    return this.pipWindow !== null && !this.pipWindow.closed;
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
   * 인스턴스 정리 (소멸자 역할)
   */
  public dispose(): void {
    if (window.__flayPIPGlobal) {
      window.__flayPIPGlobal.instances.delete(this);
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

    // 모든 FlayPIP 인스턴스에 PIP 창이 닫혔음을 알림
    if (window.__flayPIPGlobal) {
      window.__flayPIPGlobal.instances.forEach((instance) => {
        // 각 인스턴스에서 필요한 정리 작업이 있다면 수행
        if (instance !== this) {
          console.log('Notifying other FlayPIP instance of window close');
        }
      });
    }
  }
}
