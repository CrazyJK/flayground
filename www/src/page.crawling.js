import './init/Page';
import './page.crawling.scss';
import DateUtils from './util/DateUtils';

const DOMAIN = 'https://www.nanojav.com';
const LIST_URL = DOMAIN + '/jav/?order=new&page=';
const domParser = new DOMParser();

class Page {
  constructor() {
    this.urlInput = document.querySelector('body > main > header input[type="url"]');
    this.pageInput = document.querySelector('body > main > header input[type="number"]');
    this.crawlingBtn = document.querySelector('body > main > header button');
    this.article = document.querySelector('body > main > article');
    this.footer = document.querySelector('body > main > footer');

    this.urlInput.value = LIST_URL;
    this.pageInput.addEventListener('change', async () => await this.callCrawling());
    this.crawlingBtn.addEventListener('click', async () => await this.callCrawling());
  }

  async callCrawling() {
    this.toggleDisable(true);
    this.message(this.pageInput.value + '페이지 크롤링 중');
    await fetch(`/crawling/curl?url=${encodeURIComponent(LIST_URL + this.pageInput.value)}`).then((res) => res.text());
  }

  async start() {
    await this.callCrawling();
  }

  message(message) {
    this.footer.innerHTML = message;
  }

  toggleDisable(force) {
    this.pageInput.disabled = force;
    this.crawlingBtn.disabled = force;
  }

  /**
   *
   * @param {object[]} dataList
   */
  render(dataList) {
    console.debug(dataList);

    this.article.textContent = null;
    dataList.forEach((data) => {
      const div = this.article.appendChild(document.createElement('div'));
      div.innerHTML = `
        <div class="cover">
          <img src="${data.cover}">
        </div>
        <div class="opus">
          <label data-href="${data.opus.href}">${data.opus.text}</label>
        </div>
        <div class="release">
          <label>${data.release}</label>
        </div>
        <div class="title" title="title">
          <label>${data.title}</label>
        </div>
        <div class="tags" title="tags">
          ${data.tagList.map((tag) => `<label data-href="${tag.href}">${tag.text}</label>`).join('')}
        </div>
        <div class="actress-list" title="actress">
          ${data.actressList.map((actress) => `<label data-href="${actress.href}">${actress.text}</label>`).join('')}
        </div>
        <div class="download-list" title="download. click to copy">
          ${data.downloadList.map((download) => `<label data-href="${download.href}">${download.type} ${download.text}</label>`).join('')}
        </div>
        <div class="posted" title="posted">
          <label data-href="${data.posted.href}">${data.posted.text}</label>
        </div>
      `;

      div.querySelector('.opus label').addEventListener('click', (e) =>
        window.navigator.clipboard.writeText(e.target.textContent).then(() => {
          e.target.animate([{ transform: 'scale(1.25)' }, { transform: 'none' }], { duration: 500, iterations: 1 });
        })
      );
      div.querySelectorAll('.download-list label').forEach((label) =>
        label.addEventListener('click', (e) =>
          window.navigator.clipboard.writeText(DOMAIN + e.target.dataset.href).then(() => {
            e.target.animate([{ transform: 'scale(1.25)' }, { transform: 'none' }], { duration: 500, iterations: 1 });
          })
        )
      );
    });
  }
}

const page = new Page();
page.start();

window.emitCurl = (data) => {
  page.toggleDisable(false);

  const doc = domParser.parseFromString(data.message, 'text/html');
  console.debug(doc);

  const postList = Array.from(doc.querySelectorAll('#content > div > div > div:nth-child(2) > div > div'));
  if (postList.length > 0) {
    page.message(postList.length + '개 구함');
  } else {
    page.message('데이터를 구하지 못함');
    return;
  }

  page.render(
    postList.map((div) => {
      const elementOfImg = div.querySelector('img.cover');
      const elementOfOpus = div.querySelector('h3.title a');
      const elementOfPost = div.querySelector('p.subtitle a');
      const elementOfSubtitle = div.querySelector('div.card-content > p:nth-child(4)');
      const elementOfRelease = div.querySelector('div.card-content > p:nth-child(5)');
      const nodeListOfActress = div.querySelectorAll('div.card-content > div.mb-2.buttons.are-small > a');
      const nodeListOfDownload = div.querySelectorAll('div.card-content > div.is-uppercase.has-text-weight-bold.buttons > a');
      const nodeListOfTags = div.querySelectorAll('.tags a');

      return {
        opus: { text: elementOfOpus.textContent.trim(), href: elementOfOpus.getAttribute('href') },
        cover: elementOfImg.src,
        release: DateUtils.format(elementOfRelease?.textContent.replace('Release date:', ''), 'yyyy.MM.dd'),
        posted: { text: DateUtils.format(elementOfPost.textContent, 'yyyy-MM-dd'), href: elementOfPost.getAttribute('href') },
        title: elementOfSubtitle.textContent,
        actressList: Array.from(nodeListOfActress).map((a) => ({ text: a.textContent.trim(), href: a.getAttribute('href') })),
        downloadList: Array.from(nodeListOfDownload).map((a) => ({
          text: a.textContent.trim(),
          href: a.getAttribute('href'),
          type: Array.from(a.querySelectorAll('.tooltip'))
            ?.map((tip) => tip.dataset.tooltip)
            .join(','),
        })),
        tagList: Array.from(nodeListOfTags).map((a) => ({ text: a.textContent.trim(), href: a.getAttribute('href') })),
      };
    })
  );
};
