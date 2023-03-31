/**
 *
 */
export default class FlayActress extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다

    this.flay = null;
    this.actressList = null;
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
    this.flay = flay;
    this.actressList = actressList;

    this.wrapper.setAttribute('data-opus', flay.opus);
    this.wrapper.textContent = null;

    actressList.forEach((actress, index) => {
      const actressDiv = this.wrapper.appendChild(document.createElement('div'));

      // favorite
      const favoriteElement = actressDiv.appendChild(document.createElement('span'));
      const input = favoriteElement.appendChild(document.createElement('input'));
      input.setAttribute('type', 'checkbox');
      input.setAttribute('id', 'fav' + index);
      input.checked = actress.favorite;
      const label = favoriteElement.appendChild(document.createElement('label'));
      label.setAttribute('for', 'fav' + index);
      label.innerHTML = `<svg width="1.5rem" height="1.5rem" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;

      // name
      const nameElement = actressDiv.appendChild(document.createElement('label'));
      nameElement.classList.add('name');
      nameElement.setAttribute('title', actress.name + (actress.comment ? ' - ' + actress.comment : ''));
      nameElement.innerHTML = actress.name;

      // localName
      const localNameElement = actressDiv.appendChild(document.createElement('label'));
      localNameElement.classList.add('localName');
      localNameElement.setAttribute('title', actress.localName);
      localNameElement.innerHTML = actress.localName;

      // age
      const ageElement = actressDiv.appendChild(document.createElement('label'));
      ageElement.classList.add('age');
      ageElement.setAttribute('title', actress.birth);
      let currentYear = new Date().getFullYear();
      let releaseYear = Number(flay.release.substring(0, 4));
      let birthYear = Number(actress.birth.substring(0, 4));
      ageElement.innerHTML = actress.birth ? `${releaseYear - birthYear + 1}<small>/${releaseYear !== currentYear ? currentYear - birthYear + 1 : ''}y</small>` : '';

      // birth
      // const birthElement = actressDiv.appendChild(document.createElement('label'));
      // birthElement.classList.add('birth');
      // birthElement.setAttribute('title', actress.birth);
      // birthElement.innerHTML = actress.birth?.replace(/年|月|日/g, (match) => '<small>' + match + '</small>');

      // body
      const bodyElement = actressDiv.appendChild(document.createElement('label'));
      bodyElement.classList.add('body');
      bodyElement.setAttribute('title', actress.body);
      bodyElement.innerHTML = actress.body.replace(/ /g, '');

      // height
      const heightElement = actressDiv.appendChild(document.createElement('label'));
      heightElement.classList.add('height');
      heightElement.setAttribute('title', actress.height);
      heightElement.innerHTML = actress.height ? actress.height + '<small>cm</small>' : '';

      // debut
      const debutElement = actressDiv.appendChild(document.createElement('label'));
      debutElement.classList.add('debut');
      debutElement.setAttribute('title', actress.debut);
      debutElement.innerHTML = actress.debut ? actress.debut + '<small>d</small>' : '';
    });
  }
}

// Define the new element
customElements.define('flay-actress', FlayActress);
