import './init/Page';
import './page.actress.scss';
import favoriteSVG from './svg/favorite.svg';
import noFavoriteSVG from './svg/noFavorite.svg';
import StringUtils from './util/StringUtils';

class Page {
  constructor() {}

  async start() {
    const actressList = await fetch('/info/actress').then((res) => res.json());
    console.log(actressList);

    const main = document.querySelector('body > main');

    actressList.forEach((actress) => {
      const item = main.appendChild(document.createElement('div'));
      item.innerHTML = `
        <label class="favorite  ">${actress.favorite ? favoriteSVG : noFavoriteSVG}</label>
        <label class="name      " title="${actress.comment}">${actress.name}</label>
        <label class="local-name">${actress.localName}</label>
        <label class="birth     ">${actress.birth}</label>
        <label class="body      ">${actress.body.replace(/ /g, '')}</label>
        <label class="height    ">${actress.height > 0 ? actress.height : ''}</label>
        <label class="debut     ">${actress.debut > 0 ? actress.debut : ''}</label>
      `;
    });

    document.querySelector('body > header input').addEventListener('change', (e) => {
      const keyword = e.target.value;
      if (StringUtils.isBlank(keyword)) {
        main.querySelectorAll('body > main > div').forEach((actressDiv) => {
          actressDiv.classList.toggle('found', false);
          actressDiv.classList.toggle('hide', false);
        });
      } else {
        main.querySelectorAll('body > main > div').forEach((actressDiv) => {
          const found = actressDiv.innerText.toLowerCase().indexOf(keyword.toLowerCase()) > -1;
          actressDiv.classList.toggle('hide', !found);
        });
      }
    });
  }
}

new Page().start();
