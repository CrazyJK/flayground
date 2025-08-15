import GroundFlay from '@base/GroundFlay';
import FlayAction from '@lib/FlayAction';
import FlayFetch, { Actress } from '@lib/FlayFetch';
import FlaySearch, { popupFlay, URL_NONOJAV_PAGE } from '@lib/FlaySearch';
import FlayStorage from '@lib/FlayStorage';
import favoriteSVG from '@svg/favorite';
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
    <input  type="text"   id="studio"  placeholder="Studio" list="studio-list" autocomplete="off" />
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
 * Flay 콘텐츠 등록 및 관리를 위한 폼 컴포넌트
 *
 * 새로운 Flay 정보를 입력하고, 검색하며, 배우 정보를 관리할 수 있는
 * 통합 등록 인터페이스를 제공합니다.
 */
export default class FlayRegister extends GroundFlay {
  constructor() {
    super();

    this.innerHTML = HTML;
  }

  connectedCallback() {
    const emptyBtn = this.querySelector('#emptyBtn');
    const copyBtn = this.querySelector('#copyBtn');
    const saveBtn = this.querySelector('#saveBtn');

    const inputOpus = this.querySelector('#inputOpus') as HTMLInputElement;
    const inputTitle = this.querySelector('#inputTitle') as HTMLInputElement;
    const inputActress = this.querySelector('#inputActress') as HTMLInputElement;
    const inputDesc = this.querySelector('#inputDesc') as HTMLInputElement;

    const studio = this.querySelector('#studio') as HTMLInputElement;
    const studioList = this.querySelector('#studio-list') as HTMLDataListElement;
    const opus = this.querySelector('#opus') as HTMLInputElement;
    const title = this.querySelector('#title') as HTMLInputElement;
    const actress = this.querySelector('#actress') as HTMLInputElement;
    const release = this.querySelector('#release') as HTMLInputElement;
    const flayFullname = this.querySelector('#flayFullname') as HTMLInputElement;

    const actressFavorite = this.querySelector('#actressFavorite') as HTMLInputElement;
    const actressName = this.querySelector('#actressName') as HTMLInputElement;
    const actressLocalname = this.querySelector('#actressLocalname') as HTMLInputElement;
    const actressBirth = this.querySelector('#actressBirth') as HTMLInputElement;
    const actressBody = this.querySelector('#actressBody') as HTMLInputElement;
    const actressHeight = this.querySelector('#actressHeight') as HTMLInputElement;
    const actressDebut = this.querySelector('#actressDebut') as HTMLInputElement;
    const actressRowData = this.querySelector('#actressRowData') as HTMLTextAreaElement;

    // 키 이벤트 전파 방지
    this.addEventListener('keyup', (e) => e.stopPropagation());
    // 맞춤법 검사 비활성화
    this.querySelectorAll('input, textarea').forEach((element) => {
      element.setAttribute('spellcheck', 'false');
    });

    // 기초 데이터 입력
    [inputOpus, inputTitle, inputActress, inputDesc].forEach((input) => {
      input.addEventListener('keyup', async (e: KeyboardEvent) => {
        const target = e.target as HTMLInputElement;
        target.value = target.value.trim().toUpperCase();
        if (e.keyCode !== 13) {
          return;
        }
        console.log('search-input', inputOpus.value, inputTitle.value, inputActress.value, inputDesc.value);
        // find opus
        if (inputOpus.value !== '') {
          const inOpus = inputOpus.value;
          const foundFlayEl = this.querySelector('#found-flay')!;
          // Flay 찾기
          foundFlayEl.innerHTML = '';

          const flay = (await FlayFetch.getFlay(inOpus)) ?? (await FlayFetch.getArchive(inOpus));
          if (flay) {
            foundFlayEl.innerHTML = `
              <label>${flay.studio}</label>
              <label>${flay.opus}</label>
              <label>${flay.title}</label>
              <label>${flay.actressList.join(',')}</label>
              <label>${flay.release}</label>
            `;
            foundFlayEl.classList.toggle('archive', flay.archive);
            foundFlayEl.querySelector('label:nth-child(2)')?.addEventListener('click', () => popupFlay(flay.opus));
          } else {
            console.log('notfound: ' + inOpus);
          }

          // Studio 찾기
          void FlayFetch.getStudioFindOneByOpus(inOpus).then((foundStudio) => (studio.value = foundStudio!.name));
          // Arzon 검색
          // FlaySearch.opus.Arzon(inOpus);
          FlaySearch.opus.Dondeth(inOpus);
          // opus 설정
          opus.value = inOpus;
        }
        // 배우 찾기
        if (inputActress.value !== '') {
          inputActress.value.split(' ').forEach((localname) => {
            void FlayFetch.getActressListByLocalname(localname).then((list) => {
              console.log('find actress', list);
              if (list.length === 1) {
                const firstActress = list[0]!;
                actress.value += (actress.value !== '' ? ',' : '') + firstActress.name;
                actressFavorite.checked = firstActress.favorite;
                actressName.value = firstActress.name;
                actressLocalname.value = firstActress.localName;
                actressBirth.value = firstActress.birth;
                actressBody.value = firstActress.body;
                actressHeight.value = '' + firstActress.height;
                actressDebut.value = '' + firstActress.debut;
              } else {
                actressLocalname.value = localname;
                FlaySearch.actress.Minnano(localname);
              }
            });
          });
        }
        // 번역 호출
        if (inputTitle.value !== '' || inputDesc.value !== '') {
          FlaySearch.translate.Papago(inputTitle.value + ' ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ ' + inputDesc.value);
          FlaySearch.translate.DeepL(inputTitle.value + ' ■■■■■■■■■■■■■■■■■■■■■■■ ' + inputDesc.value);
        }
      });
    });
    emptyBtn?.addEventListener('click', () => {
      console.log('emptyBtnClick');
      this.querySelectorAll('input:not(#lastSearchOpus)').forEach((input) => ((input as HTMLInputElement).value = ''));
      this.querySelectorAll('input[type="checkbox"]').forEach((input) => ((input as HTMLInputElement).checked = false));
      this.querySelectorAll('textarea').forEach((textarea) => (textarea.value = ''));
      this.querySelectorAll('.input-invalid').forEach((input) => input.classList.remove('input-invalid'));
    });

    // 요소별 이벤트 처리
    [studio, opus, title, actress, release].forEach((input) => {
      input.addEventListener('keyup', (e: KeyboardEvent) => {
        const target = e.target as HTMLInputElement;
        if (target.id === 'title') {
          target.value = target.value.trim().replace(/[\\]/gi, '＼').replace(/[/]/gi, '／').replace(/[:]/gi, '：').replace(/[*]/gi, '＊').replace(/[?]/gi, '？').replace(/["]/gi, '＂').replace(/[<]/gi, '＜').replace(/[>]/gi, '＞').replace(/[|]/gi, '｜');
        } else if (target.id === 'actress') {
          actressName.value = target.value.trim();
        } else if (target.id === 'release') {
          const DATE_PATTERN = /^(19|20)\d{2}.(0[1-9]|1[012]).(0[1-9]|[12][0-9]|3[0-1])$/;
          target.value = release.value.replace(/(\d{4})(\d{2})(\d{2})/g, '$1.$2.$3');
          const isValid = DATE_PATTERN.test(target.value);
          target.classList.toggle('input-invalid', !isValid);
        }

        const fullName = `[${studio.value}][${opus.value}][${title.value}][${actress.value}][${release.value}]`;
        flayFullname.value = fullName;
      });
    });
    copyBtn?.addEventListener('click', () => {
      console.log('copyBtnClick', flayFullname.value);
      void window.navigator.clipboard.writeText(flayFullname.value).then(() => {
        void FlayAction.putVideo({
          opus: opus.value,
          title: inputTitle.value,
          desc: inputDesc.value,
        });
      });
    });

    // 배우 정보 저장 이벤트
    // actressName, actressLocalname, actressBirth, actressBody, actressHeight, actressDebut
    saveBtn?.addEventListener('click', () => {
      const actress: Partial<Actress> = { favorite: actressFavorite.checked, name: actressName.value, localName: actressLocalname.value, birth: actressBirth.value, body: actressBody.value, height: parseInt(actressHeight.value), debut: parseInt(actressDebut.value) };
      console.log('saveBtnClick', actress);
      void FlayAction.putActress(actress);
    });
    actressRowData.addEventListener('keyup', (e: KeyboardEvent) => {
      e.stopPropagation();
      if (e.keyCode === 17) {
        // Control 키 무시
        return;
      }
      const target = e.target as HTMLTextAreaElement;
      target.value.split('\n').forEach((line) => {
        console.log('actressRowData line', line);
        const birthRegExp = /^(19[0-9][0-9]|20\d{2})年(0[0-9]|1[0-2])月(0[1-9]|[1-2][0-9]|3[0-1])日$/;
        const bodyRegExp = /^(7[0-9]|8[0-9]|9[0-9]|1\d{2})[A-J]? - (5[0-9]|6[0-9]) - (7[0-9]|8[0-9]|9[0-9]|1\d{2})$/;
        const heightRegExp = /^(1[4-7][0-9])$/;
        // const debutRegExp = /^(199[0-9]|20[0-2][0-9])$/;
        if (/[0-9]年/.test(line)) {
          // 1987年09月07日 （現在 34歳）おとめ座
          const birth = line.split(' ')[0];
          actressBirth.value = birth!;
          actressBirth.classList.toggle('input-invalid', !birthRegExp.test(actressBirth.value));
        } else if (line.includes('T')) {
          // T161 / B83(Eカップ) / W58 / H82 / S
          const splitText = line.split(' / ');
          const height = splitText[0]?.substring(1);
          const body = splitText[1] + ' / ' + splitText[2] + ' / ' + splitText[3];
          actressBody.value = body
            .trim()
            .replace(/^[A-Z]|\(|カップ\)/gi, '')
            .replace(/\/ [A-Z]/gi, '- ');
          actressBody.classList.toggle('input-invalid', !bodyRegExp.test(actressBody.value));
          actressHeight.value = String(height);
          actressHeight.classList.toggle('input-invalid', !heightRegExp.test(actressHeight.value));
        }
      });
    });

    // 마지막 검색 Opus 업데이트
    this.querySelector('#lastSearchOpus')?.addEventListener('change', (e: Event) => {
      FlayStorage.local.set('flay.search.lastSearchOpus', (e.target as HTMLInputElement).value);
    });
    (this.querySelector('#lastSearchOpus') as HTMLInputElement).value = FlayStorage.local.get('flay.search.lastSearchOpus', '');
    // 토렌트 다운로드 열기
    this.querySelector('#dnNonoTorrent')?.addEventListener('click', () => FlaySearch.torrent.Nonojav(inputOpus.value));
    this.querySelector('#dnIjavTorrent')?.addEventListener('click', () => FlaySearch.torrent.Ijav(inputOpus.value));

    // 스튜디오 목록
    void FlayAction.listOfStudio((list?: string[]) => {
      if (list) {
        studioList.innerHTML = Array.from(list)
          .map((studio) => `<option value="${studio}">`)
          .join('');
      }
    });
  }
}

/** 커스텀 엘리먼트 등록 */
customElements.define('flay-register', FlayRegister);
