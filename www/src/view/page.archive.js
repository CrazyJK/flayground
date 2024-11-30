import './inc/Page';
import './page.archive.scss';

import FlayArticle from '../flay/domain/FlayArticle';
import FlayPagination from '../flay/panel/FlayPagination';

class Page {
  async start() {
    const list = await fetch('/archive').then((res) => res.json());
    list.sort((a1, a2) => a1.release.localeCompare(a2.release));

    const archiveMap = Array.from(list).reduce((map, archive) => {
      map.set(archive.opus, archive);
      return map;
    }, new Map());

    const flayArticle = document.querySelector('body > main').appendChild(new FlayArticle());
    const flayPagination = document.querySelector('body > footer').appendChild(new FlayPagination());

    flayPagination.addEventListener('change', (e) => {
      const opus = e.target.opus;
      const flay = archiveMap.get(opus);
      flayArticle.set(flay);
    });
    flayPagination.set(Array.from(archiveMap.keys()));
  }
}

new Page().start();
