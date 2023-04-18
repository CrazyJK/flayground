/**
 *
 */
export default class FlayCover extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다
    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('cover');
    const link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', './css/components.css');
    this.shadowRoot.append(link, this.wrapper); // 생성된 요소들을 shadow DOM에 부착합니다

    this.flay = null;
  }

  /**
   *
   * @param {Flay} flay
   */
  set(flay) {
    this.flay = flay;
    this.wrapper.setAttribute('data-opus', flay.opus);
    this.wrapper.classList.toggle('archive', this.flay.archive);
    if (this.parentElement) {
      this.wrapper.classList.toggle('small', this.parentElement.classList.contains('small'));
    }
    this.wrapper.style.backgroundImage = `url(/static/cover/${flay.opus})`;
  }
  // TODO 대표색상 추출
  // TODO 영상 스트리링
}

// Define the new element
customElements.define('flay-cover', FlayCover);
