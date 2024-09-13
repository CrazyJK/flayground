import FlayStudio from './flay/part/FlayStudio';
import './init/Page';
import './page.studio.scss';
import StringUtils from './util/StringUtils';

class Page {
  constructor() {}

  async start() {
    const studioList = await fetch('/info/studio').then((res) => res.json());

    const main = document.querySelector('body > main');
    studioList.forEach((studio) => main.appendChild(new FlayStudio()).set({ studio: studio.name, archive: false }));

    document.querySelector('body > header input').addEventListener('change', (e) => {
      const keyword = e.target.value;
      if (StringUtils.isBlank(keyword)) {
        main.querySelectorAll('.flay-studio').forEach((flayStudio) => {
          flayStudio.classList.toggle('found', false);
          flayStudio.classList.toggle('hide', false);
        });
      } else {
        main.querySelectorAll('.flay-studio').forEach((flayStudio) => {
          const found = flayStudio.flay.studio.toLowerCase().indexOf(keyword.toLowerCase()) > -1;
          flayStudio.classList.toggle('hide', !found);
        });
      }
    });
  }
}

new Page().start();
