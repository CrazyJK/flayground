import PlayTimeDB from '@flay/idb/PlayTimeDB';
import DateUtils from '@lib/DateUtils';
import FlayFetch from '@lib/FlayFetch';
import TimeUtils from '@lib/TimeUtils';
import './inc/Page';
import './page.flay-play-record.scss';

class Page {
  db;

  constructor() {
    this.db = new PlayTimeDB();
  }

  async start() {
    // 스크롤 버튼 이벤트 리스너 설정
    this.setupScrollButton();

    // 헤더 컨트롤 영역 추가
    this.renderHeader();

    const LIST = document.querySelector('body > main > ol');
    const records = await this.db.listByLastPlayed();

    const existsResult = await FlayFetch.existsFlayList(...records.map((record) => record.opus));

    // 로딩 애니메이션 표시
    LIST.innerHTML = '<div class="loading">데이터 로딩 중...</div>';

    // 데이터 필터링 및 렌더링
    const validRecords = [];
    for (const record of records) {
      if (!existsResult[record.opus]) {
        await this.db.remove(record.opus);
        console.log('not exists', record.opus);
        continue;
      }
      validRecords.push(record);
    }

    // 로딩 메시지 제거
    LIST.innerHTML = '';

    // 레코드가 없는 경우 메시지 표시
    if (validRecords.length === 0) {
      LIST.innerHTML = '<div class="no-records">재생 기록이 없습니다</div>';
      return;
    }

    // 레코드 목록 렌더링
    validRecords.forEach((record) => {
      const percentage = Math.round((record.time / record.duration) * 100);
      const li = document.createElement('li');
      li.dataset.opus = record.opus;

      li.innerHTML = `
        <div class="opus">${record.opus}</div>
        <div class="progress-container">
          <div class="progress" title="마지막 재생 위치: ${TimeUtils.toTime(record.time)}">
            <div class="progress-bar" style="width: ${percentage}%"></div>
            <div class="progress-marker" style="left: ${percentage}%"></div>
          </div>
          <div class="progress-label">
            <span class="duration">${TimeUtils.toTime(record.duration)}</span>
            <span class="current-time" style="left: ${percentage}%">${TimeUtils.toTime(record.time)}</span>
          </div>
        </div>
        <div class="lastPlayed">${DateUtils.format(record.lastPlayed, 'yy.MM.dd HH:mm')}</div>
      `;

      // 클릭 이벤트 추가
      li.addEventListener('click', () => this.handleRecordClick(record));

      LIST.appendChild(li);
    });

    document.querySelector('.length').innerHTML = ` (${LIST.querySelectorAll('li').length})`;

    // 목록 항목에 애니메이션 효과 추가
    this.animateListItems();

    // 겹치는 시간 표시를 위한 최적화 처리
    this.optimizeTimeOverlap();

    // 창 크기 변경에 대응
    window.addEventListener('resize', () => {
      this.optimizeTimeOverlap();
    });
  }

  renderHeader() {
    const header = document.querySelector('body > header');
    const headerControls = document.createElement('div');
    headerControls.className = 'header-controls';
    headerControls.innerHTML = `
      <div class="search-bar">
        <input type="text" placeholder="작품 검색..." id="search-input">
      </div>
      <div class="view-options">
        <button id="sort-by-date" class="active"><i class="fas fa-clock"></i>&nbsp;최근순</button>
        <button id="sort-by-progress"><i class="fas fa-chart-bar"></i>&nbsp;진행률순</button>
      </div>
    `;

    header.appendChild(headerControls);

    // 검색 기능 추가
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', this.handleSearch.bind(this));

    // 정렬 기능 추가
    document.getElementById('sort-by-date').addEventListener('click', (e) => this.handleSort(e, 'date'));
    document.getElementById('sort-by-progress').addEventListener('click', (e) => this.handleSort(e, 'progress'));
  }

  setupScrollButton() {
    const scrollButton = document.getElementById('scroll-to-top');

    // 스크롤 위치에 따라 버튼 표시/숨김
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) {
        scrollButton.classList.add('visible');
      } else {
        scrollButton.classList.remove('visible');
      }
    });

    // 버튼 클릭 시 상단으로 스크롤
    scrollButton.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    });
  }

  animateListItems() {
    const items = document.querySelectorAll('body > main > ol > li');

    // 각 항목에 지연된 등장 애니메이션 추가
    items.forEach((item, index) => {
      item.style.opacity = '0';
      item.style.transform = 'translateY(20px)';
      item.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

      setTimeout(() => {
        item.style.opacity = '1';
        item.style.transform = 'translateY(0)';
      }, 50 * index); // 각 항목마다 지연 시간 추가
    });
  }

  handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const items = document.querySelectorAll('body > main > ol > li');

    items.forEach((item) => {
      const opus = item.querySelector('.opus').textContent.toLowerCase();
      if (opus.includes(searchTerm)) {
        item.style.display = '';
      } else {
        item.style.display = 'none';
      }
    });
  }

  handleSort(e, type) {
    // 버튼 스타일 업데이트
    const buttons = document.querySelectorAll('.view-options button');
    buttons.forEach((btn) => btn.classList.remove('active'));
    e.target.classList.add('active');

    const list = document.querySelector('body > main > ol');
    const items = Array.from(list.querySelectorAll('li'));

    if (type === 'date') {
      // 이미 최근순으로 정렬되어 있으므로 페이지 새로고침
      window.location.reload();
    } else if (type === 'progress') {
      // 진행률(마지막 재생 위치) 기준 정렬
      items.sort((a, b) => {
        const progressA = parseInt(a.querySelector('.progress-bar').style.width);
        const progressB = parseInt(b.querySelector('.progress-bar').style.width);
        return progressB - progressA;
      });

      // 정렬된 아이템을 리스트에 추가
      items.forEach((item) => list.appendChild(item));

      // 정렬 후 애니메이션 효과 적용
      this.animateListItems();
    }
  }

  handleRecordClick(record) {
    // 클릭 효과 추가
    const clickedItem = document.querySelector(`li[data-opus="${record.opus}"]`);
    clickedItem.style.transform = 'scale(0.98)';
    setTimeout(() => {
      clickedItem.style.transform = '';

      // 상세 정보 페이지로 이동
      window.location.href = `/app/flay/info?opus=${record.opus}`;
    }, 150);
  }

  optimizeTimeOverlap() {
    const containers = document.querySelectorAll('.progress-container');

    containers.forEach((container) => {
      const currentTime = container.querySelector('.current-time');
      const duration = container.querySelector('.duration');

      // 현재 시간 요소와 전체 시간 요소의 위치 계산
      if (currentTime && duration) {
        const currentTimeRect = currentTime.getBoundingClientRect();
        const durationRect = duration.getBoundingClientRect();

        // 겹치는지 확인 (순서가 바뀌었으므로 조건도 변경)
        if (currentTimeRect.left < durationRect.right + 10) {
          // 겹치는 경우 현재 시간 요소의 배경색을 더 선명하게
          currentTime.style.backgroundColor = '#e74c3c';
          currentTime.style.fontWeight = 'bold';
          currentTime.style.borderWidth = '2px';

          // 전체 시간 요소의 스타일 조정
          duration.style.backgroundColor = 'rgba(52, 152, 219, 0.15)';

          // 창 크기가 작을 경우 (모바일 등)
          if (window.innerWidth <= 768) {
            currentTime.style.position = 'relative';
            currentTime.style.transform = 'none';
            currentTime.style.left = 'auto';
            duration.style.position = 'relative';
            duration.style.left = 'auto';
          }
        } else {
          // 겹치지 않는 경우 기본 스타일로 복원
          currentTime.style.backgroundColor = '';
          currentTime.style.fontWeight = '';
          currentTime.style.borderWidth = '';
          duration.style.backgroundColor = '';
        }
      }
    });
  }
}

new Page().start();
