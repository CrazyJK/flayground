import { FlayAll } from '@flay/panel/FlayAll';
import './inc/Page';

const main = document.querySelector('body > main')!;
const flayAll = new FlayAll();

flayAll.setInfiniteScroll(false);

// 데이터 로드 이벤트 리스너
flayAll.addEventListener('data-loaded', (e: Event) => {
  const customEvent = e as CustomEvent;
  console.log(`총 ${customEvent.detail.count}개의 항목이 로드되었습니다.`);
  console.info(`- 일반 항목: ${customEvent.detail.flayCount}개`);
  console.info(`- 아카이브 항목: ${customEvent.detail.archiveCount}개`);

  if (customEvent.detail.duplicateCount > 0) {
    console.warn(`- 중복 항목: ${customEvent.detail.duplicateCount}개`);
  }
});

// 오류 처리 이벤트 리스너
flayAll.addEventListener('data-error', (e: Event) => {
  const customEvent = e as CustomEvent;
  console.error('데이터 로드 중 오류 발생:', customEvent.detail.error);
});

// 항목 선택 이벤트 리스너
flayAll.addEventListener('flay-selected', (e: Event) => {
  const customEvent = e as CustomEvent;
  console.log(`항목 선택: ${customEvent.detail.opus}`, customEvent.detail.flay);
  // 여기서 선택된 항목에 대한 상세 정보 팝업이나 네비게이션 등을 처리할 수 있습니다.
});

// 정렬 변경 이벤트 리스너
flayAll.addEventListener('sort-changed', (e: Event) => {
  const customEvent = e as CustomEvent;
  console.debug(`정렬 변경: ${customEvent.detail.field} (${customEvent.detail.direction})`);
});

// 필터 변경 이벤트 리스너
flayAll.addEventListener('filter-changed', (e: Event) => {
  const customEvent = e as CustomEvent;
  if (customEvent.detail.searchTerm !== undefined) {
    console.debug(`검색어 변경: "${customEvent.detail.searchTerm}" (결과: ${customEvent.detail.filteredCount}개)`);
  } else if (customEvent.detail.showArchive !== undefined) {
    console.debug(`아카이브 포함 설정: ${customEvent.detail.showArchive ? '포함' : '제외'} (결과: ${customEvent.detail.filteredCount}개)`);
  }
});

// 페이지 변경 이벤트 리스너
flayAll.addEventListener('page-changed', (e: Event) => {
  const customEvent = e as CustomEvent;
  console.debug(`페이지 변경: ${customEvent.detail.currentPage} / ${customEvent.detail.totalPages}`);
});

// 키보드 단축키 설정
document.addEventListener('keydown', (e: KeyboardEvent) => {
  // 전체 새로고침: Ctrl+R (기본 브라우저 동작 유지)
  if (e.ctrlKey && e.key === 'r') {
    return;
  }

  // 데이터 새로고침: F5
  if (e.key === 'F5') {
    e.preventDefault();
    void flayAll.refresh();
  }

  // 검색창으로 포커스: Ctrl+F
  if (e.ctrlKey && e.key === 'f') {
    e.preventDefault();
    const searchInput = flayAll.shadowRoot!.querySelector('#search-input') as HTMLInputElement;
    searchInput.focus();
  }

  // 이전/다음 페이지: ←/→ 화살표 키
  if (e.key === 'ArrowLeft') {
    const prevButton = flayAll.shadowRoot!.querySelector('#prev-page') as HTMLButtonElement;
    if (!prevButton.disabled) {
      prevButton.click();
    }
  } else if (e.key === 'ArrowRight') {
    const nextButton = flayAll.shadowRoot!.querySelector('#next-page') as HTMLButtonElement;
    if (!nextButton.disabled) {
      nextButton.click();
    }
  }
});

main.appendChild(flayAll);
