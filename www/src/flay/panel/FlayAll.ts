import GroundFlay from '@base/GroundFlay';
import FlayFetch, { Flay } from '@lib/FlayFetch';
import { popupActress, popupFlay } from '@lib/FlaySearch';
import FlayStorage from '@lib/FlayStorage';
import './FlayAll.scss';

/**
 * FlayAll - 플레이 목록을 표시하는 커스텀 엘리먼트
 * 20,000개 이상의 레코드를 효율적으로 표시하고 필터링, 정렬, 페이지네이션 기능을 제공합니다.
 * 필터 및 정렬 상태는 localStorage에 자동으로 저장되어 페이지를 새로고침해도 유지됩니다.
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
export class FlayAll extends GroundFlay {
  // 상수 및 클래스 변수 정의
  static PAGE_SIZE = 100; // 한 번에 표시할 항목 수

  // localStorage 키 상수
  static STORAGE_KEYS = {
    SEARCH_TERM: 'flayAll.filter.searchTerm',
    SELECTED_RANKS: 'flayAll.filter.selectedRanks',
    SHOW_ARCHIVE: 'flayAll.filter.showArchive',
    SORT_COLUMN: 'flayAll.sort.column',
    SORT_DIRECTION: 'flayAll.sort.direction',
  } as const;

  // 클래스 필드 정의
  #currentPage = 0;
  #sortedFlayList: Flay[] = [];
  #sortColumn = 4; // 기본 정렬 컬럼 (발매일)
  #sortDirection = -1; // 기본 내림차순
  #observer: IntersectionObserver | null = null;
  #enableInfiniteScroll = false;
  #flayMap = new Map<string, Flay>();

  /**
   * Called when the element is connected to the DOM.
   */
  connectedCallback() {
    this.#render();
    this.#restoreFilterState();
    this.#initializeEventListeners();
    this.#loadData().catch((error) => {
      console.error('Error loading data:', error);
    });
  }

  /**
   * Called when the element's attributes are changed.
   *
   * @param name Name of the changed attribute
   * @param oldValue Previous value
   * @param newValue New value
   */
  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === 'page-size' && oldValue !== newValue) {
      const pageSize = parseInt(newValue, 10);
      if (!isNaN(pageSize) && pageSize > 0) {
        // pageSize 변경 처리
        FlayAll.PAGE_SIZE = pageSize;
        this.#currentPage = 0;
        this.#renderPage();
      }
    }
  }

  /**
   * Returns the list of attributes to observe.
   *
   * @returns {string[]} Array of attributes to observe
   */
  static get observedAttributes() {
    return ['page-size'];
  }

  /**
   * Called when the element is removed from the DOM.
   */
  disconnectedCallback() {
    this.#removeEventListeners();
  }

  // Template creation - defines the HTML structure of the component
  static #createTemplate() {
    const template = document.createElement('template');
    template.innerHTML = `
      <div class="flay-list-wrapper">
        <div class="control-panel">
          <slot name="filter-controls">
            <div class="filter">
              <div class="filter-group">
                <input type="text" id="search-input" placeholder="Enter search term..." />
              </div>
              <div class="filter-group">
                <label>Rank:</label>
                <input type="checkbox" id="rank-0" value="0" /><label for="rank-0">0</label>
                <input type="checkbox" id="rank-1" value="1" /><label for="rank-1">1</label>
                <input type="checkbox" id="rank-2" value="2" /><label for="rank-2">2</label>
                <input type="checkbox" id="rank-3" value="3" /><label for="rank-3">3</label>
                <input type="checkbox" id="rank-4" value="4" /><label for="rank-4">4</label>
                <input type="checkbox" id="rank-5" value="5" /><label for="rank-5">5</label>
              </div>
              <div class="filter-group">
                <input type="checkbox" id="show-archive"><label for="show-archive">Archive</label>
              </div>
            </div>
          </slot>
          <slot name="total-display">
            <div class="total-display">
              Total <strong id="total-count">0</strong> items
            </div>
          </slot>
        </div>

        <slot name="table">
          <table class="flay-list">
            <thead>
              <tr>
                <th data-sort="studio">Studio</th>
                <th data-sort="opus">Opus</th>
                <th data-sort="title">Title</th>
                <th data-sort="actressList">Actress</th>
                <th data-sort="release">Release</th>
                <th data-sort="rank">Rank</th>
                <th data-sort="likes">Likes</th>
                <th data-sort="score">Score</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </slot>

        <div class="loading-indicator">Loading data...</div>
        <div id="scroll-observer"></div>

        <footer class="pagination-footer">
          <slot name="pagination">
            <div class="pagination">
              <button id="prev-page" disabled>Prev</button>
              <div class="page-numbers" id="page-numbers"></div>
              <button id="next-page">Next</button>
            </div>
          </slot>
        </footer>
      </div>
    `;
    return template;
  }

  /**
   * Initial rendering
   */
  #render() {
    // 템플릿 사용하여 컴포넌트 내용 추가
    const template = FlayAll.#createTemplate();
    this.appendChild(template.content.cloneNode(true));

    // 초기 로딩 상태 표시
    this.showLoading(true);
  }

  /**
   * 이벤트 리스너 초기화
   */
  #initializeEventListeners() {
    // 페이지네이션 버튼 및 이벤트 위임 설정
    const paginationControl = this.querySelector('.pagination')!;
    paginationControl.addEventListener('click', (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.id === 'prev-page') {
        this.#handlePrevPage();
      } else if (target.id === 'next-page') {
        this.#handleNextPage();
      }
    });

    // 검색 입력 (디바운스 적용)
    const searchInput = this.querySelector('#search-input')!;
    searchInput.addEventListener(
      'input',
      this.#debounce((e: Event) => {
        this.#saveFilterState(); // 필터 상태 저장
        this.#filterAndSort();

        // 검색 이벤트 발생
        this.dispatchEvent(
          new CustomEvent('filter-changed', {
            detail: {
              searchTerm: (e.target as HTMLInputElement).value,
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
    const archiveCheckbox = this.querySelector('#show-archive')!;
    archiveCheckbox.addEventListener('change', (e: Event) => {
      this.#saveFilterState(); // 필터 상태 저장
      this.#filterAndSort();
      this.showLoading(false);

      // 필터 변경 이벤트 발생
      this.dispatchEvent(
        new CustomEvent('filter-changed', {
          detail: {
            showArchive: (e.target as HTMLInputElement).checked,
            filteredCount: this.#sortedFlayList.length,
            totalCount: this.#flayMap.size,
          },
          bubbles: true,
          composed: true,
        })
      );
    });

    // rank 필터 체크박스들
    const rankCheckboxes = this.querySelectorAll('input[id^="rank-"]');
    rankCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener('change', () => {
        this.#saveFilterState(); // 필터 상태 저장
        this.#filterAndSort();

        // 선택된 rank 값들 수집
        const selectedRanks: number[] = [];
        rankCheckboxes.forEach((cb) => {
          const cbElement = cb as HTMLInputElement;
          if (cbElement.checked) {
            selectedRanks.push(parseInt(cbElement.value, 10));
          }
        });

        // 필터 변경 이벤트 발생
        this.dispatchEvent(
          new CustomEvent('filter-changed', {
            detail: {
              selectedRanks: selectedRanks,
              filteredCount: this.#sortedFlayList.length,
              totalCount: this.#flayMap.size,
            },
            bubbles: true,
            composed: true,
          })
        );
      });
    });

    // 정렬 헤더
    const headers = this.querySelectorAll('th[data-sort]');
    headers.forEach((header, index) => {
      header.addEventListener('click', () => {
        const oldSortField = this.#sortColumn;
        const oldSortDirection = this.#sortDirection;

        this.#handleSort(header as HTMLElement, index);

        // 정렬 변경 이벤트 발생
        const sortFields = ['studio', 'opus', 'title', 'actressList', 'release', 'rank', 'likes', 'score'];
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

    // 초기 정렬 표시 (복원된 상태 반영)
    headers[this.#sortColumn]!.classList.add(this.#sortDirection === 1 ? 'sort-asc' : 'sort-desc');

    // 테이블 행 선택을 위한 이벤트 위임
    const table = this.querySelector('.flay-list')!;
    table.addEventListener('keydown', (e: Event) => {
      const keyboardEvent = e as KeyboardEvent;
      const target = keyboardEvent.target as HTMLElement;
      if (keyboardEvent.key === 'Enter' && target.tagName === 'TR') {
        const opus = (target as HTMLTableRowElement).dataset['opus'];
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
    const observerTarget = this.querySelector('#scroll-observer');
    if (!observerTarget) return;

    this.#observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !this.querySelector('.loading-indicator')!.classList.contains('active') && this.#enableInfiniteScroll) {
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
      this.querySelector('.flay-list')?.scrollIntoView({ behavior: 'smooth' });
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
      this.querySelector('.flay-list')?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  /**
   * 정렬 헤더 클릭 핸들러
   */
  #handleSort(header: HTMLElement, index: number) {
    const headers = this.querySelectorAll('th[data-sort]');
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

    this.#saveFilterState(); // 정렬 상태 저장
    this.#filterAndSort();
  }

  /**
   * 데이터 필터링 및 정렬
   */
  #filterAndSort() {
    const searchValue = (this.querySelector('#search-input') as HTMLInputElement).value.toLowerCase().trim();
    const showArchive = (this.querySelector('#show-archive') as HTMLInputElement).checked;

    // 선택된 rank 값들 수집
    const selectedRanks: number[] = [];
    const rankCheckboxes = this.querySelectorAll('input[id^="rank-"]');
    rankCheckboxes.forEach((checkbox) => {
      const cbElement = checkbox as HTMLInputElement;
      if (cbElement.checked) {
        selectedRanks.push(parseInt(cbElement.value, 10));
      }
    });

    // 시작 시간 측정 (성능 모니터링)
    const startTime = performance.now();

    // 필터링
    const filtered = Array.from(this.#flayMap.values()).filter((flay) => {
      if (!showArchive && flay.archive) return false;

      // rank 필터 적용 - 선택된 rank가 있을 때만 필터링
      if (selectedRanks.length > 0) {
        const flayRank = flay.video?.rank ?? null;
        if (flayRank === null || !selectedRanks.includes(flayRank)) return false;
      }

      if (searchValue) {
        // 개선된 검색: 정확한 일치, 스타트윗, 각 필드별 검색 등을 구분
        const matchExactOpus = flay.opus?.toLowerCase() === searchValue;

        // 정확한 opus 일치는 최우선으로 포함
        if (matchExactOpus) return true;

        // 그 외 각 필드별 검색어 포함 여부 확인
        return (
          flay.studio?.toLowerCase().includes(searchValue) ||
          flay.opus?.toLowerCase().includes(searchValue) ||
          flay.title?.toLowerCase().includes(searchValue) ||
          flay.actressList?.some((actress) => actress.toLowerCase().includes(searchValue)) ||
          (flay.video?.rank && String(flay.video.rank).toLowerCase().includes(searchValue)) || // rank 검색 추가
          (flay.score && String(flay.score).toLowerCase().includes(searchValue)) // score 검색 추가
        );
      }
      return true;
    });

    // 정렬
    const sortFields = ['studio', 'opus', 'title', 'actressList', 'release', 'rank', 'likes', 'score'];
    const field = sortFields[this.#sortColumn];

    filtered.sort((a, b) => {
      const valueA: unknown = field === 'rank' ? a.video?.rank : field === 'likes' ? a.video?.likes?.length || 0 : field === 'score' ? a.score : (a as unknown as Record<string, unknown>)[field!];
      const valueB: unknown = field === 'rank' ? b.video?.rank : field === 'likes' ? b.video?.likes?.length || 0 : field === 'score' ? b.score : (b as unknown as Record<string, unknown>)[field!];

      // actressList 배열 정렬 처리
      if (field === 'actressList') {
        const arrayA = Array.isArray(valueA) ? valueA : [];
        const arrayB = Array.isArray(valueB) ? valueB : [];

        // 첫 번째 배우 이름으로 정렬, 배열이 비어있으면 빈 문자열로 처리
        const firstActressA = arrayA.length > 0 ? String(arrayA[0]).toLowerCase() : '';
        const firstActressB = arrayB.length > 0 ? String(arrayB[0]).toLowerCase() : '';

        return this.#sortDirection * firstActressA.localeCompare(firstActressB);
      }

      // 문자열 비교
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return this.#sortDirection * valueA.localeCompare(valueB);
      }

      // 숫자 비교
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return this.#sortDirection * (valueA - valueB);
      }

      // 기본값 처리
      return 0;
    });

    this.#sortedFlayList = filtered;

    // 종료 시간 측정
    const endTime = performance.now();
    console.debug(`Filtering and sorting completed: ${endTime - startTime}ms, ${filtered.length} items`);

    // 카운트 업데이트 및 페이지 리셋
    this.querySelector('#total-count')!.textContent = String(this.#sortedFlayList.length);
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
    const startIndex = this.#currentPage * FlayAll.PAGE_SIZE;
    const endIndex = Math.min(startIndex + FlayAll.PAGE_SIZE, this.#sortedFlayList.length);
    const pageItems = this.#sortedFlayList.slice(startIndex, endIndex);

    this.showLoading(true);

    const fragment = document.createDocumentFragment();

    requestAnimationFrame(() => {
      try {
        const tbody = this.querySelector('.flay-list tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        pageItems.forEach((flay) => {
          const tr = document.createElement('tr');
          tr.classList.toggle('archive', flay.archive);
          tr.dataset['opus'] = flay['opus'];
          tr.tabIndex = 0; // Ensure tabIndex for keyboard navigation

          const columnDefinitions = [
            { key: 'studio', data: flay.studio || '' },
            { key: 'opus', data: flay.opus || '', originalOpus: flay.opus },
            { key: 'title', data: flay.title || '' },
            { key: 'actressList', data: flay.actressList || [] },
            { key: 'release', data: flay.release || '' },
            { key: 'rank', data: flay.video?.rank ?? '' },
            { key: 'likes', data: flay.video?.likes?.length ?? 0 },
          ];

          columnDefinitions.forEach((colDef) => {
            const td = document.createElement('td');
            if (colDef.key === 'opus') {
              td.textContent = String(colDef.data);
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
              td.textContent = String(colDef.data);
            }
            tr.appendChild(td);
          });

          // Score 셀 추가 (이미 로드된 score 사용)
          const scoreTd = document.createElement('td');
          scoreTd.textContent = String(flay.score ?? '');
          tr.appendChild(scoreTd);

          // 행에 클릭 이벤트 추가 (flay-selected 이벤트 발생용)
          tr.addEventListener('click', () => {
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
    const prevButton = this.querySelector('#prev-page') as HTMLButtonElement;
    const nextButton = this.querySelector('#next-page') as HTMLButtonElement;
    const totalPages = Math.ceil(this.#sortedFlayList.length / FlayAll.PAGE_SIZE);
    const currentPage = this.#currentPage + 1; // 1-based for display

    // 이전 버튼 상태 설정
    prevButton.disabled = this.#currentPage === 0;

    // 다음 버튼 상태 설정
    nextButton.disabled = this.#currentPage >= totalPages - 1 || this.#sortedFlayList.length === 0;

    // 페이지 번호 생성
    const pageNumbersContainer = this.querySelector('#page-numbers') as HTMLElement;
    if (!pageNumbersContainer) return;

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
  #createPageNumberButton(container: HTMLElement, pageNumber: number, currentPage: number) {
    const pageButton = document.createElement('div');
    pageButton.className = 'page-number';
    pageButton.textContent = String(pageNumber);

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
      const [flayAll, archiveAll, flayScores] = await Promise.all([FlayFetch.getFlayAll(), FlayFetch.getArchiveAll(), FlayFetch.getFlayScores()]);
      console.log(`FlayAll: Loaded ${flayAll.length} flay items, ${archiveAll.length} archive items, ${flayScores.size} score entries.`);

      // 중복 검사하여 합치기
      this.#flayMap = new Map(flayAll.map((flay) => [flay.opus, flay]));
      let duplicateCount = 0;

      archiveAll.forEach((archive) => {
        if (this.#flayMap.has(archive.opus)) {
          duplicateCount++;
          console.log(`%cDuplicate opus found: ${archive.opus}`, 'color: red;');
        } else {
          this.#flayMap.set(archive.opus, archive);
        }
      });

      if (duplicateCount > 0) {
        console.warn(`Total ${duplicateCount} duplicate items found.`);
      }

      this.#flayMap.forEach((flay) => {
        flay.score = flayScores.get(flay.opus) ?? -1;
      });

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
      console.error('Error loading data:', error);
      const loadingIndicator = this.querySelector('.loading-indicator');
      if (loadingIndicator) {
        loadingIndicator.textContent = 'Error occurred while loading data.';
        loadingIndicator.classList.add('error');
        loadingIndicator.classList.remove('active'); // Remove 'active' class
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
   * 다음과 같은 공개 API 메서드 제공
   */

  /**
   * 무한 스크롤 활성화/비활성화
   * @param {boolean} enabled - 무한 스크롤 활성화 여부
   */
  setInfiniteScroll(enabled: boolean) {
    this.#enableInfiniteScroll = enabled;
  }

  /**
   * 데이터 다시 로드
   * @returns {Promise<void>} 데이터 로드 완료 Promise
   */
  refresh() {
    // 캐시 비우기
    FlayFetch.clearAll();
    // 데이터 다시 로드
    return this.#loadData();
  }

  /**
   * 지정된 페이지로 이동
   * @param {number} pageNumber - 이동할 페이지 번호 (1부터 시작)
   */
  goToPage(pageNumber: number) {
    if (pageNumber < 1) pageNumber = 1;

    const totalPages = Math.ceil(this.#sortedFlayList.length / FlayAll.PAGE_SIZE);
    if (pageNumber > totalPages) pageNumber = totalPages;

    this.#currentPage = pageNumber - 1;
    this.#renderPage();
    // 스크롤을 테이블 상단으로 이동
    this.querySelector('.flay-list')?.scrollIntoView({ behavior: 'smooth' });
  }

  /**
   * 필터 상태를 초기화합니다.
   * UI 상태와 localStorage에 저장된 필터 정보를 모두 초기화합니다.
   */
  clearFilters() {
    // UI 상태 초기화
    const searchInput = this.querySelector('#search-input') as HTMLInputElement;
    if (searchInput) {
      searchInput.value = '';
    }

    const rankCheckboxes = this.querySelectorAll('input[id^="rank-"]');
    rankCheckboxes.forEach((checkbox) => {
      (checkbox as HTMLInputElement).checked = false;
    });

    const archiveCheckbox = this.querySelector('#show-archive') as HTMLInputElement;
    if (archiveCheckbox) {
      archiveCheckbox.checked = false;
    }

    // 정렬 상태 초기화
    this.#sortColumn = 4; // 기본값으로 복원
    this.#sortDirection = -1; // 기본값으로 복원

    const headers = this.querySelectorAll('th[data-sort]');
    headers.forEach((h) => h.classList.remove('sort-asc', 'sort-desc'));
    headers[this.#sortColumn]!.classList.add('sort-desc');

    // localStorage에서 필터 상태 제거
    Object.values(FlayAll.STORAGE_KEYS).forEach((key) => {
      FlayStorage.local.remove(key);
    });

    // 필터링 및 정렬 다시 실행
    this.#filterAndSort();
  }

  /**
   * 특정 Opus로 검색하고 해당 항목이 있는 페이지로 이동
   * @param opus - 검색할 Opus 번호
   * @returns 검색 성공 여부
   */
  findByOpus(opus: string): boolean {
    const index = this.#sortedFlayList.findIndex((flay) => flay.opus === opus);
    if (index === -1) return false;

    const pageNumber = Math.floor(index / FlayAll.PAGE_SIZE) + 1;
    this.goToPage(pageNumber);

    // 해당 행 강조 표시
    requestAnimationFrame(() => {
      const rows = Array.from(this.querySelectorAll('tbody tr'));
      for (const row of rows) {
        row.classList.remove('highlight');
        const htmlRow = row as HTMLTableRowElement;
        if (htmlRow.dataset['opus'] === opus) {
          row.classList.add('highlight');
          row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    });

    return true;
  }

  /**
   * 로딩 인디케이터 표시/숨김
   * @param isLoading - 로딩 중 여부
   */
  showLoading(isLoading: boolean): void {
    const loadingIndicator = this.querySelector('.loading-indicator');
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
   * 필터 상태를 localStorage에서 복원합니다.
   */
  #restoreFilterState() {
    // 검색어 복원
    const searchTerm = FlayStorage.local.get(FlayAll.STORAGE_KEYS.SEARCH_TERM);
    if (searchTerm) {
      const searchInput = this.querySelector('#search-input') as HTMLInputElement;
      if (searchInput) {
        searchInput.value = searchTerm;
      }
    }

    // 선택된 rank 복원
    const selectedRanks = FlayStorage.local.getArray(FlayAll.STORAGE_KEYS.SELECTED_RANKS);
    selectedRanks.forEach((rank) => {
      const checkbox = this.querySelector(`#rank-${rank}`) as HTMLInputElement;
      if (checkbox) {
        checkbox.checked = true;
      }
    });

    // archive 체크박스 상태 복원
    const showArchive = FlayStorage.local.getBoolean(FlayAll.STORAGE_KEYS.SHOW_ARCHIVE);
    const archiveCheckbox = this.querySelector('#show-archive') as HTMLInputElement;
    if (archiveCheckbox) {
      archiveCheckbox.checked = showArchive;
    }

    // 정렬 상태 복원
    const sortColumn = FlayStorage.local.getNumber(FlayAll.STORAGE_KEYS.SORT_COLUMN, 4);
    const sortDirection = FlayStorage.local.getNumber(FlayAll.STORAGE_KEYS.SORT_DIRECTION, -1);
    this.#sortColumn = sortColumn;
    this.#sortDirection = sortDirection;
  }

  /**
   * 필터 상태를 localStorage에 저장합니다.
   */
  #saveFilterState() {
    // 검색어 저장
    const searchInput = this.querySelector('#search-input') as HTMLInputElement;
    if (searchInput) {
      FlayStorage.local.set(FlayAll.STORAGE_KEYS.SEARCH_TERM, searchInput.value);
    }

    // 선택된 rank 저장
    const selectedRanks: string[] = [];
    const rankCheckboxes = this.querySelectorAll('input[id^="rank-"]');
    rankCheckboxes.forEach((checkbox) => {
      const cbElement = checkbox as HTMLInputElement;
      if (cbElement.checked) {
        selectedRanks.push(cbElement.value);
      }
    });
    FlayStorage.local.setArray(FlayAll.STORAGE_KEYS.SELECTED_RANKS, selectedRanks);

    // archive 체크박스 상태 저장
    const archiveCheckbox = this.querySelector('#show-archive') as HTMLInputElement;
    if (archiveCheckbox) {
      FlayStorage.local.set(FlayAll.STORAGE_KEYS.SHOW_ARCHIVE, archiveCheckbox.checked ? 'true' : 'false');
    }

    // 정렬 상태 저장
    FlayStorage.local.set(FlayAll.STORAGE_KEYS.SORT_COLUMN, String(this.#sortColumn));
    FlayStorage.local.set(FlayAll.STORAGE_KEYS.SORT_DIRECTION, String(this.#sortDirection));
  }

  /**
   * 디바운스 함수: 연속적인 이벤트 호출 제한
   * @param func - 실행할 함수
   * @param wait - 지연 시간 (ms)
   * @returns 디바운스된 함수
   */
  #debounce(func: Function, wait: number): (...args: unknown[]) => void {
    let timeout: NodeJS.Timeout;
    return function (this: unknown) {
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
