import FlayFetch from '@lib/FlayFetch';
import './inc/Page';
import './page.flay-all.scss';

// 가상 스크롤링 구현을 위한 상수
const PAGE_SIZE = 100; // 한 번에 표시할 항목 수
let currentPage = 0;
let sortedFlayList = [];
let sortColumn = 4; // 기본 정렬 컬럼 (발매일)
let sortDirection = -1; // 기본 내림차순

// 테이블 생성 및 초기화
function initializeTable() {
  const wrapper = document.querySelector('body > main').appendChild(document.createElement('div'));
  wrapper.classList.add('flay-list-wrapper');
  // 컨트롤 패널 추가
  const controlPanel = document.createElement('div');
  controlPanel.classList.add('control-panel');
  controlPanel.innerHTML = `
    <div class="filter">
      <input type="text" id="search-input" placeholder="검색어 입력..." />
      <label><input type="checkbox" id="show-archive" checked /> 아카이브 포함</label>
    </div>
  `;
  wrapper.appendChild(controlPanel);

  // 테이블 구조 생성
  wrapper.innerHTML += `
    <table class="flay-list">
      <thead>
        <tr>
          <th data-sort="studio">제작사</th>
          <th data-sort="opus">작품번호</th>
          <th data-sort="title">제목</th>
          <th data-sort="actressList">배우</th>
          <th data-sort="release">발매일</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
    <div class="loading-indicator">데이터 로딩 중...</div>
    <div id="scroll-observer"></div>
    <footer class="pagination-footer">
      <div class="pagination">
        <span>총 <strong id="total-count">0</strong>개</span>
        <button id="prev-page" disabled>이전</button>
        <span id="page-info">페이지 1</span>
        <button id="next-page">다음</button>
      </div>
    </footer>`;

  // 이벤트 리스너 등록
  wrapper.querySelector('#prev-page').addEventListener('click', () => {
    if (currentPage > 0) {
      currentPage--;
      renderPage();
    }
  });

  wrapper.querySelector('#next-page').addEventListener('click', () => {
    if ((currentPage + 1) * PAGE_SIZE < sortedFlayList.length) {
      currentPage++;
      renderPage();
    }
  });

  wrapper.querySelector('#search-input').addEventListener(
    'input',
    debounce(function () {
      filterAndSort();
    }, 300)
  );

  wrapper.querySelector('#show-archive').addEventListener('change', function () {
    filterAndSort();
  });

  // 정렬 이벤트 리스너
  const headers = wrapper.querySelectorAll('th[data-sort]');
  headers.forEach((header, index) => {
    header.addEventListener('click', () => {
      headers.forEach((h) => h.classList.remove('sort-asc', 'sort-desc'));

      if (sortColumn === index) {
        sortDirection *= -1;
      } else {
        sortColumn = index;
        sortDirection = 1;
      }

      header.classList.add(sortDirection === 1 ? 'sort-asc' : 'sort-desc');
      filterAndSort();
    });
  });

  // 초기 정렬 표시
  headers[sortColumn].classList.add(sortDirection === 1 ? 'sort-asc' : 'sort-desc');

  // 스크롤 감지를 위한 IntersectionObserver 설정
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !document.querySelector('.loading-indicator').classList.contains('active')) {
        if ((currentPage + 1) * PAGE_SIZE < sortedFlayList.length) {
          loadMoreItems();
        }
      }
    },
    { threshold: 0.1 }
  );

  observer.observe(document.getElementById('scroll-observer'));

  return wrapper;
}

// 디바운스 함수: 연속적인 이벤트 호출 제한
function debounce(func, wait) {
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

// 데이터 필터링 및 정렬
function filterAndSort() {
  const searchValue = document.getElementById('search-input').value.toLowerCase();
  const showArchive = document.getElementById('show-archive').checked;

  // 필터링
  let filtered = window.fullFlayList.filter((flay) => {
    if (!showArchive && flay.archive) return false;

    if (searchValue) {
      return (flay.studio && flay.studio.toLowerCase().includes(searchValue)) || (flay.opus && flay.opus.toLowerCase().includes(searchValue)) || (flay.title && flay.title.toLowerCase().includes(searchValue)) || (flay.actressList && flay.actressList.some((actress) => actress.toLowerCase().includes(searchValue)));
    }
    return true;
  });

  // 정렬
  const sortFields = ['studio', 'opus', 'title', 'actressList', 'release'];
  const field = sortFields[sortColumn];

  filtered.sort((a, b) => {
    let valueA = a[field];
    let valueB = b[field];

    // 배우 목록은 특별 처리
    if (field === 'actressList') {
      valueA = valueA?.join(',') || '';
      valueB = valueB?.join(',') || '';
    }

    // null 체크
    if (valueA === null || valueA === undefined) valueA = '';
    if (valueB === null || valueB === undefined) valueB = '';

    // 문자열 비교
    if (typeof valueA === 'string' && typeof valueB === 'string') {
      return sortDirection * valueA.localeCompare(valueB);
    }

    // 숫자 비교
    return sortDirection * (valueA - valueB);
  });

  sortedFlayList = filtered;

  // 카운트 업데이트 및 페이지 리셋
  document.getElementById('total-count').textContent = sortedFlayList.length;
  currentPage = 0;

  // 페이지네이션 버튼 상태 업데이트
  updatePaginationButtons();

  // 테이블 다시 렌더링
  renderPage();
}

// 페이지 렌더링
function renderPage() {
  const tbody = document.querySelector('.flay-list tbody');
  const startIndex = currentPage * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, sortedFlayList.length);
  const pageItems = sortedFlayList.slice(startIndex, endIndex);

  // 로딩 인디케이터 표시
  const loadingIndicator = document.querySelector('.loading-indicator');
  loadingIndicator.classList.add('active');

  // 페이지 정보 업데이트
  document.getElementById('page-info').textContent = `페이지 ${currentPage + 1} / ${Math.ceil(sortedFlayList.length / PAGE_SIZE)}`;

  // DOM 조작 최소화를 위해 DocumentFragment 사용
  const fragment = document.createDocumentFragment();

  // 렌더링 최적화를 위해 requestAnimationFrame 사용
  requestAnimationFrame(() => {
    // 기존 내용 지우기
    tbody.innerHTML = '';

    // 새 항목 추가
    pageItems.forEach((flay) => {
      const tr = document.createElement('tr');
      tr.classList.toggle('archive', flay.archive);

      // innerHTML보다 효율적인 방법 사용
      const tdStudio = document.createElement('td');
      tdStudio.textContent = flay.studio || '';

      const tdOpus = document.createElement('td');
      tdOpus.textContent = flay.opus || '';

      const tdTitle = document.createElement('td');
      tdTitle.textContent = flay.title || '';

      const tdActress = document.createElement('td');
      tdActress.textContent = flay.actressList?.join(',') || '';

      const tdRelease = document.createElement('td');
      tdRelease.textContent = flay.release || '';

      tr.appendChild(tdStudio);
      tr.appendChild(tdOpus);
      tr.appendChild(tdTitle);
      tr.appendChild(tdActress);
      tr.appendChild(tdRelease);

      fragment.appendChild(tr);
    });

    tbody.appendChild(fragment);

    // 로딩 인디케이터 숨기기
    loadingIndicator.classList.remove('active');

    // 페이지네이션 버튼 상태 업데이트
    updatePaginationButtons();
  });
}

// 추가 아이템 로드 (무한 스크롤)
function loadMoreItems() {
  currentPage++;
  renderPage();
}

// 페이지네이션 버튼 상태 업데이트
function updatePaginationButtons() {
  const prevButton = document.getElementById('prev-page');
  const nextButton = document.getElementById('next-page');

  prevButton.disabled = currentPage === 0;
  nextButton.disabled = (currentPage + 1) * PAGE_SIZE >= sortedFlayList.length;
}

// 메인 실행 코드
const wrapper = initializeTable();

// 데이터 로딩 표시
document.querySelector('.loading-indicator').classList.add('active');

// 데이터 로드
Promise.all([FlayFetch.getFlayAll(), FlayFetch.getArchiveAll()])
  .then(([flayAll, archiveAll]) => {
    // 성능 최적화: Web Worker 사용 고려

    // 중복 검사하여 합치기
    const flayMap = new Map(flayAll.map((flay) => [flay.opus, flay]));
    let duplicateCount = 0;

    archiveAll.forEach((archive) => {
      if (flayMap.has(archive.opus)) {
        duplicateCount++;
        console.log(`%c중복된 opus 발견: ${archive.opus}`, 'color: red;');
      } else {
        flayMap.set(archive.opus, archive);
      }
    });

    if (duplicateCount > 0) {
      console.warn(`총 ${duplicateCount}개의 중복 항목이 발견되었습니다.`);
    }

    // 전역 변수에 저장 (필터링/정렬에 사용)
    window.fullFlayList = Array.from(flayMap.values());

    // 초기 필터링 및 정렬
    filterAndSort();

    // 로딩 인디케이터 숨기기
    document.querySelector('.loading-indicator').classList.remove('active');
  })
  .catch((error) => {
    console.error('데이터 로딩 중 오류 발생:', error);
    document.querySelector('.loading-indicator').textContent = '데이터 로딩 중 오류가 발생했습니다.';
  });
