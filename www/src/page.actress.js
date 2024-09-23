import './init/Page';
import './page.actress.scss';

import favoriteSVG from './svg/favorite.svg';
import noFavoriteSVG from './svg/noFavorite.svg';
import { popupActress, popupActressInfo } from './util/FlaySearch';
import StringUtils from './util/StringUtils';

class Page {
  constructor() {}

  async start() {
    const actressList = await fetch('/info/actress').then((res) => res.json());
    actressList.sort((a, b) => a.name.localeCompare(b.name));

    const searchInput = document.querySelector('body > header input');
    const main = document.querySelector('body > main');

    searchInput.setAttribute('placeholder', `${actressList.length} Actresses. Enter a keyword to search`);
    searchInput.addEventListener('change', (e) => {
      const keyword = e.target.value.trim();
      if (StringUtils.isBlank(keyword)) return;

      main.textContent = null;
      actressList
        .filter((actress) => Object.values(actress).join(' ').toLowerCase().includes(keyword.toLowerCase()))
        .forEach((actress) => {
          const item = main.appendChild(document.createElement('div'));
          item.dataset.name = actress.name;
          item.innerHTML = `
              <label class="favorite"   >${actress.favorite ? favoriteSVG : noFavoriteSVG}</label>
              <label class="name"       title="${actress.comment}">${actress.name}</label>
              <label class="local-name" >${actress.localName}</label>
              <label class="birth"      >${actress.birth}</label>
              <label class="body"       >${actress.body.replace(/ /g, '')}</label>
              <label class="height"     >${actress.height > 0 ? actress.height : ''}</label>
              <label class="debut"      >${actress.debut > 0 ? actress.debut : ''}</label>
            `;
        });
    });

    main.addEventListener('click', (e) => {
      const actressName = e.target.closest('div')?.dataset.name;
      if (StringUtils.isBlank(actressName)) return;

      switch (e.target.className) {
        case 'name':
          popupActress(actressName);
          break;
        case 'local-name':
          popupActressInfo(actressName);
          break;
      }
    });
  }
}

new Page().start();
