import FlayAction from '../util/flay.action';
import FlayStorage from '../util/flay.storage';
import SVG from './svg.json';

/**
 *
 */
export default class FlaySearch extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다
    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('flay-search');
    const style = document.createElement('link');
    style.setAttribute('rel', 'stylesheet');
    style.setAttribute('href', './css/FlaySearch.css');
    this.shadowRoot.append(style, this.wrapper); // 생성된 요소들을 shadow DOM에 부착합니다

    this.wrapper.innerHTML = HTML;

    const emptyBtn = this.shadowRoot.querySelector('#emptyBtn');
    const copyBtn = this.shadowRoot.querySelector('#copyBtn');
    const saveBtn = this.shadowRoot.querySelector('#saveBtn');

    const inputOpus = this.shadowRoot.querySelector('#inputOpus');
    const inputTitle = this.shadowRoot.querySelector('#inputTitle');
    const inputActress = this.shadowRoot.querySelector('#inputActress');
    const inputDesc = this.shadowRoot.querySelector('#inputDesc');
    const inputTemp = this.shadowRoot.querySelector('#inputTemp');

    const studio = this.shadowRoot.querySelector('#studio');
    const studioList = this.shadowRoot.querySelector('#studio-list');
    const opus = this.shadowRoot.querySelector('#opus');
    const title = this.shadowRoot.querySelector('#title');
    const actress = this.shadowRoot.querySelector('#actress');
    const release = this.shadowRoot.querySelector('#release');

    const actressFavorite = this.shadowRoot.querySelector('#actressFavorite');
    const actressName = this.shadowRoot.querySelector('#actressName');
    const actressLocalname = this.shadowRoot.querySelector('#actressLocalname');
    const actressBirth = this.shadowRoot.querySelector('#actressBirth');
    const actressBody = this.shadowRoot.querySelector('#actressBody');
    const actressHeight = this.shadowRoot.querySelector('#actressHeight');
    const actressDebut = this.shadowRoot.querySelector('#actressDebut');
    const actressRowData = this.shadowRoot.querySelector('#actressRowData');

    let NEXTJAV_STYLE = null;
    let NEXTJAV_SCRIPT = null;

    emptyBtn.addEventListener('click', () => {
      console.log('emptyBtnClick');
      this.shadowRoot.querySelectorAll('input').forEach((input) => (input.value = ''));
      this.shadowRoot.querySelectorAll('input[type="checkbox"]').forEach((input) => (input.checked = false));
      this.shadowRoot.querySelectorAll('textarea').forEach((textarea) => (textarea.value = ''));
    });
    copyBtn.addEventListener('click', () => {
      let fullName = `[${studio.value}][${opus.value}][${title.value}][${actress.value}][${release.value}]`;
      console.log('copyBtnClick', fullName);
      window.navigator.clipboard.writeText(fullName);
    });
    saveBtn.addEventListener('click', () => {
      let actress = { favorite: actressFavorite.checked, name: actressName.value, localName: actressLocalname.value, birth: actressBirth.value, body: actressBody.value, height: actressHeight.value, debut: actressDebut.value };
      console.log('saveBtnClick', actress);
      FlayAction.putActress(actress);
    });
    actressRowData.addEventListener('keyup', (e) => {
      e.stopPropagation();
      if (e.keyCode === 17) {
        // Control key ignored
        return;
      }
      e.target.value.split('\n').forEach((line) => {
        console.log('actressRowData line', line);
        if (/[0-9]年/.test(line)) {
          // 1987年09月07日 （現在 34歳）おとめ座
          const birth = line.split(' ')[0];
          actressBirth.value = birth;
        } else if (line.indexOf('T') > -1) {
          // T161 / B83(Eカップ) / W58 / H82 / S
          const splitText = line.split(' / ');
          const height = splitText[0].substring(1);
          const body = splitText[1] + ' / ' + splitText[2] + ' / ' + splitText[3];
          actressBody.value = body;
          actressHeight.value = height;
        }
      });
    });
    this.shadowRoot.querySelectorAll('.search-input').forEach((input) => {
      input.addEventListener('keyup', (e) => {
        e.stopPropagation();
        if (e.keyCode !== 13) {
          return;
        }
        console.log('search-input', inputOpus.value, inputTitle.value, inputActress.value, inputDesc.value);
        // find opus
        if (inputOpus.value !== '') {
          let inOpus = inputOpus.value.toUpperCase();
          // find Flay
          fetch('/flay/' + inOpus)
            .then((res) => res.json())
            .then((flay) => {
              // display Flay
              this.shadowRoot.querySelector('#found-flay').innerHTML = `
                <label>${flay.studio}</label>
                <label>${flay.opus}</label>
                <label>${flay.title}</label>
                <label>${flay.actressList.join(',')}</label>
                <label>${flay.release}</label>
              `;
            });
          // find Studio
          fetch('/info/studio/findOneByOpus/' + inOpus)
            .then((res) => res.json())
            .then((foundStudio) => (studio.value = foundStudio.name));
          // searching Arzon
          const URL_SEARCH_ARZON = 'https://www.arzon.jp/itemlist.html?t=&m=all&s=&q=';
          window.open(URL_SEARCH_ARZON + inOpus, 'arzon' + inOpus, 'width=800px,height=1000px');
          // set opus
          opus.value = inOpus;
        }
        // find actress
        if (inputActress.value !== '') {
          inputActress.value.split(',').forEach((localname) => {
            fetch('/info/actress/find/byLocalname/' + localname)
              .then((res) => res.json())
              .then((list) => {
                console.log('find actress', list);
                if (list.length === 1) {
                  actress.value = (actress.value !== '' ? ',' : '') + list[0].name;
                  actressFavorite.checked = list[0].favorite;
                  actressName.value = list[0].name;
                  actressLocalname.value = list[0].localName;
                  actressBirth.value = list[0].birth;
                  actressBody.value = list[0].body;
                  actressHeight.value = list[0].height;
                  actressDebut.value = list[0].debut;
                } else {
                  actressLocalname.value = localname;
                  // searching actress
                  const URL_SEARCH_ACTRESS = 'https://www.minnano-av.com/search_result.php?search_scope=actress&search=+Go+&search_word=';
                  window.open(URL_SEARCH_ACTRESS + localname, 'minnano' + localname, 'width=1200px,height=950px');
                }
              });
          });
        }
        // call translate
        if (inputTitle.value !== '' || inputDesc.value !== '') {
          let url = 'https://papago.naver.com/?sk=auto&tk=ko&st=' + inputTitle.value + ' ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ ' + inputDesc.value;
          window.open(url, 'translateByPapago', 'width=1000px,height=500px');
        }
      });
    });
    // copy style
    this.shadowRoot.querySelector('#copyStyle').addEventListener('click', () => {
      window.navigator.clipboard.writeText(NEXTJAV_STYLE);
    });
    // copy script
    this.shadowRoot.querySelector('#copyScript').addEventListener('click', () => {
      window.navigator.clipboard.writeText(NEXTJAV_SCRIPT);
    });
    // update lastSearchOpus
    this.shadowRoot.querySelector('#lastSearchOpus').addEventListener('change', (e) => {
      FlayStorage.local.set('flay.search.lastSearchOpus', e.target.value);
    });
    this.shadowRoot.querySelector('#lastSearchOpus').value = FlayStorage.local.get('flay.search.lastSearchOpus', '');

    // studio-list
    FlayAction.listOfStudio((list) => {
      studioList.innerHTML = Array.from(list)
        .map((studio) => `<option value="${studio}">`)
        .join('');
    });
    // fetch nextjav style
    fetch('/stylish/nextjav_tor.html')
      .then((response) => response.text())
      .then((text) => {
        NEXTJAV_STYLE = text.substring(0, text.indexOf('<script>'));
        NEXTJAV_SCRIPT = text.substring(text.indexOf('<script>'));
      });
  }
}

// Define the new element
customElements.define('flay-search', FlaySearch);

const HTML = `
<div class="search-group">
  <div>
    <input  type="search" id="inputOpus"    class="search-input" placeholder="Opus" />
    <input  type="search" id="inputTitle"   class="search-input" placeholder="Title" />
    <input  type="search" id="inputActress" class="search-input" placeholder="Actress" />
    <button type="button" id="emptyBtn"     title="empty input">empty</button>
  </div>
  <div>
    <textarea id="inputDesc" class="search-input" placeholder="description"></textarea>
  </div>
</div>
<div class="search-group">
  <div>
    <input type="text" id="inputTemp" />
  </div>
  <div>
    <button type="button" id="copyBtn" placeholder="copy Name">Copy</button>
    <input  type="text"   id="studio"  placeholder="Studio" list="studio-list" />
    <datalist             id="studio-list"></datalist>
    <input  type="text"   id="opus"    placeholder="Opus" />
    <input  type="text"   id="title"   placeholder="Title" />
    <input  type="text"   id="actress" placeholder="Actress" />
    <input  type="text"   id="release" placeholder="Release" />
  </div>
  <div>
    <input type="text" id="flayFullname" placeholder="flay fullname" />
  </div>
</div>
<div class="search-group">
  <div>
    <span class="checkbox">
      <input type="checkbox" id="actressFavorite" />
      <label for="actressFavorite">${SVG.favorite}</label>
    </span>
    <input  type="text"   id="actressName"      placeholder="name" />
    <input  type="text"   id="actressLocalname" placeholder="localName" />
    <input  type="text"   id="actressBirth"     placeholder="birth" />
    <input  type="text"   id="actressBody"      placeholder="body" />
    <input  type="number" id="actressHeight"    placeholder="height" />
    <input  type="number" id="actressDebut"     placeholder="debut" />
    <button type="button" id="saveBtn"          placeholder="save Actress">Save</button>
  </div>
  <div>
    <textarea id="actressRowData" placeholder="input: 1999年12月01日 （現在 21歳) いて座
サイズ

T163 / B92(Hカップ) / W62 / H89"></textarea>
  </div>
</div>
<div class="search-group">
  <div>
    <button id="copyStyle">Copy nextjav Style</button>
    <button id="copyScript">Copy nextjav Script</button>
    <input type="text" id="lastSearchOpus" />
  </div>
</div>
<div class="search-group">
  <div id="found-flay"></div>
</div>
`;
