import GroundFlay from '@base/GroundFlay';
import FlayFetch, { Flay } from '@lib/FlayFetch';
import { popupActress, popupFlay } from '@lib/FlaySearch';
import FlayStorage from '@lib/FlayStorage';
import './FlayAll.scss';

/**
 * FlayAll 커스텀 엘리먼트 - 대용량 플레이 목록 관리 컴포넌트
 *
 * 20,000개 이상의 Flay 레코드를 효율적으로 표시하고 관리하는 고성능 웹 컴포넌트입니다.
 * 가상화된 페이지네이션, 실시간 필터링/정렬, 무한 스크롤 기능을 제공하며,
 * 사용자의 필터 및 정렬 설정을 localStorage에 자동으로 저장하여 세션 간 지속성을 보장합니다.
 *
 * @class FlayAll
 * @extends {GroundFlay}
 *
 * @features
 * - 대용량 데이터 처리를 위한 가상화된 렌더링
 * - 실시간 검색, 랭크 필터링, 아카이브 필터링
 * - 다중 컬럼 정렬 (Studio, Opus, Title, Actress, Release, Rank, Likes, Score)
 * - 페이지네이션과 무한 스크롤 모드 지원
 * - localStorage를 통한 필터/정렬 상태 자동 저장/복원
 * - 키보드 네비게이션 및 접근성 지원
 * - 커스텀 이벤트를 통한 외부 통신
 *
 * @example 기본 사용법
 * ```html
 * <flay-all></flay-all>
 * ```
 *
 * @example 슬롯을 활용한 커스터마이징
 * ```html
 * <flay-all>
 *   <div slot="filter-controls">
 *     <input type="text" placeholder="Custom search..." />
 *   </div>
 *   <div slot="total-display">
 *     <span>Total: <strong id="count">0</strong> items</span>
 *   </div>
 * </flay-all>
 * ```
 *
 * @customElement flay-all
 *
 * @slot filter-controls - 필터 컨트롤 영역 (검색, 랭크 필터, 아카이브 토글)
 * @slot total-display - 총 항목 수 표시 영역
 * @slot table - 데이터 테이블 영역
 * @slot pagination - 페이지네이션 컨트롤 영역
 *
 * @fires data-loaded - 데이터 로드 완료 시 발생 ({count, flayCount, archiveCount, duplicateCount})
 * @fires data-error - 데이터 로드 오류 시 발생 ({error})
 * @fires page-changed - 페이지 변경 시 발생 ({currentPage, totalPages, itemCount, totalItems})
 * @fires sort-changed - 정렬 변경 시 발생 ({field, direction, oldField, oldDirection})
 * @fires filter-changed - 필터 변경 시 발생 ({searchTerm?, selectedRanks?, showArchive?, filteredCount, totalCount})
 * @fires flay-selected - 항목 선택 시 발생 ({opus, flay})
 *
 * @since 2024
 * @author CrazyJK
 * @version 1.0.0
 */
export class FlayAll extends GroundFlay {
  // ===== 정적 상수 및 설정 =====
  /** 한 페이지에 표시할 항목 수 */
  static PAGE_SIZE = 100;

  /** localStorage 저장 키 상수 */
  static STORAGE_KEYS = {
    SEARCH_TERM: 'flayAll.filter.searchTerm',
    SELECTED_RANKS: 'flayAll.filter.selectedRanks',
    SHOW_ARCHIVE: 'flayAll.filter.showArchive',
    SORT_COLUMN: 'flayAll.sort.column',
    SORT_DIRECTION: 'flayAll.sort.direction',
  } as const;

  // ===== 인스턴스 필드 =====
  /** 현재 페이지 번호 (0-based) */
  #currentPage = 0;
  /** 필터링/정렬된 Flay 목록 */
  #sortedFlayList: Flay[] = [];
  /** 현재 정렬 컬럼 인덱스 (기본: 4 = 발매일) */
  #sortColumn = 4;
  /** 정렬 방향 (1: 오름차순, -1: 내림차순) */
  #sortDirection = -1;
  /** 무한 스크롤용 IntersectionObserver */
  #observer: IntersectionObserver | null = null;
  /** 무한 스크롤 활성화 여부 */
  #enableInfiniteScroll = false;
  /** 전체 Flay 데이터 맵 (키: opus, 값: Flay) */
  #flayMap = new Map<string, Flay>();

  // ===== Web Component 라이프사이클 =====

  /**
   * DOM에 연결될 때 호출되는 Web Component 라이프사이클 메서드
   * 컴포넌트 초기화, 필터 상태 복원, 이벤트 리스너 등록, 데이터 로드를 순차적으로 실행합니다.
   *
   * @override
   * @memberof FlayAll
   */
  connectedCallback(): void {
    this.#render();
    this.#restoreFilterState();
    this.#initializeEventListeners();
    this.#loadData().catch((error) => {
      console.error('Error loading data:', error);
    });
  }

  /**
   * 속성 변경 시 호출되는 Web Component 라이프사이클 메서드
   * 현재 'page-size' 속성 변경을 감지하여 페이지 크기를 동적으로 조정합니다.
   *
   * @override
   * @memberof FlayAll
   * @param {string} name - 변경된 속성명
   * @param {string | null} oldValue - 이전 값
   * @param {string | null} newValue - 새로운 값
   */
  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === 'page-size' && oldValue !== newValue && newValue) {
      const pageSize = parseInt(newValue, 10);
      if (!isNaN(pageSize) && pageSize > 0) {
        FlayAll.PAGE_SIZE = pageSize;
        this.#currentPage = 0;
        this.#renderPage();
      }
    }
  }

  /**
   * 관찰할 속성 목록을 반환하는 정적 getter
   * Web Component가 감지할 속성들을 정의합니다.
   *
   * @static
   * @memberof FlayAll
   * @returns {string[]} 관찰할 속성명 배열
   */
  static get observedAttributes(): string[] {
    return ['page-size'];
  }

  /**
   * DOM에서 제거될 때 호출되는 Web Component 라이프사이클 메서드
   * 메모리 누수 방지를 위해 이벤트 리스너와 옵저버를 정리합니다.
   *
   * @override
   * @memberof FlayAll
   */
  disconnectedCallback(): void {
    this.#removeEventListeners();
  }

  /**
   * HTML 템플릿을 생성하는 정적 메서드
   * 컴포넌트의 DOM 구조를 정의합니다.
   * @returns {HTMLTemplateElement} 생성된 템플릿 엘리먼트
   */
  static #createTemplate(): HTMLTemplateElement {
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
   * 컴포넌트의 초기 렌더링을 수행합니다.
   * 템플릿을 DOM에 추가하고 로딩 상태를 표시합니다.
   * @private
   */
  #render(): void {
    // 템플릿 사용하여 컴포넌트 내용 추가
    const template = FlayAll.#createTemplate();
    this.appendChild(template.content.cloneNode(true));

    // 초기 로딩 상태 표시
    this.showLoading(true);
  }

  /**
   * 모든 이벤트 리스너를 초기화합니다.
   * 페이지네이션, 검색, 필터링, 정렬, 테이블 상호작용 등의 이벤트를 등록합니다.
   * @private
   */
  #initializeEventListeners(): void {
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
      this.#debounce((...args: unknown[]) => {
        const e = args[0] as Event;
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
   * 등록된 이벤트 리스너와 옵저버를 정리합니다.
   * @private
   */
  #removeEventListeners(): void {
    // IntersectionObserver 정리
    if (this.#observer) {
      this.#observer.disconnect();
      this.#observer = null;
    }
  }

  /**
   * 무한 스크롤 기능을 설정합니다.
   * IntersectionObserver를 사용하여 스크롤 하단 감지 시 추가 아이템을 로드합니다.
   * @private
   */
  #setupInfiniteScroll(): void {
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
   * @private
   */
  #handlePrevPage(): void {
    if (this.#currentPage > 0) {
      this.#currentPage--;
      this.#renderPage();
      // 페이지 이동 후 스크롤을 테이블 상단으로 이동
      this.querySelector('.flay-list')?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  /**
   * 다음 페이지 버튼 핸들러
   * @private
   */
  #handleNextPage(): void {
    if ((this.#currentPage + 1) * FlayAll.PAGE_SIZE < this.#sortedFlayList.length) {
      this.#currentPage++;
      this.#renderPage();
      // 페이지 이동 후 스크롤을 테이블 상단으로 이동
      this.querySelector('.flay-list')?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  /**
   * 정렬 헤더 클릭 핸들러
   * @param {HTMLElement} header - 클릭된 헤더 엘리먼트
   * @param {number} index - 헤더 인덱스
   * @private
   */
  #handleSort(header: HTMLElement, index: number): void {
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
   * 데이터 필터링 및 정렬을 수행합니다.
   * @private
   */
  #filterAndSort(): void {
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
   * 현재 페이지의 데이터를 렌더링합니다.
   * @private
   */
  #renderPage(): void {
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
   * 추가 아이템 로드 (무한 스크롤용)
   * @private
   */
  #loadMoreItems(): void {
    this.#currentPage++;
    this.#renderPage();
  }

  /**
   * 페이지네이션 버튼 상태를 업데이트합니다.
   * 현재 페이지, 전체 페이지 수에 따라 이전/다음 버튼의 활성화 상태를 조정하고,
   * 페이지 번호 버튼들을 동적으로 생성합니다.
   *
   * @private
   * @memberof FlayAll
   */
  #updatePaginationButtons(): void {
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
   * 페이지 번호 버튼을 생성하는 헬퍼 함수
   * 클릭 가능한 페이지 번호 버튼을 생성하고 현재 페이지에 따라 활성 상태를 설정합니다.
   *
   * @private
   * @memberof FlayAll
   * @param {HTMLElement} container - 페이지 번호 버튼을 추가할 컨테이너 엘리먼트
   * @param {number} pageNumber - 생성할 페이지 번호 (1-based)
   * @param {number} currentPage - 현재 활성 페이지 번호 (1-based)
   */
  #createPageNumberButton(container: HTMLElement, pageNumber: number, currentPage: number): void {
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
   * 서버에서 데이터를 비동기적으로 로드합니다.
   * Flay 데이터, Archive 데이터, Score 데이터를 병렬로 가져와서 병합하고,
   * 중복 검사 및 초기 필터링/정렬을 수행합니다.
   *
   * @private
   * @async
   * @memberof FlayAll
   * @throws {Error} 데이터 로드 실패 시
   */
  async #loadData(): Promise<void> {
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

  // ===== Public API 메서드 =====

  /**
   * 무한 스크롤 기능의 활성화/비활성화를 설정합니다.
   * 활성화 시 사용자가 페이지 하단에 도달하면 자동으로 다음 항목들을 로드합니다.
   *
   * @public
   * @memberof FlayAll
   * @param {boolean} enabled - true: 무한 스크롤 활성화, false: 비활성화
   * @example
   * ```javascript
   * const flayAll = document.querySelector('flay-all');
   * flayAll.setInfiniteScroll(true); // 무한 스크롤 활성화
   * ```
   */
  setInfiniteScroll(enabled: boolean): void {
    this.#enableInfiniteScroll = enabled;
  }

  /**
   * 모든 캐시를 지우고 데이터를 다시 로드합니다.
   * 서버에서 최신 데이터를 가져와 현재 화면을 새로 고칩니다.
   *
   * @public
   * @async
   * @memberof FlayAll
   * @returns {Promise<void>} 데이터 로드 완료를 나타내는 Promise
   * @example
   * ```javascript
   * const flayAll = document.querySelector('flay-all');
   * await flayAll.refresh();
   * ```
   */
  refresh(): Promise<void> {
    // 캐시 비우기
    FlayFetch.clearAll();
    // 데이터 다시 로드
    return this.#loadData();
  }

  /**
   * 지정된 페이지로 이동합니다.
   * 페이지 번호가 범위를 벗어나면 유효한 범위로 자동 조정됩니다.
   *
   * @public
   * @memberof FlayAll
   * @param {number} pageNumber - 이동할 페이지 번호 (1부터 시작)
   * @example
   * ```javascript
   * const flayAll = document.querySelector('flay-all');
   * flayAll.goToPage(5); // 5페이지로 이동
   * ```
   */
  goToPage(pageNumber: number): void {
    if (pageNumber < 1) pageNumber = 1;

    const totalPages = Math.ceil(this.#sortedFlayList.length / FlayAll.PAGE_SIZE);
    if (pageNumber > totalPages) pageNumber = totalPages;

    this.#currentPage = pageNumber - 1;
    this.#renderPage();
    // 스크롤을 테이블 상단으로 이동
    this.querySelector('.flay-list')?.scrollIntoView({ behavior: 'smooth' });
  }

  /**
   * 모든 필터와 정렬 상태를 초기화합니다.
   * UI 컨트롤을 기본 상태로 되돌리고, localStorage에 저장된 설정을 삭제합니다.
   *
   * @public
   * @memberof FlayAll
   * @example
   * ```javascript
   * const flayAll = document.querySelector('flay-all');
   * flayAll.clearFilters(); // 모든 필터 초기화
   * ```
   */
  clearFilters(): void {
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
   * 특정 Opus로 항목을 검색하고 해당 페이지로 이동합니다.
   * 검색에 성공하면 해당 항목을 하이라이트하고 화면 중앙으로 스크롤합니다.
   *
   * @public
   * @memberof FlayAll
   * @param {string} opus - 검색할 Opus 번호
   * @returns {boolean} 검색 성공 여부 (true: 찾음, false: 못찾음)
   * @example
   * ```javascript
   * const flayAll = document.querySelector('flay-all');
   * const found = flayAll.findByOpus('ABC-123');
   * if (!found) {
   *   console.log('해당 Opus를 찾을 수 없습니다.');
   * }
   * ```
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
   * 로딩 인디케이터의 표시/숨김 상태를 제어합니다.
   * 데이터 로딩 중임을 사용자에게 시각적으로 알려줍니다.
   *
   * @public
   * @memberof FlayAll
   * @param {boolean} isLoading - true: 로딩 표시, false: 로딩 숨김
   * @example
   * ```javascript
   * const flayAll = document.querySelector('flay-all');
   * flayAll.showLoading(true); // 로딩 시작
   * // ... 비동기 작업 수행
   * flayAll.showLoading(false); // 로딩 완료
   * ```
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

  // ===== Private 헬퍼 메서드 =====

  /**
   * 사용자의 필터 상태를 localStorage에서 복원합니다.
   * 검색어, 선택된 랭크, 아카이브 표시 여부, 정렬 설정을 이전 세션에서 복원합니다.
   *
   * @private
   * @memberof FlayAll
   */
  #restoreFilterState(): void {
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
   * 현재 필터 상태를 localStorage에 저장합니다.
   * 검색어, 선택된 랭크, 아카이브 표시 여부, 정렬 설정을 저장하여
   * 다음 세션에서 동일한 상태를 유지할 수 있도록 합니다.
   *
   * @private
   * @memberof FlayAll
   */
  #saveFilterState(): void {
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
   * 연속적인 이벤트 호출을 제한하는 디바운스 함수를 생성합니다.
   * 사용자 입력이 빈번한 검색 기능에서 성능 최적화를 위해 사용됩니다.
   *
   * @private
   * @memberof FlayAll
   * @param {(...args: unknown[]) => void} func - 디바운스할 함수
   * @param {number} wait - 지연 시간 (밀리초)
   * @returns {(...args: unknown[]) => void} 디바운스된 함수
   * @example
   * ```javascript
   * const debouncedSearch = this.#debounce(this.#performSearch, 300);
   * ```
   */
  #debounce(func: (...args: unknown[]) => void, wait: number): (...args: unknown[]) => void {
    let timeout: number;
    return function (this: unknown, ...args: unknown[]) {
      const context = this;
      clearTimeout(timeout);
      timeout = window.setTimeout(() => {
        func.apply(context, args);
      }, wait);
    };
  }
}

// 커스텀 엘리먼트 등록
customElements.define('flay-all', FlayAll);
