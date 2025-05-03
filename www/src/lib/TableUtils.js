import './TableUtils.scss';

const NO_SORT = 0;
const ASCENDING = 1;
const DESCENDING = 2;

const DefaultOptions = {
  sort: [],
  noSort: [],
  initSortIndex: -1,
};

/**
 * 테이블 구조에 정렬 기능 추가
 * @param {Element} table
 * @param {DefaultOptions} options
 */
export const sortable = (table, options) => {
  const opts = Object.assign({}, DefaultOptions, options);
  // thead
  let theadTr;
  if (table.querySelector('thead') !== null) {
    theadTr = table.querySelector('thead tr');
  } else {
    theadTr = table.querySelector('.thead');
  }

  // tfoot
  let tfootTr;
  if (table.querySelector('tfoot') !== null) {
    tfootTr = table.querySelector('tfoot tr');
  } else {
    tfootTr = table.querySelector('.foot');
  }

  // tbody
  const isTbody = table.querySelector('tbody') !== null;
  let tbodyList = null;
  if (isTbody) {
    tbodyList = Array.from(table.querySelectorAll('tbody tr'));
    tbodyList.forEach((tr, i) => (tr.dataset.no = i + 1));
  } else {
    tbodyList = Array.from(table.children).filter((tr) => !tr.classList.contains('thead') && !tr.classList.contains('foot'));
    tbodyList.forEach((tr, i) => (tr.dataset.no = i + 1));
  }

  // 디버깅용 로그는 개발 환경에서만 출력하도록 조건부 처리 고려
  console.debug(theadTr, tbodyList, tfootTr);

  // 데이터 캐싱을 위한 저장소
  const cellDataCache = new Map();

  // 초기 데이터 캐싱 - 모든 셀의 컨텐츠와 데이터 타입 캐싱
  const cacheTableData = () => {
    tbodyList.forEach((tr) => {
      const rowCache = new Map();
      Array.from(tr.children).forEach((td, colIndex) => {
        const textContent = td.textContent.trim();
        const isNumber = !isNaN(textContent) && textContent !== '';
        const value = isNumber ? parseFloat(textContent) : textContent;

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

  // add sort event
  Array.from(theadTr.children).forEach((th, index) => {
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

    // sort event
    th.addEventListener('click', (e) => {
      // 프로덕션에서는 로그 제거 고려
      console.log('thead', th, index);

      // 다른 컬럼의 정렬 상태 초기화
      Array.from(theadTr.children)
        .filter((td) => td !== e.target)
        .forEach((td) => (td.dataset.sort = 0));

      // 정렬 상태 순환 (없음 -> 오름차순 -> 내림차순 -> 없음)
      if (!th.dataset.sort) {
        th.dataset.sort = NO_SORT;
      }
      th.dataset.sort = (parseInt(th.dataset.sort) + 1) % 3;
      const sort = parseInt(th.dataset.sort);

      // 정렬 실행 - 캐시된 데이터 사용
      tbodyList.sort((tr1, tr2) => {
        // 원래 순서로 돌아가기
        if (sort === NO_SORT) {
          return parseInt(tr1.dataset.no) - parseInt(tr2.dataset.no);
        }

        // 캐시에서 셀 데이터 가져오기
        const cellData1 = cellDataCache.get(tr1).get(index);
        const cellData2 = cellDataCache.get(tr2).get(index);

        // 오름차순/내림차순 정렬
        if (sort === ASCENDING) {
          return cellData1.isNumber ? cellData1.value - cellData2.value : cellData1.text.localeCompare(cellData2.text);
        } else if (sort === DESCENDING) {
          return cellData1.isNumber ? cellData2.value - cellData1.value : cellData2.text.localeCompare(cellData1.text);
        }
      });

      console.debug('sortBody', index, sort, tbodyList);

      // DocumentFragment를 사용하여 DOM 조작 최적화
      const fragment = document.createDocumentFragment();
      tbodyList.forEach((tr) => {
        fragment.appendChild(tr);
      });

      // 정렬된 행을 한 번에 테이블에 추가
      if (isTbody) {
        table.querySelector('tbody').appendChild(fragment);
      } else {
        // thead와 tfoot을 제외한 모든 행 제거 후 정렬된 행 추가
        Array.from(table.children)
          .filter((tr) => !tr.classList.contains('thead') && !tr.classList.contains('foot'))
          .forEach((tr) => table.removeChild(tr));

        // tfoot 앞에 정렬된 행 삽입
        if (tfootTr) {
          table.insertBefore(fragment, tfootTr);
        } else {
          table.appendChild(fragment);
        }
      }
    });

    if (opts.initSortIndex === index) {
      th.click();
    }
  });

  // 테이블 데이터가 변경될 때 캐시 업데이트를 위한 함수 - 내보내기
  return {
    updateCache: () => {
      cellDataCache.clear();
      cacheTableData();
    },
  };
};
