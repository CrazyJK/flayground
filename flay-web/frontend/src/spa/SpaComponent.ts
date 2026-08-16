/**
 * SPA 컴포넌트를 위한 추상 베이스 클래스
 * @description Custom HTML element 기반의 SPA 컴포넌트 공통 기능을 제공합니다.
 * @abstract
 */
export abstract class SpaComponent extends HTMLElement {
  /**
   * 요소가 DOM에서 제거될 때 호출되는 자원 해제 메서드들
   */
  private disposables: Array<{ dispose: () => void }> = [];

  /**
   * 컴포넌트 초기화 완료 여부
   */
  protected initialized = false;

  /**
   * 감시할 속성 목록을 반환합니다. (하위 클래스에서 오버라이드 가능)
   * @returns 감시할 속성 이름 배열
   */
  static get observedAttributes(): string[] {
    return [];
  }

  /**
   * 속성 변경 시 호출됩니다.
   * @param name 변경된 속성 이름
   * @param oldValue 이전 값
   * @param newValue 새로운 값
   */
  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    console.debug(`[SpaComponent] attributeChangedCallback: ${name}`, { oldValue, newValue });
    if (oldValue !== newValue) {
      this.onAttributeChanged(name, oldValue, newValue);
    }
  }

  /**
   * 컴포넌트가 DOM에 연결될 때 호출됩니다.
   * 템플릿 메서드 패턴을 적용하여 초기화 순서를 보장합니다.
   */
  connectedCallback(): void {
    console.debug('[SpaComponent] connectedCallback', { initialized: this.initialized });
    if (!this.initialized) {
      this.onBeforeInit();
      this.onInit();
      this.onAfterInit();
      this.initialized = true;
    }
    this.onConnected();
  }

  /**
   * 컴포넌트가 DOM에서 제거될 때 호출됩니다.
   * 등록된 모든 자원을 해제합니다.
   */
  disconnectedCallback(): void {
    console.debug('[SpaComponent] disconnectedCallback', { disposablesCount: this.disposables.length });
    this.onDisconnected();
    this.disposables.forEach((disposable) => disposable.dispose());
    this.disposables = [];
  }

  /**
   * 초기화 전 호출됩니다. (템플릿 메서드)
   * 하위 클래스에서 필요시 오버라이드합니다.
   */
  protected onBeforeInit(): void {
    console.debug('[SpaComponent] onBeforeInit');
    // 하위 클래스에서 구현
  }

  /**
   * 컴포넌트 초기화 시 호출됩니다. (추상 메서드)
   * 하위 클래스에서 반드시 구현해야 합니다.
   */
  protected abstract onInit(): void;

  /**
   * 초기화 후 호출됩니다. (템플릿 메서드)
   * 하위 클래스에서 필요시 오버라이드합니다.
   */
  protected onAfterInit(): void {
    console.debug('[SpaComponent] onAfterInit');
    // 하위 클래스에서 구현
  }

  /**
   * DOM에 연결된 후 호출됩니다. (템플릿 메서드)
   * 하위 클래스에서 필요시 오버라이드합니다.
   */
  protected onConnected(): void {
    console.debug('[SpaComponent] onConnected');
    // 하위 클래스에서 구현
  }

  /**
   * DOM에서 제거되기 전 호출됩니다. (템플릿 메서드)
   * 하위 클래스에서 필요시 오버라이드합니다.
   */
  protected onDisconnected(): void {
    console.debug('[SpaComponent] onDisconnected');
    // 하위 클래스에서 구현
  }

  /**
   * 속성 변경 시 호출됩니다. (템플릿 메서드)
   * 하위 클래스에서 필요시 오버라이드합니다.
   * @param name 변경된 속성 이름
   * @param oldValue 이전 값
   * @param newValue 새로운 값
   */
  protected onAttributeChanged(_name: string, _oldValue: string | null, _newValue: string | null): void {
    console.debug('[SpaComponent] onAttributeChanged', { name: _name, oldValue: _oldValue, newValue: _newValue });
    // 하위 클래스에서 구현
  }

  /**
   * disconnectedCallback에서 자동으로 해제할 자원을 등록합니다.
   * @param disposable dispose 메서드를 가진 객체
   * @example
   * this.registerDisposable({
   *   dispose: () => this.removeEventListener('click', handler)
   * });
   */
  protected registerDisposable(disposable: { dispose: () => void }): void {
    console.debug('[SpaComponent] registerDisposable', { totalDisposables: this.disposables.length + 1 });
    this.disposables.push(disposable);
  }

  /**
   * DOM 쿼리를 간편하게 수행합니다.
   * @param selector CSS 선택자
   * @returns 선택된 요소 또는 null
   */
  protected query<T extends Element = Element>(selector: string): T | null {
    const result = this.querySelector<T>(selector);
    console.debug('[SpaComponent] query', { selector, found: !!result });
    return result;
  }

  /**
   * 모든 일치하는 DOM 요소를 배열로 반환합니다.
   * @param selector CSS 선택자
   * @returns 선택된 요소 배열
   */
  protected queryAll<T extends Element = Element>(selector: string): T[] {
    const result = Array.from(this.querySelectorAll<T>(selector));
    console.debug('[SpaComponent] queryAll', { selector, count: result.length });
    return result;
  }

  /**
   * HTML 템플릿을 렌더링합니다.
   * @param template HTML 문자열
   */
  protected render(template: string): void {
    console.debug('[SpaComponent] render', { templateLength: template.length });
    this.innerHTML = template;
  }

  /**
   * 이벤트 리스너를 등록하고 자동 해제를 위해 disposable로 등록합니다.
   * @param target 이벤트 대상
   * @param event 이벤트 이름
   * @param handler 이벤트 핸들러
   * @param options 이벤트 옵션
   */
  protected addManagedEventListener<K extends keyof HTMLElementEventMap>(target: HTMLElement | Window | Document, event: K, handler: (this: HTMLElement, ev: HTMLElementEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void {
    console.debug('[SpaComponent] addManagedEventListener', { event, targetType: target.constructor.name });
    target.addEventListener(event, handler as EventListener, options);
    this.registerDisposable({
      dispose: () => target.removeEventListener(event, handler as EventListener, options),
    });
  }
}
