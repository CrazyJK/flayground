import './inc/Page';
import './page.archive.scss';

import FlayArticle from '../flay/domain/FlayArticle';
import FlayPagination from '../flay/panel/FlayPagination';
import FlayFetch from '../lib/FlayFetch';

class Page {
  async start() {
    const flayArticle = document.querySelector('body > main').appendChild(new FlayArticle());
    const flayPagination = document.querySelector('body > footer').appendChild(new FlayPagination());

    flayPagination.addEventListener('change', async (e) => flayArticle.set(await FlayFetch.getArchive(e.target.opus)));
    flayPagination.set(await FlayFetch.getArchiveOpusList());
  }
}

new Page().start();
