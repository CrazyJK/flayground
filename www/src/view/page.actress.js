import FlayFetch from '@lib/FlayFetch';
import { popupActress, popupActressInfo } from '@lib/FlaySearch';
import StringUtils from '@lib/StringUtils';
import favoriteSVG from '@svg/favorite';
import noFavoriteSVG from '@svg/noFavorite';
import './inc/Page';
import './page.actress.scss';

class Page {
  constructor() {
    this.actressList = [];
    this.filteredActresses = [];
    this.domCache = new Map(); // DOM 요소 캐싱을 위한 맵
    this.debounceTimer = null;
    this.searchIndex = {}; // 검색 인덱스
  }

  async start() {
    try {
      // 데이터 로딩 중에 표시할 로딩 인디케이터를 추가할 수 있습니다
      const actressList = await FlayFetch.getActressAll();
      this.actressList = actressList.sort((a, b) => a.name.localeCompare(b.name));

      // 검색을 위한 인덱스 구축
      this.buildSearchIndex();

      const searchInput = document.querySelector('body > header input');
      this.main = document.querySelector('body > main');

      searchInput.setAttribute('placeholder', `${this.actressList.length} Actresses. Enter a keyword to search`);
      searchInput.addEventListener('input', this.handleSearch.bind(this));

      this.main.addEventListener('click', this.handleClick.bind(this));

      // 초기 목록 표시 (선택적)
      // this.renderActresses(this.actressList);
    } catch (error) {
      console.error('Failed to load actress data:', error);
      // 오류 처리 UI를 추가할 수 있습니다
    }
  }

  // 검색 인덱스 구축 - 성능 향상을 위한 전처리
  buildSearchIndex() {
    this.actressList.forEach((actress) => {
      // 각 배우의 모든 필드를 소문자로 변환하여 검색용 문자열 생성
      const searchText = Object.values(actress).join(' ').toLowerCase();
      // 인덱스에 저장
      actress.searchText = searchText;
    });
  }

  // 디바운싱을 적용한 검색 처리
  handleSearch(e) {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      const keyword = e.target.value.trim().toLowerCase();
      if (StringUtils.isBlank(keyword)) {
        // 키워드가 비어있을 때 처리 (옵션)
        this.main.textContent = '';
        return;
      }

      // 필터링된 배우 목록
      this.filteredActresses = this.actressList.filter((actress) => actress.searchText.includes(keyword));

      // 결과 렌더링
      this.renderActresses(this.filteredActresses);

      // 필요한 경우에만 스크롤 (선택적)
      if (this.filteredActresses.length > 0) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 300); // 300ms 디바운스
  }

  // DOM 재사용을 활용한 효율적인 렌더링
  renderActresses(actresses) {
    // 기존 콘텐츠 지우기
    this.main.textContent = '';

    if (actresses.length === 0) {
      const noResults = document.createElement('div');
      noResults.className = 'no-results';
      noResults.textContent = 'No actresses found.';
      this.main.appendChild(noResults);
      return;
    }

    const fragment = document.createDocumentFragment();
    actresses.forEach((actress) => {
      // DOM 캐시에서 요소 가져오거나 생성
      let item = this.domCache.get(actress.name);

      if (!item) {
        item = document.createElement('div');
        item.dataset.name = actress.name;
        item.innerHTML = `
          <label class="favorite"   >${actress.favorite ? favoriteSVG : noFavoriteSVG}</label>
          <label class="name"       title="${actress.comment}">${actress.name}</label>
          <label class="local-name" >${actress.localName}</label>
          <label class="birth"      >${actress.birth}</label>
          <label class="body"       >${actress.body.replace(/ /g, '')}</label>
          <label class="height"     >${actress.height > 0 ? actress.height : ''}</label>
          <label class="debut"      >${actress.debut > 0 ? actress.debut : ''}</label>
        `;

        // DOM 캐시에 저장
        this.domCache.set(actress.name, item);
      }

      fragment.appendChild(item.cloneNode(true));
    });

    this.main.appendChild(fragment);
  }

  handleClick(e) {
    const actressName = e.target.closest('div')?.dataset.name;
    if (StringUtils.isBlank(actressName)) return;

    // 데이터 속성이나 더 안정적인 식별자를 사용하는 것이 좋습니다
    switch (e.target.className) {
      case 'name':
        popupActress(actressName);
        break;
      case 'local-name':
        popupActressInfo(actressName);
        break;
    }
  }
}

new Page().start();
