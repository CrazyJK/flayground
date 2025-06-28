import ApiClient from '@lib/ApiClient';
import DateUtils from '@lib/DateUtils';
import FileUtils from '@lib/FileUtils';
import FlayFetch from '@lib/FlayFetch';

export default class FlayImage extends HTMLImageElement {
  #magnifier = null;
  #magnifierSize = 300;
  #zoomLevel = 2;
  #rafId = null;
  #isEnlarged = false;
  #lastCheckTime = 0;
  #resizeHandler = null;

  constructor() {
    super();
  }

  static get observedAttributes() {
    return ['data-idx', 'src'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'data-idx':
        this.src = ApiClient.buildUrl('/static/image/' + newValue);
        break;
      case 'src':
        this.#loadInfo();
        this.#updateMagnifierImage();
        break;
    }
  }

  connectedCallback() {
    this.#initMagnifier();
  }

  disconnectedCallback() {
    // requestAnimationFrame 취소
    if (this.#rafId) {
      cancelAnimationFrame(this.#rafId);
      this.#rafId = null;
    }

    // 돋보기 요소 정리
    if (this.#magnifier && this.#magnifier.parentElement) {
      this.#magnifier.parentElement.removeChild(this.#magnifier);
      this.#magnifier = null;
    }

    // 리사이즈 이벤트 리스너 제거 (올바른 방법)
    this.#cleanupResizeListener();
  }

  #cleanupResizeListener() {
    // 기존 바인딩된 핸들러가 있다면 제거
    if (this.#resizeHandler) {
      window.removeEventListener('resize', this.#resizeHandler);
      this.#resizeHandler = null;
    }
  }

  #loadInfo() {
    const idx = Number(this.src?.split('/').pop());
    if (idx < 0) {
      this.removeAttribute('alt');
      return;
    }

    this.decode().then(() =>
      FlayFetch.getImage(idx).then((info) => {
        info['width'] = this.naturalWidth;
        info['height'] = this.naturalHeight;

        this.dataset.name = info.name;
        this.dataset.path = info.path;
        this.dataset.file = info.file;
        this.dataset.fileSize = FileUtils.prettySize(info.length).join('');
        this.dataset.modified = DateUtils.format(info.modified, 'yyyy-MM-dd');
        this.dataset.width = info.width;
        this.dataset.height = info.height;
        this.alt = `※ Idx: ${info.idx}\n※ Path: ${info.path}\n※ Name: ${info.name}\n※ Size: ${info.width} x ${info.height}`;

        this.dispatchEvent(new CustomEvent('loaded', { detail: { info: info } }));
      })
    );
  }

  #initMagnifier() {
    this.style.position = 'relative';

    this.addEventListener('mouseenter', this.#handleMouseEnter.bind(this));
    this.addEventListener('mouseleave', this.#hideMagnifier.bind(this));
    this.addEventListener('mousemove', this.#handleMouseMove.bind(this));

    // 핸들러를 저장하여 나중에 제거할 수 있게 함
    this.#resizeHandler = this.#handleResize.bind(this);
    window.addEventListener('resize', this.#resizeHandler);
  }

  #handleMouseMove(e) {
    // requestAnimationFrame으로 성능 최적화
    if (this.#rafId) {
      cancelAnimationFrame(this.#rafId);
    }

    this.#rafId = requestAnimationFrame(() => {
      this.#updateMagnifier(e);
      this.#rafId = null;
    });
  }

  #handleMouseEnter() {
    // 크기 체크를 캐시하여 성능 개선
    this.#updateEnlargedState();
    if (this.#isEnlarged) {
      return;
    }
    this.#showMagnifier();
  }

  #updateEnlargedState() {
    const now = performance.now();
    // 100ms마다만 크기 체크 (성능 최적화)
    if (now - this.#lastCheckTime > 100) {
      this.#isEnlarged = this.offsetWidth > this.naturalWidth || this.offsetHeight > this.naturalHeight;
      this.#lastCheckTime = now;
    }
  }

  #isImageEnlarged() {
    this.#updateEnlargedState();
    return this.#isEnlarged;
  }

  #handleResize() {
    // 리사이즈 시 이미지가 확대되었다면 돋보기 숨기기
    if (this.#isImageEnlarged() && this.#magnifier) {
      this.#hideMagnifier();
    }
  }

  #showMagnifier() {
    if (!this.#magnifier) {
      this.#createMagnifier();
    }
    this.#magnifier.style.display = 'block';
    this.style.cursor = 'none';
  }

  #hideMagnifier() {
    if (this.#magnifier) {
      this.#magnifier.style.display = 'none';
      this.style.cursor = 'initial'; // 기본 커서로 되돌리기
    }
  }

  #createMagnifier() {
    this.#magnifier = document.createElement('div');
    this.#magnifier.style.cssText = `
      position: absolute;
      width: ${this.#magnifierSize}px;
      height: ${this.#magnifierSize}px;
      border: 3px solid var(--dominated-color);
      border-radius: 50%;
      background-repeat: no-repeat;
      background-image: url('${this.src}');
      box-shadow: 0 0 10px var(--dominated-color);
      pointer-events: none;
      z-index: 1000;
      display: none;
    `;

    // 이미지의 부모 요소에 추가 (relative positioning을 위해)
    const parent = this.parentElement || document.body;
    parent.appendChild(this.#magnifier);
  }

  #updateMagnifier(e) {
    if (!this.#magnifier) return;

    // 이미지가 원본보다 크게 표시되고 있으면 돋보기 숨기기
    if (this.#isImageEnlarged()) {
      this.#hideMagnifier();
      return;
    }

    const rect = this.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 돋보기 위치 설정 (마우스 위치를 중심으로)
    const magnifierX = e.clientX - this.#magnifierSize / 2;
    const magnifierY = e.clientY - this.#magnifierSize / 2;

    // 배경 이미지 위치 및 크기 설정 (확대 효과)
    const bgX = -x * this.#zoomLevel + this.#magnifierSize / 2;
    const bgY = -y * this.#zoomLevel + this.#magnifierSize / 2;
    const bgSize = `${this.offsetWidth * this.#zoomLevel}px ${this.offsetHeight * this.#zoomLevel}px`;

    // CSS 변경을 한 번에 배치 처리 (성능 최적화)
    this.#magnifier.style.cssText += `
      left: ${magnifierX}px;
      top: ${magnifierY}px;
      background-position: ${bgX}px ${bgY}px;
      background-size: ${bgSize};
    `;
  }

  #updateMagnifierImage() {
    // 돋보기가 존재하고 src가 있을 때만 업데이트
    if (this.#magnifier && this.src) {
      this.#magnifier.style.backgroundImage = `url('${this.src}')`;
    }
  }
}

customElements.define('flay-image', FlayImage, { extends: 'img' });
