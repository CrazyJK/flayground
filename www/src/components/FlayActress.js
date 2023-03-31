/**
 *
 */
export default class FlayActress extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다

    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('actress');

    // 외부 스타일을 shadow dom에 적용하기
    const style = document.createElement('link');
    style.setAttribute('rel', 'stylesheet');
    style.setAttribute('href', './css/components.css');

    this.shadowRoot.append(style, this.wrapper); // 생성된 요소들을 shadow DOM에 부착합니다
  }

  /**
   *
   * @param {Flay} flay
   * @param {Actress[]} actressList
   */
  set(flay, actressList) {
    this.wrapper.setAttribute('data-opus', flay.opus);
    this.wrapper.textContent = null;

    actressList.forEach((actress) => {
      const actressDiv = this.wrapper.appendChild(document.createElement('div'));

      // name
      const nameElement = actressDiv.appendChild(document.createElement('label'));
      nameElement.setAttribute('title', actress.name);
      nameElement.textContent = actress.name;

      // localName
      const localNameElement = actressDiv.appendChild(document.createElement('label'));
      localNameElement.setAttribute('title', actress.localName);
      localNameElement.textContent = actress.localName;

      // birth
      const birthNameElement = actressDiv.appendChild(document.createElement('label'));
      birthNameElement.setAttribute('title', actress.birth);
      birthNameElement.textContent = actress.birth;

      // body
      const bodyNameElement = actressDiv.appendChild(document.createElement('label'));
      bodyNameElement.setAttribute('title', actress.body);
      bodyNameElement.textContent = actress.body;

      // height
      const heightNameElement = actressDiv.appendChild(document.createElement('label'));
      heightNameElement.setAttribute('title', actress.height);
      heightNameElement.textContent = actress.height;

      // debut
      const debutNameElement = actressDiv.appendChild(document.createElement('label'));
      debutNameElement.setAttribute('title', actress.debut);
      debutNameElement.textContent = actress.debut;
    });
  }
}

// Define the new element
customElements.define('flay-actress', FlayActress);
