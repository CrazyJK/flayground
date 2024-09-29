import FlayArticle from '../flay/FlayArticle';
import FlayPagination from '../flay/page/FlayPagination';

export default class FlayArchive extends HTMLDivElement {
  constructor() {
    super();

    this.classList.add('flay-archive');

    const flayArticle = this.appendChild(new FlayArticle());
    const flayPagination = this.appendChild(new FlayPagination());

    fetch('/archive')
      .then((res) => res.json())
      .then((list) => {
        list.sort((a1, a2) => a1.release.localeCompare(a2.release));

        const archiveMap = Array.from(list).reduce((map, archive) => {
          map.set(archive.opus, archive);
          return map;
        }, new Map());

        flayPagination.addEventListener('change', (e) => {
          const opus = e.target.opus;
          const flay = archiveMap.get(opus);
          flayArticle.set(flay);
        });
        flayPagination.set(Array.from(archiveMap.keys()));
      });
  }
}

customElements.define('flay-archive', FlayArchive, { extends: 'div' });
