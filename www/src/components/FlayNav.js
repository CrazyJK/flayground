/**
 *
 */
export default class FlayNav extends HTMLElement {
  constructor(listener) {
    super();
    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다
    const wrapper = document.createElement('div');
    wrapper.classList.add('nav');
    const link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', './css/components.css');
    this.shadowRoot.append(link, wrapper); // 생성된 요소들을 shadow DOM에 부착합니다

    const HEADER_IMG = wrapper.appendChild(document.createElement('img'));
    HEADER_IMG.src = './img/svg/flayground-text.svg';

    const NAV_LIST = wrapper.appendChild(document.createElement('ul'));

    ['page', 'search', 'batch', 'candidate'].forEach((menu) => {
      const LI = NAV_LIST.appendChild(document.createElement('li'));
      const ANKER = LI.appendChild(document.createElement('a'));
      ANKER.innerHTML = menu.toLocaleUpperCase();
      ANKER.addEventListener('click', (e) => {
        console.log('anker click', menu);
        NAV_LIST.childNodes.forEach((child) => {
          child.classList.remove('active');
        });
        e.target.parentNode.classList.toggle('active');
        listener(menu);
      });
    });
  }
}

// Define the new element
customElements.define('flay-nav', FlayNav);
