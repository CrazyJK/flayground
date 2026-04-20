import FlayArticle from '@flay/domain/FlayArticle';
import FlayPagination from '@flay/panel/FlayPagination';
import FlayFetch from '@lib/FlayFetch';
import './inc/Page';
import './page.archive.scss';

class Page {
  async start() {
    const flayArticle = document.querySelector('body > main')!.appendChild(new FlayArticle({}));
    const flayPagination = document.querySelector('body > footer')!.appendChild(new FlayPagination());

    flayPagination.addEventListener('change', async (e) => {
      const pagination = e.target as FlayPagination;
      const archiveData = await FlayFetch.getArchive(pagination.opus!);
      if (archiveData) {
        flayArticle.set(archiveData);
      }
    });
    flayPagination.set(await FlayFetch.getArchiveOpusList());
  }
}

void new Page().start();
