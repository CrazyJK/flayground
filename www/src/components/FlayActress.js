/**
 *
 */
export default class FlayActress extends HTMLElement {
  /**
   *
   * @param {Actress} actress
   * @param {String} opus
   */
  constructor(actress, opus) {
    super();

    // shadow root을 생성합니다
    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다

    const wrapper = document.createElement('div');
    wrapper.setAttribute('data-opus', opus);
    wrapper.classList.add('actress');

    // name
    const nameElement = wrapper.appendChild(document.createElement('label'));
    nameElement.setAttribute('title', actress.name);
    nameElement.textContent = actress.name;

    // localName
    const localNameElement = wrapper.appendChild(document.createElement('label'));
    localNameElement.setAttribute('title', actress.localName);
    localNameElement.textContent = actress.localName;

    // birth
    const birthNameElement = wrapper.appendChild(document.createElement('label'));
    birthNameElement.setAttribute('title', actress.birth);
    birthNameElement.textContent = actress.birth;

    // body
    const bodyNameElement = wrapper.appendChild(document.createElement('label'));
    bodyNameElement.setAttribute('title', actress.body);
    bodyNameElement.textContent = actress.body;

    // height
    const heightNameElement = wrapper.appendChild(document.createElement('label'));
    heightNameElement.setAttribute('title', actress.height);
    heightNameElement.textContent = actress.height;

    // debut
    const debutNameElement = wrapper.appendChild(document.createElement('label'));
    debutNameElement.setAttribute('title', actress.debut);
    debutNameElement.textContent = actress.debut;

    // 외부 스타일을 shadow dom에 적용하기
    const style = document.createElement('link');
    style.setAttribute('rel', 'stylesheet');
    style.setAttribute('href', './css/components.css');

    // 생성된 요소들을 shadow DOM에 부착합니다
    this.shadowRoot.append(style, wrapper);
  }
}

// Define the new element
customElements.define('flay-actress', FlayActress);
