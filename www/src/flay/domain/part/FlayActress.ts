import FlayAction from '@lib/FlayAction';
import FlayFetch, { Actress, Flay } from '@lib/FlayFetch';
import { popupActress, popupActressInfo } from '@lib/FlaySearch';
import StringUtils from '@lib/StringUtils';
import favoriteSVG from '@svg/favorite';
import './FlayActress.scss';
import FlayHTMLElement, { defineCustomElements } from './FlayHTMLElement';

/**
 * Custom element of Actress
 */
export default class FlayActress extends FlayHTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {}

  /**
   *
   * @param flay
   * @param actressList
   */
  async set(flay: Flay, actressList: Actress[]): Promise<void> {
    this.setFlay(flay);

    this.textContent = null;
    actressList
      .filter((actress) => !StringUtils.isBlank(actress.name))
      .forEach((actress, index) => {
        const actressDiv = this.appendChild(document.createElement('div'));

        // favorite
        const favoriteElement = actressDiv.appendChild(document.createElement('span'));
        const input = favoriteElement.appendChild(document.createElement('input'));
        input.id = 'fav' + index;
        input.type = 'checkbox';
        input.checked = actress.favorite;
        input.addEventListener('change', (e) => {
          const target = e.target as HTMLInputElement;
          console.log('favoriteChange', target.checked, actress.name);
          FlayAction.setFavorite(actress.name, target.checked);
        });
        const label = favoriteElement.appendChild(document.createElement('label'));
        label.setAttribute('for', 'fav' + index);
        label.innerHTML = favoriteSVG;

        // name
        const nameLabel = actressDiv.appendChild(document.createElement('label'));
        nameLabel.classList.add('name');
        const nameElement = nameLabel.appendChild(document.createElement('a'));
        nameElement.title = actress.name + (actress.comment ? ' - ' + actress.comment : '');
        nameElement.innerHTML = actress.name;
        nameElement.addEventListener('click', () => popupActress(actress.name));

        // localName
        const localNameElement = actressDiv.appendChild(document.createElement('label'));
        localNameElement.classList.add('localName');
        localNameElement.innerHTML = actress.localName;
        localNameElement.addEventListener('click', () => popupActressInfo(actress.name));

        // flay size
        const flaySize = actressDiv.appendChild(document.createElement('label'));
        flaySize.classList.add('flaySize');
        if (flaySize.checkVisibility()) {
          FlayFetch.getCountOfFlay(actress.name).then((flayCount) => (flaySize.innerHTML = flayCount + '<small>f</small>'));
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
        heightElement.innerHTML = actress.height && actress.height > 0 ? actress.height + '<small>cm</small>' : '';

        // debut
        const debutElement = actressDiv.appendChild(document.createElement('label'));
        debutElement.classList.add('debut');
        debutElement.innerHTML = actress.debut && actress.debut > 0 ? actress.debut + '<small>d</small>' : '';
      });
  }
}

defineCustomElements('flay-actress', FlayActress);

function toInchBody(body: string | null): string {
  if (body === null || body.trim() === '') {
    return '';
  }
  let parts = body.split('-');
  let b = parts[0]?.replace(/[^0-9]/g, '').trim();
  let c = parts[0]?.replace(/[0-9]/g, '').trim();
  let w = parts[1]?.trim();
  let h = parts[2]?.trim();

  return Math.round(parseInt(b) / 2.54) + c + '-' + Math.round(parseInt(w) / 2.54) + '-' + Math.round(parseInt(h) / 2.54);
}
