import './inc/Page';
import './page.crawling.scss';

import NanoStore from '../flay/idb/nano/store/NanoStore';
import DateUtils from '../lib/DateUtils';
import FlayFetch from '../lib/FlayFetch';
import { popupActress, popupFlay } from '../lib/FlaySearch';
import StringUtils from '../lib/StringUtils';

const DOMAIN = 'https://www.nanojav.com';
const LIST_URL = DOMAIN + '/jav/?order=new&page=';
const domParser = new DOMParser();
const nanoStore = new NanoStore();

class Page {
  #itemList = [];
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

  constructor() {
    document.querySelector('#startBtn').addEventListener('click', () => {
      this.#paging.srcPageNo = parseInt(document.querySelector('#srcPageNo').value);
      this.#callCrawling();
      document.querySelector('#starter').classList.add('hide');
    });

    this.article = document.querySelector('body > main > article');
    // Use passive event listeners for performance
    this.article.addEventListener('wheel', this.#handleWheel.bind(this), { passive: true });
    window.addEventListener('keyup', this.#handleKeyUp.bind(this));

    this.retryBtn = document.querySelector('body > main > footer > #retryBtn');
    this.retryBtn.addEventListener('click', () => this.#callCrawling());

    this.itemRepository = document.querySelector('#itemRepository');

    // Delegate event listeners for better performance
    this.article.addEventListener('click', this.#handleRepositoryClick.bind(this));
  }

  // Throttled wheel event handler
  #handleWheel(e) {
    if (e.deltaY > 0) {
      this.#next();
    } else {
      this.#prev();
    }
  }

  // Handle keyboard events
  #handleKeyUp(e) {
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
  #handleRepositoryClick(e) {
    const target = e.target;

    // Handle different click targets
    if (target.closest('.opus label, .title label')) {
      this.#copyToClipboard(target);
    } else if (target.closest('.download-list label')) {
      const label = target.closest('.download-list label');
      this.#download(label, DOMAIN + label.dataset.href);
    } else if (target.closest('.actress-list label span')) {
      popupActress(target.textContent);
    } else if (target.closest('.video label')) {
      const div = target.closest('div[data-opus]');
      if (div) {
        popupFlay(div.dataset.opus);
      }
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
  async #prefetchData(itemList) {
    const opusList = itemList.map((data) => data.opus.text);
    const japNameList = itemList.flatMap((data) =>
      data.actressList.map((actress) => {
        let jap = '';
        const name = actress.text;
        if (name.includes('(')) {
          const parts = name
            .substring(0, name.length - 1)
            .split('(')
            .map((s) => s.trim());
          jap = parts[1] || '';
        } else {
          jap = name;
        }
        return jap;
      })
    );

    // Batch fetch videos
    const videoPromises = opusList.map(async (opus) => {
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
    const actressPromises = japNameList.map(async (jap) => {
      if (jap && !this.#actressCache.has(jap)) {
        try {
          const actressList = await FlayFetch.getActressListByLocalname(jap);
          this.#actressCache.set(jap, actressList || []);
        } catch (err) {
          this.#actressCache.set(jap, []);
        }
      }
    });

    // Batch fetch records
    const recordPromises = opusList.map(async (opus) => {
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

  async #renderItemList(itemList) {
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
        let [eng, jap] = ['', ''];

        const name = actress.text;
        if (name.includes('(')) {
          [eng, jap] = name
            .substring(0, name.length - 1)
            .split('(')
            .map((s) => s.trim());
          eng = eng.split(' ').reverse().join(' ');
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
      div.dataset.itemIndex = this.#paging.itemIndex + count++;
      div.classList.toggle('has-video', !video.error);

      // Use template literals for HTML generation
      div.innerHTML = this.#generateItemHTML(data, video);

      // Use cached record data
      const record = this.#recordCache.get(data.opus.text);
      if (record) {
        const viewDate = DateUtils.format(record.date, 'yyyy-MM-dd HH:mm');
        div.querySelector('.posted').appendChild(document.createElement('label')).innerHTML = `${viewDate}<sub>view</sub>`;

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
  #generateItemHTML(data, video) {
    return `
      <div class="cover">
        <img src="${data.cover}">
      </div>
      <div class="opus" title="opus">
        <label data-href="${data.opus.href}">${data.opus.text}</label>
      </div>
      <div class="video" title="video info">
        ${video.error ? '' : `<label>${video.rank}<sub>rank</sub></label><label>${video.play}<sub>play</sub></label><label>${DateUtils.format(video.lastModified, 'yyyy-MM-dd')}<sub>modified</sub></label>`}
      </div>
      <div class="release" title="release">
        <label>${data.release}</label>
      </div>
      <div class="title" title="title">
        <label>${data.title}</label>
      </div>
      <div class="tags" title="tags">
        ${data.tagList.map((tag) => `<label data-href="${tag.href}">${tag.text}</label>`).join('')}
      </div>
      <div class="actress-list" title="actress">
        ${data.actressList.map((actress) => `<label data-href="${actress.href}" title="${actress.text}">${actress.fav}<span title="english name">${actress.eng}</span> <span title="japannes name">${actress.jap}</span></label>`).join('')}
      </div>
      <div class="download-list" title="download. click to copy">
        ${data.downloadList.map((download) => `<label data-href="${download.href}">${download.type} ${download.text}</label>`).join('')}
      </div>
      <div class="posted" title="posted">
        <label data-href="${data.posted.href}">${data.posted.text}<sub>posted</sub></label>
      </div>
    `;
  }

  #copyToClipboard(target, text) {
    window.navigator.clipboard.writeText(StringUtils.isBlank(text) ? this.#getText(target) : text).then(() => {
      target.animate([{ transform: 'scale(1.25)' }, { transform: 'none' }], { duration: 500, iterations: 1 });
    });
  }

  #download(target, text) {
    const url = StringUtils.isBlank(text) ? this.#getText(target) : text;
    const formData = new FormData();
    formData.append('url', url);
    fetch('/download', {
      method: 'POST',
      body: formData,
    })
      .then(async (res) => {
        // 헤더에서 파일명을 가져옴
        const filename = res.headers.get('Content-Disposition').split('filename=')[1].replace(/"/g, '');
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

  #getText(element) {
    return element?.textContent.trim();
  }

  #getHref(element) {
    return element?.getAttribute('href');
  }

  async parseOfNanojav(data) {
    const doc = domParser.parseFromString(data.message, 'text/html');

    const postList = Array.from(doc.querySelectorAll('#content > div > div > div:nth-child(2) > div > div'));
    if (postList.length > 0) {
      this.#notice(postList.length + '개 아이템 구함');
    } else {
      this.#notice('데이터를 구하지 못함', true, true);
      this.retryBtn.disabled = false; // 수동으로 다시 요청하도록 버튼 노출
      return;
    }

    const itemList = postList.map((div, i) => {
      const elementOfImg = div.querySelector('img.cover');
      const elementOfOpus = div.querySelector('.card-content h3.title a');
      const elementOfPost = div.querySelector('.card-content p.subtitle a');
      const nodeListOfTags = div.querySelectorAll('.tags a');
      const existsTag = div.querySelector('.tag') !== null;
      const elementOfSubtitle = div.querySelector(`.card-content > p:nth-child(${existsTag ? 4 : 3})`);
      const elementOfRelease = div.querySelector(`.card-content > p:nth-child(${existsTag ? 5 : 4})`);
      const nodeListOfActress = div.querySelectorAll('.card-content > div.mb-2.buttons.are-small > a');
      const nodeListOfDownload = div.querySelectorAll('.card-content > div.is-uppercase.has-text-weight-bold.buttons > a');

      return {
        opus: { text: this.#getText(elementOfOpus), href: this.#getHref(elementOfOpus) },
        cover: elementOfImg.src,
        release: DateUtils.format(this.#getText(elementOfRelease).replace('Release date:', ''), 'yyyy.MM.dd'),
        posted: { text: DateUtils.format(this.#getText(elementOfPost), 'yyyy-MM-dd'), href: this.#getHref(elementOfPost) },
        title: this.#getText(elementOfSubtitle),
        actressList: Array.from(nodeListOfActress).map((a) => ({ text: this.#getText(a), href: this.#getHref(a) })),
        downloadList: Array.from(nodeListOfDownload).map((a) => ({
          text: this.#getText(a),
          href: this.#getHref(a),
          type: Array.from(a.querySelectorAll('.tooltip'))
            ?.map((tip) => tip.dataset.tooltip)
            .join(','),
        })),
        tagList: Array.from(nodeListOfTags).map((a) => ({ text: this.#getText(a), href: this.#getHref(a) })),
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
    const url = LIST_URL + this.#paging.srcPageNo;
    fetch(`/crawling/curl?url=${encodeURIComponent(url)}`);
    this.#notice(this.#paging.srcPageNo + '페이지 크롤링 중...');
    document.querySelector('#srcPageURL').href = url;
  }

  #notice(message, hide = false, isError = false) {
    const noticeEl = document.querySelector('#notice');
    noticeEl.querySelector('#noticeMessage').innerHTML = message;
    noticeEl.classList.toggle('hide', hide);
    noticeEl.classList.toggle('error', isError);
  }

  #updateFootMessage() {
    document.querySelector('#currentPageNo').innerHTML = Math.ceil((this.#paging.itemIndex + 1) / 15);
    document.querySelector('#loadedPageNo').innerHTML = this.#paging.srcPageNo;
    document.querySelector('#currentItemNo').innerHTML = this.#paging.itemIndex + 1;
    document.querySelector('#totalItemNo').innerHTML = this.#paging.itemLength;
  }
}

const page = new Page();

window.emitCurl = (data) => page.parseOfNanojav(data);
