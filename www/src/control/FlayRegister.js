import SVG from '../svg/SVG';
import FlayAction from '../util/FlayAction';
import FlaySearch from '../util/FlaySearch';
import FlayStorage from '../util/FlayStorage';
import './FlayRegister.scss';

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
    <input  type="text"   id="studio"  placeholder="Studio" list="studio-list" />
    <datalist             id="studio-list"></datalist>
    <input  type="text"   id="opus"    placeholder="Opus" />
    <input  type="text"   id="title"   placeholder="Title" />
    <input  type="text"   id="actress" placeholder="Actress" />
    <input  type="text"   id="release" placeholder="Release" />
  </div>
  <div>
    <button type="button" id="copyBtn" placeholder="copy Name">Copy</button>
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
  <button id="copyStyle">[nextjav] Style</button>
  <button id="copyScript">Script</button>
  <button id="openNextjav" onclick="window.open('https://nextjav.com')">Open</button>
    <input type="text" id="lastSearchOpus" />
  </div>
</div>
<div class="search-group">
  <div id="found-flay"></div>
</div>
`;

/**
 *
 */
export default class FlayRegister extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다

    const link = this.shadowRoot.appendChild(document.createElement('link'));
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = 'style.css';

    const wrapper = this.shadowRoot.appendChild(document.createElement('div'));
    wrapper.classList.add(this.tagName.toLowerCase());
    wrapper.innerHTML = HTML;
  }

  connectedCallback() {
    const Wrapper = this.shadowRoot.querySelector('.flay-register');
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
    const flayFullname = this.shadowRoot.querySelector('#flayFullname');

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

    // 키 이벤트 전파 방지
    Wrapper.addEventListener('keyup', (e) => e.stopPropagation());
    //  spellcheck="false"
    this.shadowRoot.querySelectorAll('input, textarea').forEach((element) => {
      element.setAttribute('spellcheck', false);
    });

    // 기초 데이터 입력
    [inputOpus, inputTitle, inputActress, inputDesc].forEach((input) => {
      input.addEventListener('keyup', (e) => {
        e.target.value = e.target.value.trim();
        if (e.keyCode !== 13) {
          return;
        }
        console.log('search-input', inputOpus.value, inputTitle.value, inputActress.value, inputDesc.value);
        // find opus
        if (inputOpus.value !== '') {
          let inOpus = inputOpus.value.toUpperCase();
          // find Flay
          this.shadowRoot.querySelector('#found-flay').innerHTML = '';
          fetch('/flay/' + inOpus)
            .then((res) => {
              if (res.ok) {
                return res.json();
              }
              throw new Error('notfound: ' + inOpus);
            })
            .then((flay) => {
              // display Flay
              this.shadowRoot.querySelector('#found-flay').innerHTML = `
                <label>${flay.studio}</label>
                <label>${flay.opus}</label>
                <label>${flay.title}</label>
                <label>${flay.actressList.join(',')}</label>
                <label>${flay.release}</label>
              `;
              this.shadowRoot.querySelector('#found-flay label:nth-child(2)').addEventListener('click', () => {
                window.open('popup.flay.html?opus=' + flay.opus, 'popup.' + flay.opus, 'width=800px,height=1280px');
              });
            })
            .catch((e) => {
              console.error(e.message);
            });
          // find Studio
          fetch('/info/studio/findOneByOpus/' + inOpus)
            .then((res) => res.json())
            .then((foundStudio) => (studio.value = foundStudio.name));
          // searching Arzon
          FlaySearch.opus.Arzon(inOpus);
          // set opus
          opus.value = inOpus;
        }
        // find actress
        if (inputActress.value !== '') {
          inputActress.value.split(' ').forEach((localname) => {
            fetch('/info/actress/find/byLocalname/' + localname)
              .then((res) => res.json())
              .then((list) => {
                console.log('find actress', list);
                if (list.length === 1) {
                  actress.value += (actress.value !== '' ? ',' : '') + list[0].name;
                  actressFavorite.checked = list[0].favorite;
                  actressName.value = list[0].name;
                  actressLocalname.value = list[0].localName;
                  actressBirth.value = list[0].birth;
                  actressBody.value = list[0].body;
                  actressHeight.value = list[0].height;
                  actressDebut.value = list[0].debut;
                } else {
                  actressLocalname.value = localname;
                  FlaySearch.actress.Minnano(localname);
                }
              });
          });
        }
        // call translate
        if (inputTitle.value !== '' || inputDesc.value !== '') {
          FlaySearch.translate.Papago(inputTitle.value + ' ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ ' + inputDesc.value);
          FlaySearch.translate.DeepL(inputTitle.value + ' ■■■■■■■■■■■■■■■■■■■■■■■ ' + inputDesc.value);
        }
      });
    });
    emptyBtn.addEventListener('click', () => {
      console.log('emptyBtnClick');
      this.shadowRoot.querySelectorAll('input:not(#lastSearchOpus)').forEach((input) => (input.value = ''));
      this.shadowRoot.querySelectorAll('input[type="checkbox"]').forEach((input) => (input.checked = false));
      this.shadowRoot.querySelectorAll('textarea').forEach((textarea) => (textarea.value = ''));
    });

    // 요소 이벤트
    [studio, opus, title, actress, release].forEach((input) => {
      input.addEventListener('keyup', (e) => {
        if (e.target.id === 'title') {
          e.target.value = e.target.value.trim().replace(/[\\]/gi, '＼').replace(/[/]/gi, '／').replace(/[:]/gi, '：').replace(/[*]/gi, '＊').replace(/[?]/gi, '？').replace(/["]/gi, '＂').replace(/[<]/gi, '＜').replace(/[>]/gi, '＞').replace(/[|]/gi, '｜');
        } else if (e.target.id === 'actress') {
          actressName.value = e.target.value.trim();
        } else if (e.target.id === 'release') {
          const DATE_PATTERN = /^(19|20)\d{2}.(0[1-9]|1[012]).(0[1-9]|[12][0-9]|3[0-1])$/;
          e.target.value = release.value.replace(/(\d{4})(\d{2})(\d{2})/g, '$1.$2.$3');
          let isValid = DATE_PATTERN.test(e.target.value);
          e.target.classList.toggle('input-invalid', !isValid);
        }

        let fullName = `[${studio.value}][${opus.value}][${title.value}][${actress.value}][${release.value}]`;
        flayFullname.value = fullName;
      });
    });
    copyBtn.addEventListener('click', () => {
      console.log('copyBtnClick', flayFullname.value);
      window.navigator.clipboard.writeText(flayFullname.value).then(() => {
        FlayAction.putVideo({
          opus: opus.value,
          title: inputTitle.value,
          desc: inputDesc.value,
        });
      });
    });

    // 배우 이벤트
    // actressName, actressLocalname, actressBirth, actressBody, actressHeight, actressDebut
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
        const birthRegExp = /^(19[0-9][0-9]|20\d{2})年(0[0-9]|1[0-2])月(0[1-9]|[1-2][0-9]|3[0-1])日$/;
        const bodyRegExp = /^(7[0-9]|8[0-9]|9[0-9]|1\d{2})[A-J]? - (5[0-9]|6[0-9]) - (7[0-9]|8[0-9]|9[0-9]|1\d{2})$/;
        const heightRegExp = /^(1[4-7][0-9])$/;
        const debutRegExp = /^(199[0-9]|20[0-2][0-9])$/;
        if (/[0-9]年/.test(line)) {
          // 1987年09月07日 （現在 34歳）おとめ座
          const birth = line.split(' ')[0];
          actressBirth.value = birth;
          actressBirth.classList.toggle('input-invalid', !birthRegExp.test(actressBirth.value));
        } else if (line.indexOf('T') > -1) {
          // T161 / B83(Eカップ) / W58 / H82 / S
          const splitText = line.split(' / ');
          const height = splitText[0].substring(1);
          const body = splitText[1] + ' / ' + splitText[2] + ' / ' + splitText[3];
          actressBody.value = body
            .trim()
            .replace(/^[A-Z]|\(|カップ\)/gi, '')
            .replace(/\/ [A-Z]/gi, '- ');
          actressBody.classList.toggle('input-invalid', !bodyRegExp.test(actressBody.value));
          actressHeight.value = height;
          actressHeight.classList.toggle('input-invalid', !heightRegExp.test(actressHeight.value));
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
        NEXTJAV_STYLE = text.substring(0, text.indexOf('</style>') + '</style>'.length);
        NEXTJAV_SCRIPT = text.substring(text.indexOf('</style>') + '</style>'.length).trim();
      });
  }
}

// Define the new element
customElements.define('flay-register', FlayRegister);
