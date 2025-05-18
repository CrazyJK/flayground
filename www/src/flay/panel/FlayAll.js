import FlayFetch from '@lib/FlayFetch';
import { popupActress, popupFlay } from '../../lib/FlaySearch.js';

/**
 * FlayAll - 플레이 목록을 표시하는 커스텀 엘리먼트
 * 20,000개 이상의 레코드를 효율적으로 표시하고 필터링, 정렬, 페이지네이션 기능을 제공합니다.
 *
 * @example
 * <flay-all></flay-all>
 *
 * @example 슬롯을 활용한 확장 방법
 * <flay-all>
 *   <div slot="filter-controls">커스텀 필터 컨트롤</div>
 *   <div slot="total-display">커스텀 총계 표시</div>
 *   <div slot="pagination">커스텀 페이지네이션</div>
 * </flay-all>
 *
 * @customElement flay-all
 * @slot filter-controls - 필터 컨트롤 영역을 커스터마이징할 수 있습니다.
 * @slot total-display - 총 항목 수 표시 영역을 커스터마이징할 수 있습니다.
 * @slot table - 테이블 영역을 커스터마이징할 수 있습니다.
 * @slot pagination - 페이지네이션 컨트롤 영역을 커스터마이징할 수 있습니다.
 * @fires data-loaded - 데이터 로드가 완료되었을 때 발생
 * @fires data-error - 데이터 로드 중 오류가 발생했을 때 발생
 * @fires page-changed - 페이지가 변경되었을 때 발생
 * @fires sort-changed - 정렬이 변경되었을 때 발생
 * @fires filter-changed - 필터가 변경되었을 때 발생
 */
export class FlayAll extends HTMLElement {
  // 상수 및 클래스 변수 정의
  static PAGE_SIZE = 100; // 한 번에 표시할 항목 수

  // 클래스 필드 정의
  #currentPage = 0;
  #sortedFlayList = [];
  #sortColumn = 4; // 기본 정렬 컬럼 (발매일)
  #sortDirection = -1; // 기본 내림차순
  #observer = null;
  #enableInfiniteScroll = false;
  #flayMap = new Map();
  #styleSheet = null;

  /**
   * FlayListComponent 생성자
   */
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  /**
   * 요소가 DOM에 연결되었을 때 호출됩니다.
   */
  connectedCallback() {
    this.#render();
    this.#initializeEventListeners();
    this.#loadData();
  }

  /**
   * 요소의 속성이 변경되었을 때 호출됩니다.
   *
   * @param {string} name 변경된 속성 이름
   * @param {string} oldValue 이전 값
   * @param {string} newValue 새 값
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'page-size' && oldValue !== newValue) {
      const pageSize = parseInt(newValue, 10);
      if (!isNaN(pageSize) && pageSize > 0) {
        // pageSize 변경 처리
        this.#currentPage = 0;
        this.#renderPage();
      }
    }
  }

  /**
   * 관찰할 속성 목록을 반환합니다.
   *
   * @returns {string[]} 관찰할 속성 배열
   */
  static get observedAttributes() {
    return ['page-size'];
  }

  /**
   * 요소가 DOM에서 제거되었을 때 호출됩니다.
   */
  disconnectedCallback() {
    this.#removeEventListeners();
  }

  // 템플릿 생성 - 컴포넌트의 HTML 구조를 정의합니다
  static #createTemplate() {
    const template = document.createElement('template');
    template.innerHTML = `
      <div class="flay-list-wrapper">
        <div class="control-panel">
          <slot name="filter-controls">
            <div class="filter">
              <input type="text" id="search-input" placeholder="검색어 입력..." />
              <label><input type="checkbox" id="show-archive" checked /> 아카이브 포함</label>
            </div>
          </slot>
          <slot name="total-display">
            <div class="total-display">
              총 <strong id="total-count">0</strong>개
            </div>
          </slot>
        </div>

        <slot name="table">
          <table class="flay-list">
            <thead>
              <tr>
                <th data-sort="studio">제작사</th>
                <th data-sort="opus">작품번호</th>
                <th data-sort="title">제목</th>
                <th data-sort="actressList">배우</th>
                <th data-sort="release">발매일</th>
                <th data-sort="rank">랭크</th>
                <th data-sort="score">스코어</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </slot>

        <div class="loading-indicator">데이터를 불러오는 중입니다...</div>
        <div id="scroll-observer"></div>

        <footer class="pagination-footer">
          <slot name="pagination">
            <div class="pagination">
              <button id="prev-page" disabled>이전</button>
              <div class="page-numbers" id="page-numbers"></div>
              <button id="next-page">다음</button>
            </div>
          </slot>
        </footer>
      </div>
    `;
    return template;
  }

  /**
   * 초기 렌더링
   */
  #render() {
    // 스타일 설정
    this.#styleSheet = document.createElement('style');

    // 스타일 정의
    this.#styleSheet.textContent = `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }
      .flay-list-wrapper {
        display: flex;
        flex-direction: column;
        height: 100%;
        max-width: 1200px;
        margin: 0 auto;
        padding: 10px;
        gap: 10px;
      }
      .control-panel {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
      }
      .filter {
        display: flex;
        gap: 15px;
        align-items: center;
      }
      .total-display {
        font-size: 14px;
        padding: 6px 0;
      }
      .total-display strong {
        color: var(--color-primary, #4285f4);
        font-weight: 600;
      }
      #search-input {
        padding: 6px 12px;
        background-color: var(--color-transparent);
        border: 1px solid var(--color-border, #ddd);
        border-radius: 4px;
        width: 180px;
        font-size: 14px;
      }
      #search-input:focus {
        outline: none;
        border-color: var(--color-primary, #4285f4);
        box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.1);
      }
      label {
        display: flex;
        align-items: center;
        gap: 5px;
        cursor: pointer;
        font-size: 14px;
      }
      input[type='checkbox'] {
        cursor: pointer;
      }
      .flay-list {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
        font-size: 14px;
      }
      th, td {
        padding: 8px 10px;
        text-align: left;
        border-bottom: 1px solid var(--color-border, #eee);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      th {
        background-color: var(--color-bg-secondary, #413535);
        color: var(--color-text-secondary, #fff);
        font-weight: 500;
        position: sticky;
        top: 0;
        z-index: 10;
        cursor: pointer;
        user-select: none;
      }
      th:hover {
        background-color: var(--color-bg-tertiary, #472e2e);
      }
      th.sort-asc::after {
        content: ' ▲';
        font-size: 0.7em;
        opacity: 0.6;
      }
      th.sort-desc::after {
        content: ' ▼';
        font-size: 0.7em;
        opacity: 0.6;
      }
      tbody tr {
        transition: background-color 0.15s;
      }
      tbody tr:hover {
        background-color: var(--color-bg-hover, #f5f5f5);
      }
      tbody tr.archive {
        color: var(--color-text-secondary, #777);
      }
      tbody tr.archive:hover {
        background-color: var(--color-bg-hover, #f5f5f5);
      }
      th:nth-child(1), td:nth-child(1) { width: 15%; }
      th:nth-child(2), td:nth-child(2) { width: 15%; }
      th:nth-child(3), td:nth-child(3) { width: 30%; }
      th:nth-child(4), td:nth-child(4) { width: 20%; }
      th:nth-child(5), td:nth-child(5) { width: 10%; }
      th:nth-child(6), td:nth-child(6) { width: 5%; }
      th:nth-child(7), td:nth-child(7) { width: 5%; }
      .loading-indicator {
        display: none;
        padding: 20px 30px;
        text-align: center;
        font-size: 18px;
        font-weight: 500;
        color: var(--color-primary, #4285f4);
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: rgba(255, 255, 255, 0.95);
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        min-width: 180px;
        animation: pulse 1.5s infinite ease-in-out;
      }
      @keyframes pulse {
        0% { opacity: 0.8; }
        50% { opacity: 1; }
        100% { opacity: 0.8; }
      }
      .loading-indicator.active {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
      .loading-indicator::before {
        content: "";
        display: block;
        width: 40px;
        height: 40px;
        margin-bottom: 10px;
        border-radius: 50%;
        border: 4px solid var(--color-primary, #4285f4);
        border-top-color: transparent;
        animation: spinner 1s infinite linear;
      }
      @keyframes spinner {
        to { transform: rotate(360deg); }
      }
      .loading-indicator.error {
        color: var(--color-error, #d32f2f);
        animation: none;
      }
      .loading-indicator.error::before {
        content: "⚠️";
        border: none;
        font-size: 24px;
        animation: none;
      }
      #scroll-observer {
        height: 10px;
        width: 100%;
        margin-bottom: 40px;
      }
      .pagination-footer {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background-color: var(--color-bg-primary, #fff);
        box-shadow: 0 -1px 3px rgba(0, 0, 0, 0.1);
        padding: 8px 0;
        z-index: 100;
      }
      .pagination {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 12px;
        font-size: 14px;
      }
      .page-numbers {
        display: flex;
        gap: 5px;
        margin: 0 8px;
      }
      .page-number {
        display: inline-block;
        min-width: 30px;
        height: 30px;
        line-height: 30px;
        text-align: center;
        border-radius: 4px;
        cursor: pointer;
        margin: 0 2px;
        user-select: none;
        transition: all 0.2s;
      }
      .page-number:hover {
        background-color: var(--color-bg-hover, #f5f5f5);
      }
      .page-number.active {
        background-color: var(--color-primary, #4285f4);
        color: white;
        font-weight: bold;
      }
      .page-number.disabled {
        cursor: default;
        opacity: 0.5;
      }
      .page-number.ellipsis {
        cursor: default;
      }
      .page-number.ellipsis:hover {
        background-color: transparent;
      }
      button {
        padding: 5px 14px;
        background-color: var(--color-primary, #4285f4);
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 13px;
        transition: all 0.2s;
        min-width: 70px;
      }
      button:disabled {
        opacity: 0.4;
        cursor: not-allowed;
        background-color: var(--color-bg-secondary, #777);
      }
      button:hover:not(:disabled) {
        background-color: var(--color-primary-dark, #3367d6);
      }
      #total-count {
        color: var(--color-primary, #4285f4);
        font-weight: 600;
      }
      #page-info {
        min-width: 100px;
        text-align: center;
      }
      @media (max-width: 768px) {
        .flay-list-wrapper {
          padding: 5px;
        }
        .control-panel .filter {
          flex-direction: column;
          align-items: flex-start;
          gap: 5px;
        }
        .control-panel .filter #search-input {
          width: 100%;
        }
        .flay-list {
          font-size: 13px;
        }
        th, td {
          padding: 6px 8px;
        }
        th:nth-child(3), td:nth-child(3) { width: 40%; }
        th:nth-child(4), td:nth-child(4) { width: 15%; }
      }
      @media (prefers-color-scheme: dark) {
        .pagination-footer {
          background-color: var(--color-bg-primary, #1e1e1e);
          box-shadow: 0 -1px 3px rgba(0, 0, 0, 0.3);
        }
      }
    `;

    // Shadow DOM에 스타일 추가
    this.shadowRoot.appendChild(this.#styleSheet);

    // 템플릿 사용하여 컴포넌트 내용 추가
    const template = FlayAll.#createTemplate();
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    // 초기 로딩 상태 표시
    this.showLoading(true);
  }

  /**
   * 이벤트 리스너 초기화
   */
  #initializeEventListeners() {
    // 페이지네이션 버튼 및 이벤트 위임 설정
    const paginationControl = this.shadowRoot.querySelector('.pagination');
    paginationControl.addEventListener('click', (e) => {
      if (e.target.id === 'prev-page') {
        this.#handlePrevPage();
      } else if (e.target.id === 'next-page') {
        this.#handleNextPage();
      }
    });

    // 검색 입력 (디바운스 적용)
    const searchInput = this.shadowRoot.querySelector('#search-input');
    searchInput.addEventListener(
      'input',
      this.#debounce((e) => {
        this.#filterAndSort();

        // 검색 이벤트 발생
        this.dispatchEvent(
          new CustomEvent('filter-changed', {
            detail: {
              searchTerm: e.target.value,
              filteredCount: this.#sortedFlayList.length,
              totalCount: this.#flayMap.size,
            },
            bubbles: true,
            composed: true,
          })
        );
      }, 300)
    );

    // 아카이브 체크박스
    const archiveCheckbox = this.shadowRoot.querySelector('#show-archive');
    archiveCheckbox.addEventListener('change', (e) => {
      this.#filterAndSort();
      this.showLoading(false);

      // 필터 변경 이벤트 발생
      this.dispatchEvent(
        new CustomEvent('filter-changed', {
          detail: {
            showArchive: e.target.checked,
            filteredCount: this.#sortedFlayList.length,
            totalCount: this.#flayMap.size,
          },
          bubbles: true,
          composed: true,
        })
      );
    });

    // 정렬 헤더
    const headers = this.shadowRoot.querySelectorAll('th[data-sort]');
    headers.forEach((header, index) => {
      header.addEventListener('click', () => {
        const oldSortField = this.#sortColumn;
        const oldSortDirection = this.#sortDirection;

        this.#handleSort(header, index);

        // 정렬 변경 이벤트 발생
        const sortFields = ['studio', 'opus', 'title', 'actressList', 'release', 'rank', 'score'];
        this.dispatchEvent(
          new CustomEvent('sort-changed', {
            detail: {
              field: sortFields[this.#sortColumn],
              direction: this.#sortDirection === 1 ? 'asc' : 'desc',
              oldField: sortFields[oldSortField],
              oldDirection: oldSortDirection === 1 ? 'asc' : 'desc',
            },
            bubbles: true,
            composed: true,
          })
        );
      });
    });

    // 초기 정렬 표시
    headers[this.#sortColumn].classList.add(this.#sortDirection === 1 ? 'sort-asc' : 'sort-desc');

    // 테이블 행 선택을 위한 이벤트 위임
    const table = this.shadowRoot.querySelector('.flay-list');
    table.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.tagName === 'TR') {
        const opus = e.target.dataset.opus;
        if (opus) {
          this.dispatchEvent(
            new CustomEvent('flay-selected', {
              detail: {
                opus,
                flay: Array.from(this.#flayMap.values()).find((f) => f.opus === opus),
              },
              bubbles: true,
              composed: true,
            })
          );
        }
      }
    });

    // 무한 스크롤
    this.#setupInfiniteScroll();
  }

  /**
   * 이벤트 리스너 제거
   */
  #removeEventListeners() {
    // IntersectionObserver 정리
    if (this.#observer) {
      this.#observer.disconnect();
      this.#observer = null;
    }
  }

  /**
   * 무한 스크롤 설정
   */
  #setupInfiniteScroll() {
    const observerTarget = this.shadowRoot.querySelector('#scroll-observer');

    this.#observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !this.shadowRoot.querySelector('.loading-indicator').classList.contains('active') && this.#enableInfiniteScroll) {
          if ((this.#currentPage + 1) * FlayAll.PAGE_SIZE < this.#sortedFlayList.length) {
            this.#loadMoreItems();
          }
        }
      },
      { threshold: 0.1 }
    );

    this.#observer.observe(observerTarget);
  }

  /**
   * 이전 페이지 버튼 핸들러
   */
  #handlePrevPage() {
    if (this.#currentPage > 0) {
      this.#currentPage--;
      this.#renderPage();
      // 페이지 이동 후 스크롤을 테이블 상단으로 이동
      this.shadowRoot.querySelector('.flay-list').scrollIntoView({ behavior: 'smooth' });
    }
  }

  /**
   * 다음 페이지 버튼 핸들러
   */
  #handleNextPage() {
    if ((this.#currentPage + 1) * FlayAll.PAGE_SIZE < this.#sortedFlayList.length) {
      this.#currentPage++;
      this.#renderPage();
      // 페이지 이동 후 스크롤을 테이블 상단으로 이동
      this.shadowRoot.querySelector('.flay-list').scrollIntoView({ behavior: 'smooth' });
    }
  }

  /**
   * 정렬 헤더 클릭 핸들러
   */
  #handleSort(header, index) {
    const headers = this.shadowRoot.querySelectorAll('th[data-sort]');
    headers.forEach((h) => h.classList.remove('sort-asc', 'sort-desc'));

    if (this.#sortColumn === index) {
      this.#sortDirection *= -1;
    } else {
      this.#sortColumn = index;
      this.#sortDirection = 1;
    }

    header.classList.add(this.#sortDirection === 1 ? 'sort-asc' : 'sort-desc');

    // 포커스 관리 추가
    header.setAttribute('aria-sort', this.#sortDirection === 1 ? 'ascending' : 'descending');

    this.#filterAndSort();
  }

  /**
   * 데이터 필터링 및 정렬
   */
  #filterAndSort() {
    const searchValue = this.shadowRoot.querySelector('#search-input').value.toLowerCase().trim();
    const showArchive = this.shadowRoot.querySelector('#show-archive').checked;

    // 시작 시간 측정 (성능 모니터링)
    const startTime = performance.now();

    // 필터링
    let filtered = Array.from(this.#flayMap.values()).filter((flay) => {
      if (!showArchive && flay.archive) return false;

      if (searchValue) {
        // 개선된 검색: 정확한 일치, 스타트윗, 각 필드별 검색 등을 구분
        const matchExactOpus = flay.opus?.toLowerCase() === searchValue;

        // 정확한 opus 일치는 최우선으로 포함
        if (matchExactOpus) return true;

        // 그 외 각 필드별 검색어 포함 여부 확인
        return (
          (flay.studio && flay.studio.toLowerCase().includes(searchValue)) ||
          (flay.opus && flay.opus.toLowerCase().includes(searchValue)) ||
          (flay.title && flay.title.toLowerCase().includes(searchValue)) ||
          (flay.actressList && flay.actressList.some((actress) => actress.toLowerCase().includes(searchValue))) ||
          (flay.video && flay.video.rank && String(flay.video.rank).toLowerCase().includes(searchValue)) // rank 검색 추가
          // score는 비동기 로딩이므로, 클라이언트 측 필터링에 포함하기 어려움. 필요시 서버사이드 필터링 고려.
        );
      }
      return true;
    });

    // 정렬
    const sortFields = ['studio', 'opus', 'title', 'actressList', 'release', 'rank', 'score'];
    const field = sortFields[this.#sortColumn];

    filtered.sort((a, b) => {
      let valueA = field === 'rank' ? a.video?.rank : a[field];
      let valueB = field === 'rank' ? b.video?.rank : b[field];

      // score 필드는 비동기 로딩되므로, 초기 정렬 시점에는 flay 객체에 없을 수 있음.
      // score 정렬을 위해서는 score 데이터가 로드된 후에 정렬 로직이 다시 실행되거나,
      // score 데이터를 미리 가져와서 flay 객체에 포함시켜야 함.
      // 여기서는 score가 로드되었다고 가정하고, 없다면 기본값 처리.
      if (field === 'score') {
        valueA = a.score !== undefined ? a.score : -1; // score가 없으면 -1로 간주 (정렬 시 뒤로)
        valueB = b.score !== undefined ? b.score : -1;
      }

      // 문자열 비교
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return this.#sortDirection * valueA.localeCompare(valueB);
      }

      // 숫자 비교
      return this.#sortDirection * (valueA - valueB);
    });

    this.#sortedFlayList = filtered;

    // 종료 시간 측정
    const endTime = performance.now();
    console.debug(`필터링 및 정렬 완료: ${endTime - startTime}ms, ${filtered.length}개 항목`);

    // 카운트 업데이트 및 페이지 리셋
    this.shadowRoot.querySelector('#total-count').textContent = this.#sortedFlayList.length;
    this.#currentPage = 0;

    // 페이지네이션 버튼 상태 업데이트
    this.#updatePaginationButtons();

    // 테이블 다시 렌더링
    this.#renderPage();
  }

  /**
   * 페이지 렌더링
   */
  #renderPage() {
    const tbody = this.shadowRoot.querySelector('.flay-list tbody');
    const startIndex = this.#currentPage * FlayAll.PAGE_SIZE;
    const endIndex = Math.min(startIndex + FlayAll.PAGE_SIZE, this.#sortedFlayList.length);
    const pageItems = this.#sortedFlayList.slice(startIndex, endIndex);

    this.showLoading(true);

    const fragment = document.createDocumentFragment();

    requestAnimationFrame(() => {
      try {
        tbody.innerHTML = '';

        pageItems.forEach((flay) => {
          const tr = document.createElement('tr');
          tr.classList.toggle('archive', flay.archive);
          tr.dataset.opus = flay.opus;
          tr.tabIndex = 0; // Ensure tabIndex for keyboard navigation

          const columnDefinitions = [
            { key: 'studio', data: flay.studio || '' },
            { key: 'opus', data: flay.opus || '', originalOpus: flay.opus },
            { key: 'title', data: flay.title || '' },
            { key: 'actressList', data: flay.actressList || [] },
            { key: 'release', data: flay.release || '' },
            { key: 'rank', data: flay.video?.rank ?? '' },
          ];

          columnDefinitions.forEach((colDef) => {
            const td = document.createElement('td');
            if (colDef.key === 'opus') {
              td.textContent = colDef.data;
              if (colDef.originalOpus) {
                td.style.cursor = 'pointer';
                td.addEventListener('click', (e) => {
                  e.stopPropagation(); // Prevent row click event from firing
                  popupFlay(colDef.originalOpus);
                });
              }
            } else if (colDef.key === 'actressList') {
              const actresses = Array.isArray(colDef.data) ? colDef.data : [];
              if (actresses.length > 0) {
                actresses.forEach((actressName, i) => {
                  const span = document.createElement('span');
                  span.textContent = actressName;
                  span.style.cursor = 'pointer';
                  span.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent row click event from firing
                    popupActress(actressName);
                  });
                  td.appendChild(span);
                  if (i < actresses.length - 1) {
                    td.appendChild(document.createTextNode(', '));
                  }
                });
              } else {
                td.textContent = ''; // Handle empty actress list
              }
            } else {
              td.textContent = colDef.data;
            }
            tr.appendChild(td);
          });

          // Score 셀 추가 (비동기 로딩)
          const scoreTd = document.createElement('td');
          tr.appendChild(scoreTd);
          if (flay.opus) {
            scoreTd.textContent = '...'; // 로딩 중 표시
            FlayFetch.getScore(flay.opus)
              .then((score) => {
                scoreTd.textContent = score ?? '';
                flay.score = score;
              })
              .catch((error) => {
                console.error(`Error fetching score for ${flay.opus}:`, error);
                scoreTd.textContent = 'N/A';
              });
          } else {
            scoreTd.textContent = 'N/A';
          }

          // 행에 클릭 이벤트 추가 (flay-selected 이벤트 발생용)
          tr.addEventListener('click', (e) => {
            // This event is for general row selection, specific clicks on opus/actress are handled above.
            this.dispatchEvent(
              new CustomEvent('flay-selected', {
                detail: { opus: flay.opus, flay: flay },
                bubbles: true,
                composed: true,
              })
            );
          });

          fragment.appendChild(tr);
        });

        tbody.appendChild(fragment);

        this.#updatePaginationButtons();

        const totalPages = Math.ceil(this.#sortedFlayList.length / FlayAll.PAGE_SIZE);
        this.dispatchEvent(
          new CustomEvent('page-changed', {
            detail: {
              currentPage: this.#currentPage + 1,
              totalPages: Math.max(1, totalPages),
              itemCount: pageItems.length,
              totalItems: this.#sortedFlayList.length,
            },
            bubbles: true,
            composed: true,
          })
        );
      } finally {
        this.showLoading(false);
      }
    });
  }

  /**
   * 추가 아이템 로드 (무한 스크롤)
   */
  #loadMoreItems() {
    this.#currentPage++;
    this.#renderPage();
  }

  /**
   * 페이지네이션 버튼 상태 업데이트
   */
  #updatePaginationButtons() {
    const prevButton = this.shadowRoot.querySelector('#prev-page');
    const nextButton = this.shadowRoot.querySelector('#next-page');
    const pageNumbersContainer = this.shadowRoot.querySelector('#page-numbers');
    const totalPages = Math.ceil(this.#sortedFlayList.length / FlayAll.PAGE_SIZE);
    const currentPage = this.#currentPage + 1; // 1-based for display

    // 이전 버튼 상태 설정
    prevButton.disabled = this.#currentPage === 0;

    // 다음 버튼 상태 설정
    nextButton.disabled = this.#currentPage >= totalPages - 1 || this.#sortedFlayList.length === 0;

    // 페이지 번호 생성
    pageNumbersContainer.innerHTML = '';

    // 최대 표시할 페이지 번호 수
    const maxPageButtons = 5;

    // 페이지 번호 생성 로직
    if (totalPages <= maxPageButtons) {
      // 전체 페이지가 maxPageButtons 이하인 경우, 모든 페이지 번호 표시
      for (let i = 1; i <= totalPages; i++) {
        this.#createPageNumberButton(pageNumbersContainer, i, currentPage);
      }
    } else {
      // 페이지가 많은 경우, 현재 페이지 주변과 처음/마지막 페이지 표시

      // 항상 첫 페이지 표시
      this.#createPageNumberButton(pageNumbersContainer, 1, currentPage);

      // 현재 페이지가 4 이상인 경우 ... 표시
      if (currentPage > 3) {
        const ellipsis = document.createElement('div');
        ellipsis.className = 'page-number ellipsis';
        ellipsis.textContent = '...';
        pageNumbersContainer.appendChild(ellipsis);
      }

      // 현재 페이지 주변 표시 (현재 페이지 ± 1)
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);

      for (let i = startPage; i <= endPage; i++) {
        this.#createPageNumberButton(pageNumbersContainer, i, currentPage);
      }

      // 현재 페이지가 totalPages-3 이하인 경우 ... 표시
      if (currentPage < totalPages - 2) {
        const ellipsis = document.createElement('div');
        ellipsis.className = 'page-number ellipsis';
        ellipsis.textContent = '...';
        pageNumbersContainer.appendChild(ellipsis);
      }

      // 항상 마지막 페이지 표시
      if (totalPages > 1) {
        this.#createPageNumberButton(pageNumbersContainer, totalPages, currentPage);
      }
    }
  }

  /**
   * 페이지 번호 버튼 생성 헬퍼 함수
   * @param {HTMLElement} container - 페이지 번호를 추가할 컨테이너
   * @param {number} pageNumber - 페이지 번호
   * @param {number} currentPage - 현재 페이지
   */
  #createPageNumberButton(container, pageNumber, currentPage) {
    const pageButton = document.createElement('div');
    pageButton.className = 'page-number';
    pageButton.textContent = pageNumber;

    if (pageNumber === currentPage) {
      pageButton.classList.add('active');
    } else {
      pageButton.addEventListener('click', () => {
        this.goToPage(pageNumber);
      });
    }

    container.appendChild(pageButton);
  }

  /**
   * 데이터 로드
   */
  async #loadData() {
    try {
      this.showLoading(true);

      // 데이터 불러오기
      const [flayAll, archiveAll] = await Promise.all([FlayFetch.getFlayAll(), FlayFetch.getArchiveAll()]);

      // 중복 검사하여 합치기
      this.#flayMap = new Map(flayAll.map((flay) => [flay.opus, flay]));
      let duplicateCount = 0;

      archiveAll.forEach((archive) => {
        if (this.#flayMap.has(archive.opus)) {
          duplicateCount++;
          console.log(`%c중복된 opus 발견: ${archive.opus}`, 'color: red;');
        } else {
          this.#flayMap.set(archive.opus, archive);
        }
      });

      if (duplicateCount > 0) {
        console.warn(`총 ${duplicateCount}개의 중복 항목이 발견되었습니다.`);
      }

      // 초기 필터링 및 정렬
      this.#filterAndSort();

      // 로딩 인디케이터 숨기기
      this.showLoading(false);

      // 커스텀 이벤트 발생
      this.dispatchEvent(
        new CustomEvent('data-loaded', {
          detail: {
            count: this.#flayMap.size,
            flayCount: flayAll.length,
            archiveCount: archiveAll.length,
            duplicateCount,
          },
          bubbles: true,
          composed: true,
        })
      );
    } catch (error) {
      console.error('데이터 로딩 중 오류 발생:', error);
      const loadingIndicator = this.shadowRoot.querySelector('.loading-indicator');
      if (loadingIndicator) {
        loadingIndicator.textContent = '데이터를 불러오는 중 오류가 발생했습니다.';
        loadingIndicator.classList.add('error');
        loadingIndicator.classList.remove('active'); // 'active' 클래스 제거 추가
      }

      // 에러 이벤트 발생
      this.dispatchEvent(
        new CustomEvent('data-error', {
          detail: { error },
          bubbles: true,
          composed: true,
        })
      );
    }
  }
  /**
   * 다음과 같은 공개 API 메서드 추가
   */

  /**
   * 무한 스크롤 활성화/비활성화
   * @param {boolean} enabled - 무한 스크롤 활성화 여부
   */
  setInfiniteScroll(enabled) {
    this.#enableInfiniteScroll = enabled;
  }

  /**
   * 데이터 다시 로드
   * @returns {Promise<void>}
   */
  async refresh() {
    // 캐시 비우기
    await FlayFetch.clearAll();
    // 데이터 다시 로드
    return this.#loadData();
  }

  /**
   * 지정된 페이지로 이동
   * @param {number} pageNumber - 이동할 페이지 번호 (1부터 시작)
   */
  goToPage(pageNumber) {
    if (pageNumber < 1) pageNumber = 1;

    const totalPages = Math.ceil(this.#sortedFlayList.length / FlayAll.PAGE_SIZE);
    if (pageNumber > totalPages) pageNumber = totalPages;

    this.#currentPage = pageNumber - 1;
    this.#renderPage();
    // 스크롤을 테이블 상단으로 이동
    this.shadowRoot.querySelector('.flay-list').scrollIntoView({ behavior: 'smooth' });
  }

  /**
   * 특정 Opus로 검색하고 해당 항목이 있는 페이지로 이동
   * @param {string} opus - 검색할 Opus 번호
   * @returns {boolean} - 검색 성공 여부
   */
  findByOpus(opus) {
    const index = this.#sortedFlayList.findIndex((flay) => flay.opus === opus);
    if (index === -1) return false;

    const pageNumber = Math.floor(index / FlayAll.PAGE_SIZE) + 1;
    this.goToPage(pageNumber);

    // 해당 행 강조 표시
    requestAnimationFrame(() => {
      const rows = this.shadowRoot.querySelectorAll('tbody tr');
      for (const row of rows) {
        row.classList.remove('highlight');
        if (row.dataset.opus === opus) {
          row.classList.add('highlight');
          row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    });

    return true;
  }

  /**
   * 로딩 인디케이터 표시/숨김
   * @param {boolean} isLoading - 로딩 중 여부
   */
  showLoading(isLoading) {
    const loadingIndicator = this.shadowRoot.querySelector('.loading-indicator');
    if (loadingIndicator) {
      if (isLoading) {
        loadingIndicator.classList.add('active');
      } else {
        loadingIndicator.classList.remove('active');
      }
    } else {
      console.warn('FlayAll: loadingIndicator element not found in showLoading method.');
    }
  }

  /**
   * 디바운스 함수: 연속적인 이벤트 호출 제한
   * @param {Function} func - 실행할 함수
   * @param {number} wait - 지연 시간 (ms)
   * @returns {Function}
   */
  #debounce(func, wait) {
    let timeout;
    return function () {
      const context = this,
        args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        func.apply(context, args);
      }, wait);
    };
  }
}

// 커스텀 엘리먼트 등록
customElements.define('flay-all', FlayAll);
