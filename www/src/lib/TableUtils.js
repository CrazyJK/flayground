import './TableUtils.scss';

const NO_SORT = 0;
const DESCENDING = 1;
const ASCENDING = 2;

const DefaultOptions = {
  sort: [],
  noSort: [],
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
    theadTr = table.querySelector('.head');
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
    tbodyList = Array.from(table.children).filter((tr) => !tr.classList.contains('head') && !tr.classList.contains('foot'));
    tbodyList.forEach((tr, i) => (tr.dataset.no = i + 1));
  }

  console.debug(theadTr, tbodyList, tfootTr);

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

    // sort event
    th.addEventListener('click', (e) => {
      console.log('head', th, index);
      Array.from(theadTr.children)
        .filter((td) => td !== e.target)
        .forEach((td) => (td.dataset.sort = 0));

      if (!th.dataset.sort) {
        th.dataset.sort = NO_SORT;
      }
      th.dataset.sort = (parseInt(th.dataset.sort) + 1) % 3;
      const sort = parseInt(th.dataset.sort);

      tbodyList.sort((tr1, tr2) => {
        const no1 = tr1.dataset.no;
        const no2 = tr2.dataset.no;
        const value1 = tr1.children.item(index).textContent;
        const value2 = tr2.children.item(index).textContent;
        const isNumber = !isNaN(value1) && !isNaN(value2);

        if (sort === NO_SORT) {
          return parseInt(no2) - parseInt(no1);
        } else if (sort === ASCENDING) {
          return isNumber ? parseFloat(value2) - parseFloat(value1) : value2.localeCompare(value1);
        } else if (sort === DESCENDING) {
          return isNumber ? parseFloat(value1) - parseFloat(value2) : value1.localeCompare(value2);
        } else {
          throw new Error('undefined sort mode');
        }
      });

      console.debug('sortBody', index, sort, tbodyList);

      let prevTr = tbodyList[0];
      for (let i = 0; i < tbodyList.length; i++) {
        const tr = tbodyList[i];
        table.insertBefore(tr, prevTr);

        prevTr = tr;
      }
    });
  });
};
