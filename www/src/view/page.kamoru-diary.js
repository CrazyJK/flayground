/**
 * kamoru diary
 *
 */

import './inc/Page';
import './page.kamoru-diary.scss';

import FlayAttach from '../attach/FlayAttach';
import weatherSVG from '../svg/weathers';
import windowButton from '../svg/windowButton';

let diaryList = [];

(async () => {
  document.querySelector('#weather-sunny + label').innerHTML = weatherSVG.sunny;
  document.querySelector('#weather-cloud + label').innerHTML = weatherSVG.cloud;
  document.querySelector('#weather-rainy + label').innerHTML = weatherSVG.rain;
  document.querySelector('#weather-snowy + label').innerHTML = weatherSVG.snow;

  const GB = 1024 * 1024 * 1024;
  const newDiary = { meta: { date: '', weather: '', title: '', created: null, lastModified: null, attachId: null }, content: '' };
  let currentDiary = newDiary;

  const gridDiary = document.querySelector('#diaryWriteContainer');
  const diaryWrap = document.querySelector('#diaryWrap');
  const diaryTitle = document.querySelector('#diaryTitle');
  const diaryDate = document.querySelector('#diaryDate');
  const diaryDay = document.querySelector('#diaryDay');

  const { ToastHtmlEditor } = await import(/* webpackChunkName: "ToastHtmlEditor" */ '../ui/editor/ToastHtmlEditor');
  const diaryEditor = document.querySelector('#diaryBody').appendChild(new ToastHtmlEditor({ blur: () => saveDiary() }));
  diaryEditor.hide();
  const diaryAttch = document.querySelector('#diaryAttch');

  // flay attach
  const flayAttach = diaryAttch.appendChild(
    new FlayAttach({
      id: 'flayAttach',
      totalFileCount: 0,
      totalFileLength: GB * 1,
      attachChangeCallback: (attach) => {
        console.debug('attachCallback', attach);
        currentDiary.meta.attachId = attach.id;
      },
    })
  );
  flayAttach.addEventListener('attach', (e) => {
    console.debug('flayAttach change', e.detail.files);
  });

  Promise.resolve().then(fetchDiary).then(renderCalendar).then(addCalendarEventListener).then(addDiaryEventListener).then(addDiaryViewerEventListener);

  async function fetchDiary() {
    return fetch('/diary/meta')
      .then((response) => response.json())
      .then((list) => {
        diaryList = list;
        console.debug('fetched diaryList', diaryList);
      });
  }

  function renderCalendar() {
    const dates = diaryList.map((diary) => diary.date);
    const startDate = dates.reduce((min, d) => (d < min ? d : min), dates[0]);
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const endDate = `${year}-${month}-${day}`;
    console.debug('Start Date:', startDate, 'End Date:', endDate);

    renderCalendarsBetweenDates(startDate, endDate);

    markDiaryDates();
  }

  function renderCalendarsBetweenDates(startStr, endStr, containerId = 'calendarContainer') {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`id "${containerId}"를 가진 컨테이너를 찾을 수 없습니다`);
    }
    container.innerHTML = '';

    // 파싱: 시작 날짜와 종료 날짜 (형식: YYYY-MM-DD)
    const [startYear, startMonth] = startStr.split('-').map(Number);
    const [endYear, endMonth] = endStr.split('-').map(Number);
    const startDate = new Date(startYear, startMonth - 1, 1);
    const endDate = new Date(endYear, endMonth - 1, 1);

    // 시작부터 종료까지 월별 배열 (월은 오름차순)
    let current = new Date(startDate);
    const monthList = [];
    while (current <= endDate) {
      monthList.push(new Date(current));
      current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    }

    // 연도별로 그룹핑 (연도는 시간 역순)
    const yearGroups = {};
    monthList.forEach((monthDate) => {
      const year = monthDate.getFullYear();
      if (!yearGroups[year]) {
        yearGroups[year] = [];
      }
      yearGroups[year].push(monthDate);
    });

    // 연도 키를 내림차순 정렬
    const sortedYears = Object.keys(yearGroups)
      .map(Number)
      .sort((a, b) => b - a);

    sortedYears.forEach((year) => {
      // 해당 연도의 월은 오름차순으로 정렬합니다.
      const monthsForYear = yearGroups[year].sort((a, b) => a.getMonth() - b.getMonth());
      const yearContainer = document.createElement('div');
      yearContainer.classList.add('year-group');

      const yearHeader = document.createElement('h2');
      yearHeader.textContent = year;
      yearContainer.appendChild(yearHeader);

      monthsForYear.forEach((monthDate) => {
        const y = monthDate.getFullYear();
        const m = monthDate.getMonth(); // 0-indexed
        const firstOfMonth = new Date(y, m, 1);
        const firstDayOfWeek = firstOfMonth.getDay();
        const startCalendar = new Date(y, m, 1 - firstDayOfWeek);

        const lastOfMonth = new Date(y, m + 1, 0);
        const lastDayOfWeek = lastOfMonth.getDay();
        const endCalendar = new Date(y, m, lastOfMonth.getDate() + (6 - lastDayOfWeek));

        // 생성할 날짜 배열
        const totalDays = Math.round((endCalendar - startCalendar) / (1000 * 60 * 60 * 24)) + 1;
        const dates = [];
        for (let i = 0; i < totalDays; i++) {
          const date = new Date(startCalendar);
          date.setDate(startCalendar.getDate() + i);
          dates.push(date);
        }

        // 월 컨테이너 생성
        const monthDiv = document.createElement('div');
        monthDiv.classList.add('month');

        const monthLabel = document.createElement('label');
        monthLabel.classList.add('month-name');
        monthLabel.textContent = `${y}. ${m + 1}`;
        monthDiv.appendChild(monthLabel);

        const datesDiv = document.createElement('div');
        datesDiv.classList.add('dates');

        dates.forEach((date, i) => {
          const dateDiv = document.createElement('div');
          dateDiv.classList.add('date');
          // 현재 월에 속한 날짜만 'current' 클래스로 처리
          if (date.getMonth() === m) {
            dateDiv.classList.add('current');
            dateDiv.classList.toggle('sat', date.getDay() === 6); // 토요일
            dateDiv.classList.toggle('sun', date.getDay() === 0); // 일요일
            const yy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            dateDiv.id = `d-${yy}-${mm}-${dd}`;
          } else {
            dateDiv.classList.add('other');
          }
          // dateDiv.setAttribute('title', date.toLocaleDateString());

          const span = document.createElement('span');
          span.textContent = date.getDate();
          dateDiv.appendChild(span);
          datesDiv.appendChild(dateDiv);
        });

        monthDiv.appendChild(datesDiv);
        yearContainer.appendChild(monthDiv);
      });
      container.appendChild(yearContainer);
    });

    // 오늘날짜(endStr)에 today 클래스 추가
    document.getElementById(`d-${endStr}`).classList.add('today');
  }

  /**
   * 달력 클릭 이벤트
   */
  function addCalendarEventListener() {
    document.querySelectorAll('.dates .date').forEach((date) => {
      date.addEventListener('click', (e) => {
        console.debug('click Calendar date', e.target);

        // 클릭 이벤트에서 label node 찾기
        let clickedDate;
        if (e.target.nodeName === 'DIV') {
          clickedDate = e.target;
        } else if (e.target.nodeName === 'SPAN' || e.target.nodeName === 'LABEL') {
          clickedDate = e.target.parentNode;
        } else {
          throw Error('not found label');
        }

        // ref 날이 아니면, path
        if (!clickedDate.classList.contains('current')) {
          return;
        }

        // 중복 클릭 방지
        if (clickedDate.classList.contains('active')) {
          return;
        }

        // 목록에서 클릭한 일기에 액티브 클래스 추가
        document.querySelectorAll('.date').forEach((date) => {
          date.classList.remove('active');
        });
        clickedDate.classList.add('active');

        const date = clickedDate.id.substring(2);

        if (clickedDate.classList.contains('written')) {
          fetch('/diary/date/' + date)
            .then((response) => response.json())
            .then((diary) => loadDiary(diary));
        } else {
          newDiary.meta.date = date;
          newDiary.meta.weather = 'sunny';
          newDiary.meta.title = '';
          newDiary.meta.created = null;
          newDiary.meta.lastModified = null;
          newDiary.meta.attachId = null;
          newDiary.content = '';
          loadDiary(newDiary);
        }
      });
    });
  }

  /**
   * 일기 작성창 이벤트. 제목, 날씨
   */
  function addDiaryEventListener() {
    diaryTitle.addEventListener('blur', saveDiary);
    document.querySelectorAll('input[name="diaryWeather"]').forEach((weather) => {
      weather.addEventListener('click', saveDiary);
    });
    // 에디터 변경은 에디터에서 blur 함수 호출됨
  }

  function addDiaryViewerEventListener() {
    // diary Viewer Close
    document.getElementById('diaryViewerClose').innerHTML = windowButton.terminate;
    document.getElementById('diaryViewerClose').addEventListener('click', (e) => {
      document.getElementById('diaryReadContainer').style.display = 'none';
    });
    // diary Viewer Show
    document.getElementById('diaryViewerShow').addEventListener('click', async (e) => {
      let htmlViewer = document.querySelector('#diaryViewerInner .toast-html-viewer');
      if (htmlViewer === null) {
        const { ToastHtmlViewer } = await import(/* webpackChunkName: "ToastHtmlViewer" */ '../ui/editor/ToastHtmlViewer');
        htmlViewer = document.querySelector('#diaryViewerInner').appendChild(new ToastHtmlViewer());
      }
      htmlViewer.setHTML(diaryEditor.getHTML());

      document.getElementById('diaryReadContainer').style.display = 'block';
    });
  }

  /**
   * 일기쓴 날짜를 불러와 달력에 별 표시
   */
  function markDiaryDates() {
    diaryList.forEach((meta) => {
      const dateElement = document.querySelector('#d-' + meta.date);
      if (dateElement) {
        dateElement.classList.add('written');
        dateElement.setAttribute('title', meta.title);
      }
    });
  }

  /**
   * 일기를 화면에 로딩
   * @param {*} diary
   */
  function loadDiary(diary) {
    console.log('loadDiary', diary);

    currentDiary = diary;

    gridDiary.style.display = 'block';
    diaryTitle.value = diary.meta.title; // title
    document.querySelector('[name="diaryWeather"][value="' + diary.meta.weather + '"]').checked = true; // weather
    diaryDay.innerHTML = getDay(diary.meta.date); // day of week
    diaryDate.value = diary.meta.date; // date
    diaryEditor.setHTML(diary.content); // content
    diaryEditor.show();
    flayAttach.initiate(diary.meta.attachId, 'DIARY', diary.meta.date); // attach
  }

  /**
   * 작성된 일기를 서버에 저장
   * @returns 제목, 날짜 필수
   */
  function saveDiary(e) {
    console.debug('called saveDiary', e?.target);

    const date = diaryDate.value;
    const title = diaryTitle.value;
    const weather = document.querySelector('[name="diaryWeather"]:checked')?.value;
    const content = diaryEditor.getHTML();

    if (date === '' || title === '' || typeof weather === 'undefined') {
      console.debug('diary date is empty');
      return;
    }
    if (currentDiary.meta.date !== date) {
      alert('date changed');
      return;
    }
    if (currentDiary.meta.weather === weather && currentDiary.meta.title === title && currentDiary.content === content) {
      console.debug('diary data unchanged');
      return;
    }

    currentDiary.meta.weather = weather;
    currentDiary.meta.title = title;
    currentDiary.content = content;

    fetch('/diary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentDiary),
    })
      .then((res) => res.json())
      .then((diary) => {
        console.log('saved Diary', diary);
        currentDiary = diary;
        markDiaryDates();
      });
  }

  // ======== utilities ========

  function getDay(diaryDate) {
    return new Intl.DateTimeFormat('ko-KR', { weekday: 'short' }).format(new Date(diaryDate));
  }
})();
