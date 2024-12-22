import './inc/Page';
import './page.crawling.scss';

import NanoStore from '../flay/idb/nano/store/NanoStore';
import DateUtils from '../lib/DateUtils';
import FlayFetch from '../lib/FlayFetch';
import { popupActress } from '../lib/FlaySearch';
import StringUtils from '../lib/StringUtils';

const DOMAIN = 'https://www.nanojav.com';
const LIST_URL = DOMAIN + '/jav/?order=new&page=';
const domParser = new DOMParser();
const nanoStore = new NanoStore();

class Page {
  #itemList = [];
  #paging = {
    isActive: true,
    srcPageNo: 0,
    itemIndex: -1,
    itemLength: 0,
    needCrawling: () => {
      return this.#paging.itemIndex >= this.#paging.itemLength;
    },
  };

  constructor() {
    this.srcPageURL = document.querySelector('#srcPageURL');
    this.srcPageNo = document.querySelector('#srcPageNo');
    this.startBtn = document.querySelector('#startBtn');
    this.startBtn.addEventListener('click', async () => {
      this.#paging.srcPageNo = this.srcPageNo.value - 1;
      this.starter.classList.add('hide');
      await this.#next();
    });

    this.article = document.querySelector('body > main > article');
    this.article.addEventListener('wheel', async (e) => {
      if (!this.#paging.isActive) return;

      if (e.deltaY > 0) await this.#next();
      else await this.#prev();
    });
    window.addEventListener('keyup', async (e) => {
      switch (e.code) {
        case 'ArrowRight':
          return await this.#next();
        case 'ArrowLeft':
          return await this.#prev();
      }
    });

    this.retryBtn = document.querySelector('body > main > footer > #retryBtn');
    this.retryBtn.addEventListener('click', () => this.#callCrawling());

    this.itemRepository = document.querySelector('#itemRepository');
    this.starter = document.querySelector('#starter');
    this.notice = document.querySelector('#notice');
  }

  async #next() {
    ++this.#paging.itemIndex;

    if (this.#paging.needCrawling()) {
      ++this.#paging.srcPageNo;
      await this.#callCrawling();
    } else {
      await this.#showItem();
    }
  }

  async #prev() {
    --this.#paging.itemIndex;

    if (this.#paging.itemIndex < 0) {
      this.#paging.itemIndex = 0;
      return;
    }
    await this.#showItem();
  }

  #message(message, isError = false) {
    document.querySelector('body > main > footer > #message').innerHTML = message;
    document.querySelector('body > main > footer > #message').classList.toggle('error', isError);
  }

  #toggleActive(force) {
    this.#paging.isActive = force;
  }

  async #showItem() {
    const data = this.#itemList[this.#paging.itemIndex];

    // 이전 item을 itemRepository에 넣어 놓기
    const prevDiv = this.article.querySelector('div');
    if (prevDiv) this.itemRepository.insertBefore(prevDiv, null);

    // itemRepository에 있는 item 꺼내서 끼워 넣기
    this.article.insertBefore(this.itemRepository.querySelector(`div[data-opus="${data.opus.text}"]`), null);

    await nanoStore.update(data.opus.text, Date.now());

    this.#message(`${this.#paging.srcPageNo} page, ${this.#paging.itemIndex + 1} / ${this.#paging.itemLength} post`);
  }

  async #renderItemList(itemList) {
    for (const data of itemList) {
      const video = await FlayFetch.getVideo(data.opus.text);

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
        const actressList = await FlayFetch.getActressListByLocalname(jap);
        actress['eng'] = eng || actressList[0]?.name || ' ';
        actress['jap'] = jap;
        actress['fav'] = actressList[0]?.favorite ? '💛' : '';
      }

      const div = this.itemRepository.appendChild(document.createElement('div'));
      div.dataset.opus = data.opus.text;
      div.dataset.itemIndex = this.#paging.itemIndex;
      div.classList.toggle('already-view', !video.error);
      div.innerHTML = `
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

      div.querySelector('.opus label').addEventListener('click', (e) => this.#copyToClipboard(e.target));
      div.querySelector('.title label').addEventListener('click', (e) => this.#copyToClipboard(e.target));
      div.querySelectorAll('.download-list label').forEach((label) => label.addEventListener('click', (e) => this.#copyToClipboard(e.target, DOMAIN + e.target.dataset.href)));
      div.querySelectorAll('.actress-list label span').forEach((span) => span.addEventListener('click', (e) => popupActress(e.target.textContent)));

      const record = await nanoStore.select(data.opus.text);
      if (record) {
        div.classList.add('already-view');
        div.querySelector('.posted').appendChild(document.createElement('label')).innerHTML = `${DateUtils.format(record.date, 'yyyy-MM-dd HH:mm')}<sub>view</sub>`;
      }
    }
  }

  #copyToClipboard(target, text) {
    window.navigator.clipboard.writeText(StringUtils.isBlank(text) ? this.#getText(target) : text).then(() => {
      target.animate([{ transform: 'scale(1.25)' }, { transform: 'none' }], { duration: 500, iterations: 1 });
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
    console.debug(doc);

    const postList = Array.from(doc.querySelectorAll('#content > div > div > div:nth-child(2) > div > div'));
    if (postList.length > 0) {
      this.#message(postList.length + '개 아이템 구함');
      this.#toggleActive(true);
    } else {
      this.#message('데이터를 구하지 못함', true);
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

    console.debug(this.#paging, this.#itemList);

    await this.#renderItemList(itemList);
    await this.#showItem();

    this.notice.classList.add('hide');
  }

  async #callCrawling() {
    this.#toggleActive(false);

    const url = LIST_URL + this.#paging.srcPageNo;
    this.srcPageURL.href = url;
    this.srcPageURL.innerHTML = url;

    this.notice.querySelector('#noticeMessage').innerHTML = this.#paging.srcPageNo + '페이지 크롤링 중...';
    this.notice.classList.remove('hide');

    await fetch(`/crawling/curl?url=${encodeURIComponent(url)}`).then((res) => res.text());
  }

  async start() {}
}

const page = new Page();
page.start();

window.emitCurl = async (data) => await page.parseOfNanojav(data);
