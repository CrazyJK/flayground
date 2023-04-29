/**
 *
 */
export default class FlayCover extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다
    const LINK = document.createElement('link');
    LINK.setAttribute('rel', 'stylesheet');
    LINK.setAttribute('href', './css/components.css');
    const STYLE = document.createElement('style');
    STYLE.innerHTML = CSS;
    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('cover');
    this.shadowRoot.append(LINK, STYLE, this.wrapper); // 생성된 요소들을 shadow DOM에 부착합니다

    this.flay = null;
    this.wrapper.addEventListener('click', (e) => {
      e.target.classList.toggle('full');
    });
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

const CSS = `
/* for FlayCover */
div.cover {
  aspect-ratio: 400 / 269;
  background: transparent no-repeat center / contain;
  background-color: var(--color-bg-cover);
  box-shadow: var(--box-shadow-cover);
  border-radius: 0.125rem;
}
div.cover.full {
  background-size: cover;
}
div.cover.small {
  box-shadow: none;
}
`;
