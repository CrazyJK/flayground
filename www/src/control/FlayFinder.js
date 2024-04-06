import './FlayFinder.scss';

const HTML = `
<div class="search-wrapper">
  <input type="search" id="search" placeholder="Search..." spellcheck="false">
</div>
<div class="result-wrapper">
  <h1>Instance</h1>
  <ol class="instance-list"></ol>
  <h1>Archive</h1>
  <ol class="archive-list"></ol>
  <h1>Actress</h1>
  <ol class="actress-list"></ol>
  <h1>Info</h1>
  <ol class="info-list"></ol>
  <h1>History</h1>
  <ol class="history-list"></ol>
</div>
`;

export default class FlayFinder extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다

    const link = this.shadowRoot.appendChild(document.createElement('link'));
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = 'style.css';

    const wrapper = this.shadowRoot.appendChild(document.createElement('div'));
    wrapper.classList.add(this.tagName.toLowerCase());
    wrapper.innerHTML = HTML;

    const SearchInput = this.shadowRoot.querySelector('#search');
    const Instance = this.shadowRoot.querySelector('.instance-list');
    const Archive = this.shadowRoot.querySelector('.archive-list');
    const Actress = this.shadowRoot.querySelector('.actress-list');
    const Info = this.shadowRoot.querySelector('.info-list');
    const History = this.shadowRoot.querySelector('.history-list');

    let keyword = '';

    SearchInput.addEventListener('change', (e) => {
      keyword = e.target.value.trim();
      console.log('keyword', keyword);
      if (keyword === '') {
        console.log('clean');
        Instance.textContent = null;
        Archive.textContent = null;
        History.textContent = null;
        Info.textContent = null;
      } else {
        console.log('search');
        fetchAndRender('/flay/find/', keyword, Instance, renderInstance);
        fetchAndRender('/archive/find/', keyword, Archive, renderArchive);
        fetchAndRender('/info/actress/find/', keyword, Actress, renderActress);
        fetchAndRender('/info/video/find/', keyword, Info, renderInfo);
        fetchAndRender('/info/history/find/', keyword, History, renderHistory);
      }
    });

    wrapper.addEventListener('click', (e) => {
      let action = e.target.dataset.action;
      let opus = e.target.dataset.opus;
      console.debug('click', e.target, action, opus);
      if (action === 'flay') {
        window.open('popup.flay.html?opus=' + opus, opus, 'width=800px,height=1280px');
      } else if (action === 'info') {
        window.open('/info/video/' + opus, 'info' + opus, 'width=400px,height=600px');
      } else if (action === 'actressName') {
        let actressName = e.target.closest('li').dataset.actressName;
        window.open('popup.actress.html?name=' + actressName, actressName, 'width=960px,height=1200px');
      } else if (action === 'actressLocalName') {
        let actressName = e.target.closest('li').dataset.actressName;
        window.open('/info/actress/' + actressName, actressName + '_info', 'width=640px,height=800px');
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
    wrapper.innerHTML = `<label class="error">Not found ${keyword}</label>`;
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
    wrapper.innerHTML = `<label class="error">Not found ${keyword}</label>`;
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
    wrapper.innerHTML = `<label class="error">Not found ${keyword}</label>`;
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
    wrapper.innerHTML = `<label class="error">Not found ${keyword}</label>`;
  } else {
    wrapper.textContent = null;
    Array.from(list).forEach((info) => {
      const ITEM = document.createElement('li');
      ITEM.classList.add('info-item', 'item');
      ITEM.innerHTML = `
        <label class="opus" data-action="flay">${info.opus}</label>
        <label class="rank" data-action="info">Rank: ${info.rank} <small>${dateFormat(info.lastModified)}</small></label>
        <label class="play" data-action="info">Play: ${info.play} <small>${dateFormat(info.lastPlay)}</small></label>
        <label class="like" data-action="info">Shot: ${info.likes?.length > 0 ? info.likes.length : ''} <small>${info.likes?.length > 0 ? dateFormat(info.likes[info.likes.length - 1]) : ''}</small></label>
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
    wrapper.innerHTML = `<label class="error">Not found ${keyword}</label>`;
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

function dateFormat(time) {
  if (time <= 0) {
    return '00/00/00';
  }
  const date = new Date(time);
  let year = date.getFullYear() - 2000;
  let month = date.getMonth() + 1;
  let day = date.getDate();
  return `${year}/${month > 9 ? month : '0' + month}/${day > 9 ? day : '0' + day}`;
}

// Define the new element
customElements.define('flay-finder', FlayFinder);
