export default class FlayFinder extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다
    const LINK = document.createElement('link');
    LINK.setAttribute('rel', 'stylesheet');
    LINK.setAttribute('href', './css/4.components.css');
    const STYLE = document.createElement('style');
    STYLE.innerHTML = CSS;
    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('flay-finder');
    this.wrapper.innerHTML = HTML;
    this.shadowRoot.append(LINK, STYLE, this.wrapper); // 생성된 요소들을 shadow DOM에 부착합니다

    const SearchInput = this.shadowRoot.querySelector('#search');
    const Instance = this.shadowRoot.querySelector('.instance-wrapper > div');
    const Archive = this.shadowRoot.querySelector('.archive-wrapper > div');
    const History = this.shadowRoot.querySelector('.history-wrapper > div');

    let keyword = '';

    SearchInput.addEventListener('change', (e) => {
      keyword = e.target.value;
      console.log('keyword', keyword);
      if (keyword === '') {
        console.log('clean');
        Instance.textContent = null;
        Archive.textContent = null;
        History.textContent = null;
      } else {
        console.log('search');
        fetchAndRender('/flay/find/', keyword, Instance, renderInstance);
        fetchAndRender('/archive/find/', keyword, Archive, renderArchive);
        fetchAndRender('/info/history/find/', keyword, History, renderHistory);
      }
    });
  }
}

function fetchAndRender(url, keyword, wrapper, callback) {
  fetch(url + keyword)
    .then((res) => res.json())
    .then((list) => {
      callback(list, keyword, wrapper);
    });
}

function renderInstance(list, keyword, wrapper) {
  console.log('renderInstance', list);
  if (list.length === 0) {
    wrapper.innerHTML = `<label class="error">Not found ${keyword}</label>`;
  } else {
    wrapper.textContent = null;
    Array.from(list).forEach((flay) => {
      const DIV = document.createElement('div');
      DIV.classList.add('flay-item', 'item');
      DIV.innerHTML = `
        <label class="studio" >${flay.studio}</label>
        <label class="opus"   >${flay.opus}</label>
        <label class="title"  >${flay.title}</label>
        <label class="actress">${flay.actressList.join(', ')}</label>
        <label class="release">${flay.release}</label>
      `;
      DIV.addEventListener('click', (e) => {
        if (e.target.classList.contains('opus')) {
          console.log('opus clicked', flay.opus);
          window.open('card.flay.html?opus=' + flay.opus, flay.opus, 'width=800px,height=536px');
        }
      });
      wrapper.append(DIV);
      for (const child of DIV.children) {
        child.title = child.innerHTML;
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
      const DIV = document.createElement('div');
      DIV.classList.add('flay-item', 'item');
      DIV.innerHTML = `
        <label class="studio" >${flay.studio}</label>
        <label class="opus"   >${flay.opus}</label>
        <label class="title"  >${flay.title}</label>
        <label class="actress">${flay.actressList.join(', ')}</label>
        <label class="release">${flay.release}</label>
      `;
      DIV.addEventListener('click', (e) => {
        if (e.target.classList.contains('opus')) {
          console.log('opus clicked', flay.opus);
          window.open('card.flay.html?opus=' + flay.opus, flay.opus, 'width=800px,height=536px');
        }
      });
      wrapper.append(DIV);
      for (const child of DIV.children) {
        child.title = child.innerHTML;
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
      const DIV = document.createElement('div');
      DIV.classList.add('history-item', 'item');
      DIV.innerHTML = `
      <label class="opus"  >${history.opus}</label>
      <label class="date"  >${history.date}</label>
      <label class="action">${history.action}</label>
      <label class="desc"  >${history.desc}</label>
      `;
      DIV.addEventListener('click', (e) => {
        if (e.target.classList.contains('opus')) {
          console.log('opus clicked', history.opus);
          window.open('card.flay.html?opus=' + history.opus, history.opus, 'width=800px,height=536px');
        } else if (e.target.classList.contains('desc')) {
          window.open('/info/video/' + history.opus, 'info' + history.opus, 'width=400px,height=600px');
        }
      });
      wrapper.append(DIV);
      for (const child of DIV.children) {
        child.title = child.innerHTML;
      }
    });
  }
}

// Define the new element
customElements.define('flay-finder', FlayFinder);

const CSS = `
.wrapper {
  margin-bottom: 1rem;
}
.wrapper > div {
  padding: 0.25rem 0.5rem;
}
.search-wrapper {
  padding: 0.5rem;
  text-align: center;
}
.item {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: space-between;
}
.item:hover {
  text-shadow: var(--text-shadow-hover);
}
.item label {
  font-size: var(--font-normal);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.flay-item .studio {
  flex: 0 0 3rem;
}
.flay-item .opus {
  flex: 0 0 5rem;
}
.flay-item .title {
  flex: 1 1 auto;
}
.flay-item .actress {
  flex: 0 0 8rem;
}
.flay-item .release {
  flex: 0 0 6rem;
}
.history-item .action {
  flex: 0 0 5rem;
}
.history-item .date {
  flex: 0 0 11rem;
}
.history-item .opus {
  flex: 0 0 5rem;
}
.history-item .desc {
  flex: 1 1 auto;
}
`;

const HTML = `
<div class="wrapper search-wrapper">
  <input type="search" id="search" name="search" placeholder="Search..." spellcheck="false">
</div>
<div class="wrapper instance-wrapper">
  <h1>Instance</h1>
  <div></div>
</div>
<div class="wrapper archive-wrapper">
  <h1>Archive</h1>
  <div></div>
</div>
<div class="wrapper history-wrapper">
  <h1>History</h1>
  <div></div>
</div>
`;
