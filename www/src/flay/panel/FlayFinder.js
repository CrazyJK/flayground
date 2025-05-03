import DateUtils from '../../lib/DateUtils';
import { popupActress, popupActressInfo, popupFlay, popupVideoInfo } from '../../lib/FlaySearch';
import './FlayFinder.scss';

const HTML = `
<div class="search-wrapper">
  <input type="search" id="search" placeholder="Search..." spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="none" />
</div>
<div class="result-wrapper">
  <h2>Instance</h2>
  <ol class="instance-list"></ol>
  <h2>Archive</h2>
  <ol class="archive-list"></ol>
  <h2>Actress</h2>
  <ol class="actress-list"></ol>
  <h2>Info</h2>
  <ol class="info-list"></ol>
  <h2>History</h2>
  <ol class="history-list"></ol>
</div>
`;

export default class FlayFinder extends HTMLDivElement {
  constructor() {
    super();

    this.classList.add('flay-finder', 'flay-div');
    this.innerHTML = HTML;
  }

  connectedCallback() {
    const SearchInput = this.querySelector('#search');
    const Instance = this.querySelector('.instance-list');
    const Archive = this.querySelector('.archive-list');
    const Actress = this.querySelector('.actress-list');
    const Info = this.querySelector('.info-list');
    const History = this.querySelector('.history-list');

    let keyword = '';

    SearchInput.addEventListener('change', (e) => {
      keyword = e.target.value.trim();
      console.log('keyword', keyword);
      if (keyword === '') {
        console.log('clean');
        Instance.textContent = null;
        Archive.textContent = null;
        Actress.textContent = null;
        Info.textContent = null;
        History.textContent = null;
      } else {
        console.log('search');
        fetchAndRender('/flay/find/', keyword, Instance, renderInstance);
        fetchAndRender('/archive/find/', keyword, Archive, renderArchive);
        fetchAndRender('/info/actress/find/', keyword, Actress, renderActress);
        fetchAndRender('/info/video/find/', keyword, Info, renderInfo);
        fetchAndRender('/info/history/find/', keyword, History, renderHistory);
      }
    });

    this.addEventListener('click', (e) => {
      let action = e.target.dataset.action;
      let opus = e.target.dataset.opus;
      console.debug('click', e.target, action, opus);
      if (action === 'flay') {
        popupFlay(opus);
      } else if (action === 'info') {
        popupVideoInfo(opus);
      } else if (action === 'actressName') {
        let actressName = e.target.closest('li').dataset.actressName;
        popupActress(actressName);
      } else if (action === 'actressLocalName') {
        let actressName = e.target.closest('li').dataset.actressName;
        popupActressInfo(actressName);
      }
    });
  }
}

function fetchAndRender(url, keyword, wrapper, callback) {
  fetch(url + keyword)
    .then((res) => res.json())
    .then((list) => {
      callback(
        Array.from(list).sort((t1, t2) => t2.release?.localeCompare(t1.release)),
        keyword,
        wrapper
      );
    });
}

function renderInstance(list, keyword, wrapper) {
  console.log('renderInstance', list);
  if (list.length === 0) {
    wrapper.innerHTML = `<label class="notfound">Not found ${keyword}</label>`;
  } else {
    wrapper.textContent = null;
    Array.from(list).forEach((flay) => {
      const ITEM = document.createElement('li');
      ITEM.classList.add('flay-item', 'item');
      ITEM.innerHTML = `
        <label class="studio" >${flay.studio}</label>
        <label class="opus" data-action="flay">${flay.opus}</label>
        <label class="title"  >${flay.title}</label>
        <label class="actress">${flay.actressList.join(', ')}</label>
        <label class="release">${flay.release}</label>
      `;
      wrapper.append(ITEM);
      for (const child of ITEM.children) {
        child.title = child.innerHTML;
        child.dataset.opus = flay.opus;
      }
    });
  }
}

function renderArchive(list, keyword, wrapper) {
  console.log('renderArchive', list);
  if (list.length === 0) {
    wrapper.innerHTML = `<label class="notfound">Not found ${keyword}</label>`;
  } else {
    wrapper.textContent = null;
    Array.from(list).forEach((flay) => {
      const ITEM = document.createElement('li');
      ITEM.classList.add('flay-item', 'item');
      ITEM.innerHTML = `
        <label class="studio" >${flay.studio}</label>
        <label class="opus" data-action="flay">${flay.opus}</label>
        <label class="title"  >${flay.title}</label>
        <label class="actress">${flay.actressList.join(', ')}</label>
        <label class="release">${flay.release}</label>
      `;
      wrapper.append(ITEM);
      for (const child of ITEM.children) {
        child.title = child.innerHTML;
        child.dataset.opus = flay.opus;
      }
    });
  }
}

function renderHistory(list, keyword, wrapper) {
  console.log('renderHistory', list);
  if (list.length === 0) {
    wrapper.innerHTML = `<label class="notfound">Not found ${keyword}</label>`;
  } else {
    wrapper.textContent = null;
    Array.from(list).forEach((history) => {
      const ITEM = document.createElement('li');
      ITEM.classList.add('history-item', 'item');
      ITEM.innerHTML = `
        <label class="opus"  data-action="flay">${history.opus}</label>
        <label class="date"  >${history.date}</label>
        <label class="action">${history.action}</label>
        <label class="desc"  >${history.desc}</label>
      `;
      wrapper.append(ITEM);
      for (const child of ITEM.children) {
        child.title = child.innerHTML;
        child.dataset.opus = history.opus;
      }
    });
  }
}

function renderInfo(list, keyword, wrapper) {
  console.log('renderInfo', list);
  if (list.length === 0) {
    wrapper.innerHTML = `<label class="notfound">Not found ${keyword}</label>`;
  } else {
    wrapper.textContent = null;
    Array.from(list).forEach((info) => {
      const ITEM = document.createElement('li');
      ITEM.classList.add('info-item', 'item');
      ITEM.innerHTML = `
        <label class="opus" data-action="flay">${info.opus}</label>
        <label class="rank" data-action="info">Rank: ${info.rank} <small>${DateUtils.format(info.lastModified, 'yy/MM/dd')}</small></label>
        <label class="play" data-action="info">Play: ${info.play} <small>${DateUtils.format(info.lastPlay, 'yy/MM/dd')}</small></label>
        <label class="like" data-action="info">Shot: ${info.likes?.length > 0 ? info.likes.length : ''} <small>${info.likes?.length > 0 ? DateUtils.format(info.likes[info.likes.length - 1], 'yy/MM/dd') : ''}</small></label>
        <label class="tags">${info.tags?.map((tag) => tag.name).join(', ')}</label>
      `;
      wrapper.append(ITEM);
      for (const child of ITEM.children) {
        child.title = child.innerHTML;
        child.dataset.opus = info.opus;
      }
    });
  }
}

function renderActress(list, keyword, wrapper) {
  console.log('renderActress', list);
  if (list.length === 0) {
    wrapper.innerHTML = `<label class="notfound">Not found ${keyword}</label>`;
  } else {
    wrapper.textContent = null;
    Array.from(list).forEach((actress) => {
      const ITEM = document.createElement('li');
      ITEM.classList.add('actress-item', 'item');
      ITEM.innerHTML = `
        <label class="favorite">${actress.favorite ? '💛' : '🩶'}</label>
        <label class="name" data-action="actressName">${actress.name}</label>
        <label class="localName" data-action="actressLocalName">${actress.localName}</label>
        <label class="birth">${actress.birth}</label>
        <label class="body">${actress.body}</label>
        <label class="height">${actress.height}</label>
        <label class="debut">${actress.debut}</label>
        <label class="comment" title=${actress.comment}>${actress.comment}</label>
      `;
      wrapper.append(ITEM);
      ITEM.dataset.actressName = actress.name;
    });
  }
}

// Define the new element
customElements.define('flay-finder', FlayFinder, { extends: 'div' });
