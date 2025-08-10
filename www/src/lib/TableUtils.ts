import './TableUtils.scss';

type CellData = {
  text: string;
  isNumber: boolean;
  value: number;
};

// HTMLElement를 확장하여 _rowId 속성 추가
interface ExtendedHTMLElement extends HTMLElement {
  _rowId?: string;
}

// Worker 메시지 타입 정의
interface SortedRow {
  id: string;
  originalIndex: string;
}

// Web Worker 응답 타입 정의
interface WorkerMessageEvent extends MessageEvent {
  data: {
    sortedRows: SortedRow[];
  };
}

const NO_SORT = 0;
const ASCENDING = 1;
const DESCENDING = 2;

interface SortOptions {
  sort: number[];
  noSort: number[];
  initSortIndex: number;
  useWorker: boolean;
}

const DefaultOptions: SortOptions = {
  sort: [],
  noSort: [],
  initSortIndex: -1, // 초기 정렬할 컬럼 인덱스 (기본값: -1, 정렬 없음)
  useWorker: true, // Web Worker 사용 여부 (기본값: 사용)
};

/**
 * 스로틀링 함수: 주어진 시간(delay) 동안 함수 호출을 한 번만 실행하도록 제한
 * @param func 실행할 함수
 * @param delay 제한 시간 (ms)
 * @returns 스로틀링이 적용된 함수
 */
function throttle<T extends unknown[]>(func: (...args: T) => void, delay: number) {
  let lastCall = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: unknown, ...args: T): void {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;

    if (timeSinceLastCall >= delay) {
      // 딜레이 시간이 지났으면 즉시 실행
      lastCall = now;
      func.apply(this, args);
    } else {
      // 딜레이 시간이 지나지 않았으면 타이머 설정
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        func.apply(this, args);
      }, delay - timeSinceLastCall);
    }
  };
}

/**
 * 테이블 구조에 정렬 기능 추가
 * @param table
 * @param options
 */
export const sortable = (table: HTMLElement, options: Partial<SortOptions>) => {
  const opts = Object.assign({}, DefaultOptions, options);

  // Web Worker 초기화
  let sortWorker: Worker | null = null;

  // Web Worker 지원 확인 및 초기화
  if (opts.useWorker && typeof Worker !== 'undefined') {
    try {
      sortWorker = new Worker(new URL('./TableSortWorker.ts', import.meta.url));
      console.debug('Table Sort Web Worker initialized');
    } catch (err) {
      console.warn('Failed to initialize Web Worker for table sorting:', err);
      sortWorker = null;
    }
  }

  // thead
  let theadTr: HTMLElement | null;
  if (table.querySelector('thead') !== null) {
    theadTr = table.querySelector('thead tr');
  } else {
    theadTr = table.querySelector('.thead');
  }

  // tfoot
  let tfootTr: HTMLElement | null;
  if (table.querySelector('tfoot') !== null) {
    tfootTr = table.querySelector('tfoot tr');
  } else {
    tfootTr = table.querySelector('.foot');
  }

  // tbody
  const isTbody = table.querySelector('tbody') !== null;
  let tbodyList: ExtendedHTMLElement[];
  if (isTbody) {
    tbodyList = Array.from(table.querySelectorAll<HTMLElement>('tbody tr'));
    tbodyList.forEach((tr, i) => (tr.dataset.no = String(i + 1)));
  } else {
    tbodyList = Array.from(table.children).filter((tr): tr is ExtendedHTMLElement => tr instanceof HTMLElement && !tr.classList.contains('thead') && !tr.classList.contains('foot'));
    tbodyList.forEach((tr, i) => (tr.dataset.no = String(i + 1)));
  }

  // 디버깅용 로그는 개발 환경에서만 출력하도록 조건부 처리 고려
  console.debug(theadTr, tbodyList, tfootTr);

  // 데이터 캐싱을 위한 저장소
  const cellDataCache: Map<ExtendedHTMLElement, Map<number, CellData>> = new Map();

  // 초기 데이터 캐싱 - 모든 셀의 컨텐츠와 데이터 타입 캐싱
  const cacheTableData = (): void => {
    tbodyList.forEach((tr: ExtendedHTMLElement) => {
      const rowCache: Map<number, CellData> = new Map();
      Array.from(tr.children).forEach((td, colIndex) => {
        const textContent = td.textContent?.trim() ?? '';
        const isNumber = !isNaN(Number(textContent)) && textContent !== '';
        const value = isNumber ? parseFloat(textContent) : 0;

        // 각 셀의 데이터와 타입을 캐싱
        rowCache.set(colIndex, {
          text: textContent,
          isNumber,
          value,
        });
      });
      // 각 행별로 셀 데이터 캐싱
      cellDataCache.set(tr, rowCache);
    });
  };

  // 초기 테이블 데이터 캐싱 실행
  cacheTableData();

  // Worker에 전송하기 위한 형태로 셀 데이터 변환
  const prepareCellDataForWorker = (): Record<string, Record<number, CellData>> => {
    const workerCellData: Record<string, Record<number, CellData>> = {};

    tbodyList.forEach((tr: ExtendedHTMLElement, index: number) => {
      const rowId = `row-${index}`;
      tr._rowId = rowId; // 원본 tr 요소에 ID 참조 저장

      workerCellData[rowId] = {};

      // Map을 일반 객체로 변환
      const rowCache = cellDataCache.get(tr);
      if (rowCache) {
        rowCache.forEach((cellData, colIndex) => {
          if (!workerCellData[rowId]) {
            workerCellData[rowId] = {};
          }
          workerCellData[rowId][colIndex] = cellData;
        });
      }
    });

    return workerCellData;
  };

  // Worker용 행 데이터 준비
  const prepareRowsForWorker = (): Array<{ id: string; originalIndex: string }> => {
    return tbodyList.map((tr: ExtendedHTMLElement) => ({
      id: tr._rowId ?? '',
      originalIndex: tr.dataset.no ?? '0',
    }));
  };

  // 정렬 결과 적용 함수 (Worker에서 정렬된 결과를 DOM에 적용)
  const applyWorkerSortResult = (sortedRows: SortedRow[]): void => {
    // 행 ID로 원래 tr 요소 매핑
    const rowMap = new Map<string, ExtendedHTMLElement>();
    tbodyList.forEach((tr: ExtendedHTMLElement) => {
      if (tr._rowId) {
        rowMap.set(tr._rowId, tr);
      }
    });

    // 정렬된 순서대로 새 배열 생성
    const newOrder = sortedRows.map((row) => rowMap.get(row.id)).filter((tr): tr is ExtendedHTMLElement => tr !== undefined);

    // DocumentFragment를 사용하여 DOM 조작 최적화
    const fragment = document.createDocumentFragment();
    newOrder.forEach((tr) => {
      fragment.appendChild(tr);
    });

    // 정렬된 행을 한 번에 테이블에 추가
    if (isTbody) {
      const tbody = table.querySelector('tbody');
      if (tbody) {
        tbody.appendChild(fragment);
      }
    } else {
      // thead와 tfoot을 제외한 모든 행 제거 후 정렬된 행 추가
      Array.from(table.children)
        .filter((tr): tr is ExtendedHTMLElement => tr instanceof HTMLElement && !tr.classList.contains('thead') && !tr.classList.contains('foot'))
        .forEach((tr) => table.removeChild(tr));

      // tfoot 앞에 정렬된 행 삽입
      if (tfootTr) {
        table.insertBefore(fragment, tfootTr);
      } else {
        table.appendChild(fragment);
      }
    }

    // 참조 업데이트
    tbodyList = newOrder;
  };

  // 정렬 실행 함수
  const performSort = (th: HTMLElement, index: number): void => {
    // 프로덕션에서는 로그 제거 고려
    console.log('thead', th, index);

    if (!theadTr) return;

    // 다른 컬럼의 정렬 상태 초기화
    Array.from(theadTr.children)
      .filter((td) => td !== th)
      .forEach((td) => {
        if (td instanceof HTMLElement) {
          td.dataset.sort = '0';
        }
      });

    // 정렬 상태 순환 (없음 -> 오름차순 -> 내림차순 -> 없음)
    if (!th.dataset.sort) {
      th.dataset.sort = String(ASCENDING);
    }
    th.dataset.sort = String((parseInt(th.dataset.sort) + 1) % 3);
    const sort = parseInt(th.dataset.sort);

    // 시각적 피드백 - 정렬 중임을 표시
    th.classList.add('sorting');

    // Web Worker가 있을 경우 Worker 사용
    if (sortWorker) {
      // 처리 중임을 표시
      table.classList.add('processing');

      // Worker에 처리 요청
      const workerCellData = prepareCellDataForWorker();
      const workerRows = prepareRowsForWorker();

      // 한 번만 이벤트 리스너 설정
      const messageHandler = (e: WorkerMessageEvent): void => {
        const { sortedRows } = e.data;

        // 정렬 결과 DOM에 적용
        applyWorkerSortResult(sortedRows);

        // 처리 완료 표시
        th.classList.remove('sorting');
        table.classList.remove('processing');

        // 메시지 핸들러 제거 (중복 처리 방지)
        if (sortWorker) {
          sortWorker.removeEventListener('message', messageHandler);
        }
      };

      sortWorker.addEventListener('message', messageHandler);

      // Worker에 작업 요청
      sortWorker.postMessage({
        rows: workerRows,
        columnIndex: index,
        sortType: sort,
        cellData: workerCellData,
      });
    }
    // Worker가 없을 경우 메인 스레드에서 처리
    else {
      // 메인 스레드에서 정렬 실행 - 캐시된 데이터 사용
      tbodyList.sort((tr1: ExtendedHTMLElement, tr2: ExtendedHTMLElement): number => {
        // 원래 순서로 돌아가기
        if (sort === NO_SORT) {
          const no1 = tr1.dataset.no ? parseInt(tr1.dataset.no) : 0;
          const no2 = tr2.dataset.no ? parseInt(tr2.dataset.no) : 0;
          return no1 - no2;
        }

        // 캐시에서 셀 데이터 가져오기
        const rowCache1 = cellDataCache.get(tr1);
        const rowCache2 = cellDataCache.get(tr2);

        if (!rowCache1 || !rowCache2) return 0;

        const cellData1 = rowCache1.get(index);
        const cellData2 = rowCache2.get(index);

        if (!cellData1 || !cellData2) return 0;

        // 오름차순/내림차순 정렬
        if (sort === ASCENDING) {
          return cellData1.isNumber ? cellData1.value - cellData2.value : cellData1.text.localeCompare(cellData2.text);
        } else if (sort === DESCENDING) {
          return cellData1.isNumber ? cellData2.value - cellData1.value : cellData2.text.localeCompare(cellData1.text);
        }

        return 0;
      });

      console.debug('sortBody', index, sort, tbodyList);

      // DocumentFragment를 사용하여 DOM 조작 최적화
      const fragment = document.createDocumentFragment();
      tbodyList.forEach((tr) => {
        fragment.appendChild(tr);
      });

      // 정렬된 행을 한 번에 테이블에 추가
      if (isTbody) {
        const tbody = table.querySelector('tbody');
        if (tbody) {
          tbody.appendChild(fragment);
        }
      } else {
        // thead와 tfoot을 제외한 모든 행 제거 후 정렬된 행 추가
        Array.from(table.children)
          .filter((tr): tr is ExtendedHTMLElement => tr instanceof HTMLElement && !tr.classList.contains('thead') && !tr.classList.contains('foot'))
          .forEach((tr) => table.removeChild(tr));

        // tfoot 앞에 정렬된 행 삽입
        if (tfootTr) {
          table.insertBefore(fragment, tfootTr);
        } else {
          table.appendChild(fragment);
        }
      }

      // 피드백 애니메이션 종료
      setTimeout(() => th.classList.remove('sorting'), 300);
    }
  };

  // add sort event with throttling (300ms)
  if (theadTr) {
    Array.from(theadTr.children).forEach((th, index) => {
      if (!(th instanceof HTMLElement)) return;

      // noSort
      if (opts.noSort.length > 0 && opts.noSort.includes(index)) {
        return;
      }
      // sort
      if (opts.sort.length > 0 && !opts.sort.includes(index)) {
        return;
      }

      // 정렬 가능한 컬럼에 시각적 표시 추가
      th.classList.add('sortable');

      // 스로틀링을 적용한 정렬 이벤트 핸들러 생성
      const throttledSort = throttle(() => performSort(th, index), 300);

      // 정렬 이벤트 리스너 추가
      th.addEventListener('click', throttledSort);

      if (opts.initSortIndex === index) {
        th.click();
      }
    });
  }

  // Web Worker 정리 함수
  const cleanup = () => {
    if (sortWorker) {
      sortWorker.terminate();
      sortWorker = null;
      console.debug('Table Sort Web Worker terminated');
    }
  };

  // 테이블 데이터가 변경될 때 캐시 업데이트를 위한 함수 - 내보내기
  return {
    updateCache: () => {
      cellDataCache.clear();
      cacheTableData();
    },
    cleanup: cleanup, // Web Worker 정리 함수 제공
  };
};
