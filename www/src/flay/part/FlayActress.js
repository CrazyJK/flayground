import SVG from '../../svg/svg.json';
import FlayAction from '../../util/FlayAction';
import './FlayActress.scss';
import FlayHTMLElement from './FlayHTMLElement';

/**
 * Custom element of Actress
 */
export default class FlayActress extends FlayHTMLElement {
  flay;
  actressList;

  constructor() {
    super();
  }

  connectedCallback() {
    //
  }

  /**
   *
   * @param {Flay} flay
   * @param {Actress[]} actressList
   */
  async set(flay, actressList = []) {
    this.flay = flay;

    if (actressList.length === 0) {
      for (const name of flay.actressList) {
        actressList.push(await fetch(`/info/actress/${name}`).then((res) => res.json()));
      }
    }
    this.actressList = actressList;

    this.wrapper.setAttribute('data-opus', flay.opus);
    this.wrapper.classList.toggle('archive', this.flay.archive);
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
      const nameLabel = actressDiv.appendChild(document.createElement('label'));
      nameLabel.classList.add('name');
      const nameElement = nameLabel.appendChild(document.createElement('a'));
      nameElement.title = actress.name + (actress.comment ? ' - ' + actress.comment : '');
      nameElement.innerHTML = actress.name;
      nameElement.addEventListener('click', () => {
        // window.open('/info/actress/' + actress.name, actress.name, 'width=640px,height=800px');
        window.open('popup.actress.html?name=' + actress.name, actress.name, 'width=960px,height=1200px');
      });

      // localName
      const localNameElement = actressDiv.appendChild(document.createElement('label'));
      localNameElement.classList.add('localName');
      localNameElement.innerHTML = actress.localName;
      localNameElement.addEventListener('click', () => window.open('/info/actress/' + actress.name, actress.name + '_info', 'width=640px,height=800px'));

      // flay size
      const flaySize = actressDiv.appendChild(document.createElement('label'));
      flaySize.classList.add('flaySize');
      let flayCount;
      if (window.actressMap) {
        flayCount = window.actressMap.get(actress.name);
      }
      if (flayCount) {
        flaySize.innerHTML = flayCount + '<small>f</small>';
      } else {
        fetch(`/flay/count/actress/${actress.name}`)
          .then((response) => response.text())
          .then((flayCount) => {
            flaySize.innerHTML = flayCount + '<small>f</small>';
            if (window.actressMap) {
              window.actressMap.set(actress.name, flayCount);
            }
          });
      }

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
      bodyElement.innerHTML = toInchBody(actress.body);

      // height
      const heightElement = actressDiv.appendChild(document.createElement('label'));
      heightElement.classList.add('height');
      heightElement.setAttribute('title', actress.height);
      heightElement.innerHTML = actress.height && actress.height > 0 ? actress.height + '<small>cm</small>' : '';

      // debut
      const debutElement = actressDiv.appendChild(document.createElement('label'));
      debutElement.classList.add('debut');
      debutElement.setAttribute('title', actress.debut);
      debutElement.innerHTML = actress.debut && actress.debut > 0 ? actress.debut + '<small>d</small>' : '';
    });
  }
}

// Define the new element
customElements.define('flay-actress', FlayActress);

function toInchBody(body) {
  if (body === null || body.trim() === '') {
    return '';
  }
  let parts = body.split('-');
  let b = parts[0]?.replace(/[^0-9]/g, '').trim();
  let c = parts[0]?.replace(/[0-9]/g, '').trim();
  let w = parts[1]?.trim();
  let h = parts[2]?.trim();

  return Math.round(b / 2.54) + c + '-' + Math.round(w / 2.54) + '-' + Math.round(h / 2.54);
}
