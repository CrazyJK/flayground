import './inc/Page';
import './page.studio.scss';

import FlayStudio from '../flay/domain/part/FlayStudio';
import StringUtils from '../lib/StringUtils';

class Page {
  constructor() {
    this.studioList = [];
    this.debounceTimer = null;
    this.studioElements = new Map(); // DOM 요소 캐싱을 위한 맵
  }

  async start() {
    try {
      // 데이터 로딩
      this.studioList = await fetch('/info/studio').then((res) => res.json());

      this.searchInput = document.querySelector('body > header input');
      this.main = document.querySelector('body > main');

      // 검색 기능 설정
      this.searchInput.setAttribute('placeholder', `${this.studioList.length} Studio. Enter a keyword to search`);
      this.searchInput.addEventListener('input', this.handleSearch.bind(this));

      // 최적화된 렌더링
      this.renderStudios();
    } catch (error) {
      console.error('Failed to load studio data:', error);
      // 오류 처리 UI를 추가할 수 있습니다
    }
  }

  // 스튜디오 목록 렌더링을 효율적으로 처리
  renderStudios() {
    // DocumentFragment 사용으로 DOM 리플로우 최소화
    const fragment = document.createDocumentFragment();

    this.studioList.forEach((studio) => {
      const studioElement = new FlayStudio();
      studioElement.set({ studio: studio.name, archive: false });

      // 캐시에 DOM 요소 저장 (나중에 검색에서 사용)
      this.studioElements.set(studio.name, studioElement);

      fragment.appendChild(studioElement);
    });

    this.main.appendChild(fragment);
  }

  // 디바운싱을 적용한 검색 처리
  handleSearch(e) {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      const keyword = e.target.value.trim().toLowerCase();

      if (StringUtils.isBlank(keyword)) {
        // 키워드가 비어있을 때는 모든 'found' 클래스 제거
        this.studioElements.forEach((studioElem) => studioElem.classList.remove('found'));
      } else {
        // 필터링 로직 최적화
        this.studioElements.forEach((studioElem) => {
          const isMatch = studioElem.flay.studio.toLowerCase().includes(keyword);
          studioElem.classList.toggle('found', isMatch);
        });
      }
    }, 300); // 300ms 디바운스
  }
}

new Page().start();
