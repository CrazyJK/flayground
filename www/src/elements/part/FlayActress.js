import FlayAction from '../../util/flay.action';
import SVG from '../svg.json';

/**
 *
 */
export default class FlayActress extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다
    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('actress');
    const link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', './css/components.css');
    this.shadowRoot.append(link, this.wrapper); // 생성된 요소들을 shadow DOM에 부착합니다

    this.flay = null;
    this.actressList = null;
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
    this.wrapper.classList.toggle('archive', this.flay.archive);
    this.wrapper.classList.toggle('small', this.parentElement.classList.contains('small'));
    this.wrapper.textContent = null;

    actressList.forEach((actress, index) => {
      const actressDiv = this.wrapper.appendChild(document.createElement('div'));

      // favorite
      const favoriteElement = actressDiv.appendChild(document.createElement('span'));
      const input = favoriteElement.appendChild(document.createElement('input'));
      input.id = 'fav' + index;
      input.type = 'checkbox';
      input.checked = actress.favorite;
      input.addEventListener('change', (e) => {
        console.log('favoriteChange', e.target.checked, actress.name);
        FlayAction.setFavorite(actress.name, e.target.checked);
      });

      const label = favoriteElement.appendChild(document.createElement('label'));
      label.setAttribute('for', 'fav' + index);
      label.innerHTML = SVG.favorite;
      // name
      const nameElement = actressDiv.appendChild(document.createElement('a'));
      nameElement.classList.add('name');
      nameElement.title = actress.name + (actress.comment ? ' - ' + actress.comment : '');
      nameElement.innerHTML = actress.name;
      nameElement.addEventListener('click', () => {
        console.log('nameClick', actress.name);
        // window.open('/info/actress/' + actress.name, actress.name, 'width=640px,height=800px');
        window.open('card.actress.html?name=' + actress.name, actress.name, 'width=960px,height=1200px');
      });

      // localName
      const localNameElement = actressDiv.appendChild(document.createElement('label'));
      localNameElement.classList.add('localName');
      localNameElement.setAttribute('title', actress.localName);
      localNameElement.innerHTML = actress.localName;
      localNameElement.addEventListener('click', () => window.open('/info/actress/' + actress.name, actress.name, 'width=640px,height=800px'));

      // flay size
      const flaySize = actressDiv.appendChild(document.createElement('label'));
      flaySize.classList.add('flaySize');
      fetch(`/flay/find/actress/${actress.name}`)
        .then((response) => response.json())
        .then((flayList) => {
          flaySize.innerHTML = flayList.length + '<small>f</small>';
        });

      // age
      const ageElement = actressDiv.appendChild(document.createElement('label'));
      ageElement.classList.add('age');
      ageElement.setAttribute('title', actress.birth);
      let currentYear = new Date().getFullYear();
      let releaseYear = Number(flay.release.substring(0, 4));
      let birthYear = Number(actress.birth.substring(0, 4));
      ageElement.innerHTML = actress.birth ? `${releaseYear - birthYear + 1}<small>${releaseYear !== currentYear ? '/' + (currentYear - birthYear + 1) : ''}y</small>` : '';

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
