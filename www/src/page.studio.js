import './init/Page';
import './page.studio.scss';

import FlayStudio from './flay/part/FlayStudio';
import StringUtils from './util/StringUtils';

class Page {
  constructor() {}

  async start() {
    const studioList = await fetch('/info/studio').then((res) => res.json());

    const searchInput = document.querySelector('body > header input');
    const main = document.querySelector('body > main');

    // render
    studioList.forEach((studio) => main.appendChild(new FlayStudio()).set({ studio: studio.name, archive: false }));

    // search
    searchInput.setAttribute('placeholder', `${studioList.length} Studio. Enter a keyword to search`);
    searchInput.addEventListener('change', (e) => {
      const keyword = e.target.value;
      if (StringUtils.isBlank(keyword)) {
        main.querySelectorAll('.flay-studio').forEach((flayStudio) => flayStudio.classList.remove('found'));
      } else {
        main.querySelectorAll('.flay-studio').forEach((flayStudio) => flayStudio.classList.toggle('found', flayStudio.flay.studio.toLowerCase().includes(keyword.toLowerCase())));
      }
    });
  }
}

new Page().start();
