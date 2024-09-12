import favoriteSVG from '../svg/favorite.svg';
import FlayAction from '../util/FlayAction';
import FlaySearch, { popupFlay, URL_NONOJAV_PAGE } from '../util/FlaySearch';
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
      <label for="actressFavorite">${favoriteSVG}</label>
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
    <button id="openNanojav" onclick="window.open('${URL_NONOJAV_PAGE}')">List Open</button>
    <input type="text" id="lastSearchOpus" />
    <button id="dnNonoTorrent">Nonojav Dn</button>
    <button id="dnIjavTorrent">Ijav Dn</button>
  </div>
</div>
<div class="search-group">
  <div id="found-flay"></div>
</div>
`;

/**
 *
 */
export default class FlayRegister extends HTMLDivElement {
  constructor() {
    super();

    this.classList.add('flay-register');
    this.innerHTML = HTML;
  }

  connectedCallback() {
    const emptyBtn = this.querySelector('#emptyBtn');
    const copyBtn = this.querySelector('#copyBtn');
    const saveBtn = this.querySelector('#saveBtn');

    const inputOpus = this.querySelector('#inputOpus');
    const inputTitle = this.querySelector('#inputTitle');
    const inputActress = this.querySelector('#inputActress');
    const inputDesc = this.querySelector('#inputDesc');
    const inputTemp = this.querySelector('#inputTemp');

    const studio = this.querySelector('#studio');
    const studioList = this.querySelector('#studio-list');
    const opus = this.querySelector('#opus');
    const title = this.querySelector('#title');
    const actress = this.querySelector('#actress');
    const release = this.querySelector('#release');
    const flayFullname = this.querySelector('#flayFullname');

    const actressFavorite = this.querySelector('#actressFavorite');
    const actressName = this.querySelector('#actressName');
    const actressLocalname = this.querySelector('#actressLocalname');
    const actressBirth = this.querySelector('#actressBirth');
    const actressBody = this.querySelector('#actressBody');
    const actressHeight = this.querySelector('#actressHeight');
    const actressDebut = this.querySelector('#actressDebut');
    const actressRowData = this.querySelector('#actressRowData');

    // 키 이벤트 전파 방지
    this.addEventListener('keyup', (e) => e.stopPropagation());
    //  spellcheck="false"
    this.querySelectorAll('input, textarea').forEach((element) => {
      element.setAttribute('spellcheck', false);
    });

    // 기초 데이터 입력
    [inputOpus, inputTitle, inputActress, inputDesc].forEach((input) => {
      input.addEventListener('keyup', async (e) => {
        e.target.value = e.target.value.trim().toUpperCase();
        if (e.keyCode !== 13) {
          return;
        }
        console.log('search-input', inputOpus.value, inputTitle.value, inputActress.value, inputDesc.value);
        // find opus
        if (inputOpus.value !== '') {
          const inOpus = inputOpus.value;
          const foundFlayEl = this.querySelector('#found-flay');
          // find Flay
          foundFlayEl.innerHTML = '';

          let flay = await fetch('/flay/' + inOpus).then((res) => (res.ok ? res.json() : false));
          if (!flay) flay = await fetch('/archive/' + inOpus).then((res) => (res.ok ? res.json() : false));
          if (flay) {
            foundFlayEl.innerHTML = `
              <label>${flay.studio}</label>
              <label>${flay.opus}</label>
              <label>${flay.title}</label>
              <label>${flay.actressList.join(',')}</label>
              <label>${flay.release}</label>
            `;
            foundFlayEl.classList.toggle('archive', flay.archive);
            foundFlayEl.querySelector('label:nth-child(2)').addEventListener('click', () => popupFlay(flay.opus));
          } else {
            console.log('notfound: ' + inOpus);
          }

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
      this.querySelectorAll('input:not(#lastSearchOpus)').forEach((input) => (input.value = ''));
      this.querySelectorAll('input[type="checkbox"]').forEach((input) => (input.checked = false));
      this.querySelectorAll('textarea').forEach((textarea) => (textarea.value = ''));
      this.querySelectorAll('.input-invalid').forEach((input) => input.classList.remove('input-invalid'));
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

    // update lastSearchOpus
    this.querySelector('#lastSearchOpus').addEventListener('change', (e) => {
      FlayStorage.local.set('flay.search.lastSearchOpus', e.target.value);
    });
    this.querySelector('#lastSearchOpus').value = FlayStorage.local.get('flay.search.lastSearchOpus', '');
    // open Torrent download
    this.querySelector('#dnNonoTorrent').addEventListener('click', () => FlaySearch.torrent.Nonojav(inputOpus.value));
    this.querySelector('#dnIjavTorrent').addEventListener('click', () => FlaySearch.torrent.Ijav(inputOpus.value));

    // studio-list
    FlayAction.listOfStudio((list) => {
      studioList.innerHTML = Array.from(list)
        .map((studio) => `<option value="${studio}">`)
        .join('');
    });
  }
}

// Define the new element
customElements.define('flay-register', FlayRegister, { extends: 'div' });
