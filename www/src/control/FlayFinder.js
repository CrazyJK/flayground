import componentCssLoader from '../style/componentCssLoader';

const CSS = `
.wrapper {
  padding-bottom: 1rem;
}
.wrapper.search-wrapper {
  padding: 0.5rem;
  text-align: center;
}
.wrapper > ol {
  padding: 0.25rem 0.5rem;
}
.item {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: space-between;
  gap: 0.5rem;
}
.item:hover {
  text-shadow: var(--text-shadow-hover);
}
.item label {
  font-size: var(--size-normal);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  padding: 0.125rem 0.25rem;
}
.studio {
  flex: 0 0 4rem;
}
.opus {
  flex: 0 0 6rem;
}
.title {
  flex: 1 1 auto;
}
.actress {
  flex: 0 0 8rem;
}
.release {
  flex: 0 0 6rem;
}
.action {
  flex: 0 0 5rem;
}
.date {
  flex: 0 0 11rem;
}
.desc {
  flex: 1 1 auto;
}
.tags {
  flex: 1 1 auto;
}
`;

const HTML = `
<div class="wrapper search-wrapper">
  <input type="search" id="search" name="search" placeholder="Search..." spellcheck="false">
</div>
<div class="wrapper instance-wrapper">
  <h1>Instance</h1>
  <ol></ol>
</div>
<div class="wrapper archive-wrapper">
  <h1>Archive</h1>
  <ol></ol>
</div>
<div class="wrapper info-wrapper">
  <h1>Info</h1>
  <ol></ol>
</div>
<div class="wrapper history-wrapper">
  <h1>History</h1>
  <ol></ol>
</div>
`;

export default class FlayFinder extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다

    componentCssLoader(this.shadowRoot);

    const style = document.createElement('style');
    style.innerHTML = CSS;

    const wrapper = document.createElement('div');
    wrapper.classList.add('flay-finder');
    wrapper.innerHTML = HTML;

    this.shadowRoot.append(style, wrapper); // 생성된 요소들을 shadow DOM에 부착합니다
  }

  connectedCallback() {
    const Wrapper = this.shadowRoot.querySelector('.flay-finder');
    const SearchInput = this.shadowRoot.querySelector('#search');
    const Instance = this.shadowRoot.querySelector('.instance-wrapper > ol');
    const Archive = this.shadowRoot.querySelector('.archive-wrapper > ol');
    const History = this.shadowRoot.querySelector('.history-wrapper > ol');
    const Info = this.shadowRoot.querySelector('.info-wrapper > ol');

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
        fetchAndRender('/info/history/find/', keyword, History, renderHistory);
        fetchAndRender('/info/video/find/', keyword, Info, renderInfo);
      }
    });

    Wrapper.addEventListener('click', (e) => {
      let action = e.target.dataset.action;
      let opus = e.target.dataset.opus;
      console.debug('click', e.target, action, opus);
      if (action === 'flay') {
        window.open('card.flay.html?opus=' + opus, opus, 'width=800px,height=536px');
      } else if (action === 'info') {
        window.open('/info/video/' + opus, 'info' + opus, 'width=400px,height=600px');
      }
    });
  }
}

function fetchAndRender(url, keyword, wrapper, callback) {
  fetch(url + keyword)
    .then((res) => res.json())
    .then((list) => {
      callback(
        Array.from(list).sort((t1, t2) => t2.opus.localeCompare(t1.opus)),
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
