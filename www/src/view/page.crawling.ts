import NanoStore from '@flay/idb/nano/store/NanoStore';
import ApiClient from '@lib/ApiClient';
import DateUtils from '@lib/DateUtils';
import FlayFetch from '@lib/FlayFetch';
import FlaySearch, { popupActress, popupFlay } from '@lib/FlaySearch';
import './inc/Page';
import './page.crawling.scss';

interface LinkItem {
  text: string;
  href: string;
}

interface DownloadItem extends LinkItem {
  type: string;
}

interface VideoInfo {
  error?: boolean;
  rank?: number;
  play?: number;
  lastModified?: string;
}

interface ActressItem extends LinkItem {
  eng?: string;
  jap?: string;
  fav?: string;
}

interface CrawlingItem {
  opus: LinkItem;
  cover: string;
  release: string;
  posted: LinkItem;
  title: string;
  actressList: ActressItem[];
  downloadList: DownloadItem[];
  tagList: LinkItem[];
}

const DOMAIN = 'https://www.nanojav.com';
const LIST_URL = DOMAIN + '/jav/?order=new&page=';
const domParser = new DOMParser();
const nanoStore = new NanoStore();

class Page {
  #itemList: CrawlingItem[] = [];
  #startPageNo = 0;
  #paging = {
    srcPageNo: 0,
    itemIndex: 0,
    itemLength: 0,
    needCrawling: () => {
      // 10개 남으면 크롤링
      return this.#paging.itemLength - this.#paging.itemIndex === 10;
    },
  };
  #videoCache = new Map(); // Cache for video data
  #actressCache = new Map(); // Cache for actress data
  #recordCache = new Map(); // Cache for NanoStore records
  #crawlingStartTime: number = 0; // 크롤링 시작 시간

  article: HTMLElement;
  retryBtn: HTMLButtonElement;
  itemRepository: HTMLElement;

  constructor() {
    document.querySelector('#startBtn')!.addEventListener('click', () => {
      this.#startPageNo = parseInt((document.querySelector('#srcPageNo') as HTMLInputElement).value);
      this.#paging.srcPageNo = this.#startPageNo;
      this.#callCrawling();
      document.querySelector('#starter')!.classList.add('hide');
    });

    this.article = document.querySelector('body > main > article')!;
    // Use passive event listeners for performance
    this.article.addEventListener('wheel', this.#handleWheel.bind(this), { passive: true });
    window.addEventListener('keyup', this.#handleKeyUp.bind(this));

    this.retryBtn = document.querySelector('body > main > footer > #retryBtn')!;
    this.retryBtn.addEventListener('click', () => this.#callCrawling());

    this.itemRepository = document.querySelector('#itemRepository')!;

    // Delegate event listeners for better performance
    this.article.addEventListener('click', this.#handleRepositoryClick.bind(this));
  }

  // Throttled wheel event handler
  #handleWheel(e: WheelEvent) {
    if (e.deltaY > 0) {
      this.#next();
    } else {
      this.#prev();
    }
  }

  // Handle keyboard events
  #handleKeyUp(e: KeyboardEvent) {
    switch (e.code) {
      case 'ArrowRight':
        this.#next();
        break;
      case 'ArrowLeft':
        this.#prev();
        break;
    }
  }

  // Event delegation for all item repository clicks
  #handleRepositoryClick(e: Event) {
    const target = e.target as HTMLElement;

    // Handle different click targets
    if (target.closest('.opus label, .title label')) {
      this.#copyToClipboard(target);
    } else if (target.closest('.download-list label')) {
      const label = target.closest('.download-list label') as HTMLElement;
      this.#download(label, DOMAIN + label.dataset.href);
    } else if (target.closest('.actress-list label span')) {
      popupActress(target.textContent!);
    } else if (target.closest('.video label')) {
      const div = target.closest('div[data-opus]') as HTMLElement;
      if (div?.dataset.opus) popupFlay(div.dataset.opus);
    } else if (target.closest('.posted label')) {
      const div = target.closest('div[data-opus]') as HTMLElement;
      if (div?.dataset.opus) FlaySearch.torrent.Nonojav(div.dataset.opus);
    }
  }

  #next() {
    ++this.#paging.itemIndex;

    this.#showItem();

    if (this.#paging.needCrawling()) {
      ++this.#paging.srcPageNo;
      this.#callCrawling();
    }
  }

  #prev() {
    --this.#paging.itemIndex;

    if (this.#paging.itemIndex < 0) {
      this.#paging.itemIndex = 0;
      return;
    }
    this.#showItem();
  }

  #showItem() {
    const data = this.#itemList[this.#paging.itemIndex];
    if (!data) return;

    // Move previous item to repository using DocumentFragment for better performance
    const prevDiv = this.article.querySelector('div');
    if (prevDiv) {
      this.itemRepository.appendChild(prevDiv);
    }

    // Get the new item
    const currentDiv = this.itemRepository.querySelector(`div[data-opus="${data.opus.text}"]`);
    if (currentDiv) {
      this.article.appendChild(currentDiv);
    }

    // Update store in background, don't wait for it
    nanoStore.update(data.opus.text, Date.now()).catch((err) => console.error('Error updating store:', err));

    this.#updateFootMessage();
  }

  // Pre-fetch data for better performance
  async #prefetchData(itemList: CrawlingItem[]) {
    const opusList = itemList.map((data: CrawlingItem) => data.opus.text);
    const japNameList = itemList.flatMap((data: CrawlingItem) =>
      data.actressList.map((actress: LinkItem) => {
        let jap = '';
        const name = actress.text;
        if (name.includes('(')) {
          const parts = name
            .substring(0, name.length - 1)
            .split('(')
            .map((s: string) => s.trim());
          jap = parts[1] ?? '';
        } else {
          jap = name;
        }
        return jap;
      })
    );

    // Batch fetch videos
    const videoPromises = opusList.map(async (opus: string) => {
      if (!this.#videoCache.has(opus)) {
        try {
          const video = await FlayFetch.getVideo(opus);
          this.#videoCache.set(opus, video);
        } catch (err) {
          this.#videoCache.set(opus, { error: true });
        }
      }
    });

    // Batch fetch actress data
    const actressPromises = japNameList.map(async (jap: string) => {
      if (jap && !this.#actressCache.has(jap)) {
        try {
          const actressList = await FlayFetch.getActressListByLocalname(jap);
          this.#actressCache.set(jap, actressList ?? []);
        } catch (err) {
          this.#actressCache.set(jap, []);
        }
      }
    });

    // Batch fetch records
    const recordPromises = opusList.map(async (opus: string) => {
      if (!this.#recordCache.has(opus)) {
        try {
          const record = await nanoStore.select(opus);
          this.#recordCache.set(opus, record);
        } catch (err) {
          this.#recordCache.set(opus, null);
        }
      }
    });

    // Execute all promises in parallel
    await Promise.all([Promise.all(videoPromises), Promise.all(actressPromises), Promise.all(recordPromises)]);
  }

  async #renderItemList(itemList: CrawlingItem[]) {
    // Prefetch all data in parallel before rendering
    await this.#prefetchData(itemList);

    // Create a document fragment to batch DOM operations
    const fragment = document.createDocumentFragment();

    let count = 0;
    for (const data of itemList) {
      // Use cached data instead of making new requests
      const video = this.#videoCache.get(data.opus.text) || { error: true };

      // Process actress data using cache
      for (const actress of data.actressList) {
        let eng = '';
        let jap = '';

        const name = actress.text;
        if (name.includes('(')) {
          const parts = name
            .substring(0, name.length - 1)
            .split('(')
            .map((s: string) => s.trim());
          eng = parts[0] ? parts[0].split(' ').reverse().join(' ') : '';
          jap = parts[1] ?? '';
        } else {
          jap = name;
        }

        // Use cached actress data
        const actressList = this.#actressCache.get(jap) || [];
        const latestActress = actressList[actressList.length - 1];

        actress['eng'] = latestActress?.name || eng || ' ';
        actress['jap'] = jap;
        actress['fav'] = latestActress?.favorite ? '💛' : '';
      }

      const div = document.createElement('div');
      div.dataset.opus = data.opus.text;
      div.dataset.itemIndex = String(this.#paging.itemIndex + count++);
      div.classList.toggle('has-video', !video.error);

      // Use template literals for HTML generation
      div.innerHTML = this.#generateItemHTML(data, video);

      // Use cached record data
      const record = this.#recordCache.get(data.opus.text);
      if (record) {
        const viewDate = DateUtils.format(record.date, 'yyyy-MM-dd HH:mm');
        div.querySelector('.posted')!.appendChild(document.createElement('label')).innerHTML = `${viewDate}<sub> view</sub>`;

        if (data.posted.text < viewDate) {
          div.classList.add('record-viewed');
        } else {
          div.classList.add('record-updated');
        }
      }

      fragment.appendChild(div);
    }

    // Append all items at once
    this.itemRepository.appendChild(fragment);
  }

  // Generate HTML string for each item
  #generateItemHTML(data: CrawlingItem, video: VideoInfo | null) {
    return `
      <div class="cover">
        <img src="${data.cover}">
      </div>
      <div class="opus" title="opus">
        <label data-href="${data.opus.href}">${data.opus.text}</label>
      </div>
      <div class="video" title="video info">
        ${
          !video || video.error
            ? ''
            : ` <label>${video.rank}<sub>rank</sub></label>
                <label>${video.play}<sub>play</sub></label>
                <label>${DateUtils.format(video.lastModified ?? '', 'yyyy-MM-dd')}<sub>modi.</sub></label>`
        }
      </div>
      <div class="release" title="release">
        <label>${data.release}</label>
      </div>
      <div class="title" title="title">
        <label>${data.title}</label>
      </div>
      <div class="tags" title="tags">
        ${data.tagList.map((tag: LinkItem) => `<label data-href="${tag.href}">${tag.text}</label>`).join('')}
      </div>
      <div class="actress-list" title="actress">
        ${data.actressList.map((actress: ActressItem) => `<label data-href="${actress.href}" title="${actress.text}">${actress.fav}<span title="english name">${actress.eng}</span> <span title="japanese name">${actress.jap}</span></label>`).join('')}
      </div>
      <div class="download-list" title="download. click to copy">
        ${data.downloadList.map((download: DownloadItem) => `<label data-href="${download.href}">${download.type} ${download.text}</label>`).join('')}
      </div>
      <div class="posted" title="posted">
        <label data-href="${data.posted.href}">${data.posted.text} <sub>posted</sub></label>
      </div>
    `;
  }

  #copyToClipboard(target: HTMLElement | null, text: string = '') {
    void window.navigator.clipboard.writeText(text || this.#getText(target)!).then(() => {
      target?.animate([{ transform: 'scale(1.25)' }, { transform: 'none' }], { duration: 500, iterations: 1 });
    });
  }

  #download(target: HTMLElement | null, text: string = '') {
    const url = text || this.#getText(target);
    if (!url) return;

    const formData = new FormData();
    formData.append('url', url);
    void ApiClient.getResponse('/download', { method: 'post', body: formData })
      .then(async (res) => {
        // 헤더에서 파일명을 가져옴
        const filename = res.headers.get('Content-Disposition')!.split('filename=')[1]!.replace(/"/g, '');
        return res.blob().then((blob) => ({ blob, filename }));
      })
      .then(({ blob, filename }) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url); // free memory
      });
  }

  #getText(element: HTMLElement | null) {
    return element?.textContent!.trim();
  }

  #getHref(element: HTMLElement | null) {
    return element?.getAttribute('href');
  }

  async parseOfNanojav(data: { message?: string }) {
    // 크롤링 완료 시간 측정 및 소요시간 계산
    const crawlingEndTime = performance.now();
    const crawlingDuration = this.#crawlingStartTime > 0 ? crawlingEndTime - this.#crawlingStartTime : 0;

    if (crawlingDuration > 0) {
      console.log(`🚀 크롤링 소요시간: ${crawlingDuration.toFixed(2)}ms (${(crawlingDuration / 1000).toFixed(2)}초)`);
    }

    if (!data.message) return;

    const doc = domParser.parseFromString(data.message, 'text/html');

    const postList = Array.from(doc.querySelectorAll('#content > div > div > div:nth-child(2) > div > div'));
    if (postList.length > 0) {
      this.#notice(postList.length + '개 아이템 구함');
    } else {
      this.#notice('데이터를 구하지 못함', true, true);
      this.retryBtn.disabled = false; // 수동으로 다시 요청하도록 버튼 노출
      return;
    }

    const itemList = postList.map((div) => {
      const elementOfImg = div.querySelector('img.cover') as HTMLImageElement;
      const elementOfOpus = div.querySelector('.card-content h3.title a') as HTMLAnchorElement;
      const elementOfPost = div.querySelector('.card-content p.subtitle a') as HTMLAnchorElement;
      const nodeListOfTags = div.querySelectorAll('.tags a');
      const existsTag = div.querySelector('.tag') !== null;
      const elementOfSubtitle = div.querySelector(`.card-content > p:nth-child(${existsTag ? 4 : 3})`) as HTMLAnchorElement;
      const elementOfRelease = div.querySelector(`.card-content > p:nth-child(${existsTag ? 5 : 4})`) as HTMLParagraphElement;
      const nodeListOfActress = div.querySelectorAll('.card-content > div.mb-2.buttons.are-small > a');
      const nodeListOfDownload = div.querySelectorAll('.card-content > div.is-uppercase.has-text-weight-bold.buttons > a');

      return {
        opus: { text: this.#getText(elementOfOpus) ?? '', href: this.#getHref(elementOfOpus) ?? '' },
        cover: elementOfImg?.src ?? '',
        release: DateUtils.format(this.#getText(elementOfRelease)?.replace('Release date:', '') ?? '', 'yyyy.MM.dd'),
        posted: { text: DateUtils.format(this.#getText(elementOfPost) ?? '', 'yyyy-MM-dd'), href: this.#getHref(elementOfPost) ?? '' },
        title: this.#getText(elementOfSubtitle) ?? '',
        actressList: Array.from(nodeListOfActress).map((element) => {
          const a = element as HTMLAnchorElement;
          return { text: this.#getText(a) ?? '', href: this.#getHref(a) ?? '' };
        }),
        downloadList: Array.from(nodeListOfDownload).map((element) => {
          const a = element as HTMLAnchorElement;
          return {
            text: this.#getText(a) ?? '',
            href: this.#getHref(a) ?? '',
            type: Array.from(a.querySelectorAll('.tooltip'))
              ?.map((tip) => (tip as HTMLElement).dataset.tooltip)
              .join(','),
          };
        }),
        tagList: Array.from(nodeListOfTags).map((a: Element) => ({ text: this.#getText(a as HTMLElement) ?? '', href: this.#getHref(a as HTMLElement) ?? '' })),
      };
    });

    this.#itemList.push(...itemList);
    this.#paging.itemLength += postList.length;

    await this.#renderItemList(itemList);

    this.#notice('', true); // Hide notice
    this.#updateFootMessage();

    if (this.#paging.itemIndex === 0) {
      this.#showItem();
    }
  }

  #callCrawling() {
    this.#crawlingStartTime = performance.now();

    const url = LIST_URL + this.#paging.srcPageNo;
    /*
      /crawling/curl은 async로 동작함.
      크롤링 결과는 SSE를 통해 받아서 emitCurl로 전달됨.
     */
    void ApiClient.get(`/crawling/curl?url=${encodeURIComponent(url)}`).catch((err) => {
      console.error(err);
      this.#notice('데이터를 구하지 못함', true, true);
      this.retryBtn.disabled = false; // 수동으로 다시 요청하도록 버튼 노출
    });
    this.#notice(this.#paging.srcPageNo + '페이지 크롤링 중...');
    (document.querySelector('#srcPageURL') as HTMLAnchorElement).href = url;
  }

  #notice(message: string, hide = false, isError = false) {
    const noticeEl = document.querySelector('#notice')!;
    noticeEl.querySelector('#noticeMessage')!.innerHTML = message;
    noticeEl.classList.toggle('hide', hide);
    noticeEl.classList.toggle('error', isError);
  }

  #updateFootMessage() {
    document.querySelector('#currentPageNo')!.innerHTML = String(Math.ceil((this.#paging.itemIndex + 1) / 15) + this.#startPageNo - 1);
    document.querySelector('#loadedPageNo')!.innerHTML = String(this.#paging.srcPageNo);
    document.querySelector('#currentItemNo')!.innerHTML = String(this.#paging.itemIndex + 1);
    document.querySelector('#totalItemNo')!.innerHTML = String(this.#paging.itemLength);
  }
}

const page = new Page();

window.emitCurl = (data) => page.parseOfNanojav(data);
