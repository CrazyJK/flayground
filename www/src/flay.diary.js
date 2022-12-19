import Editor from '@toast-ui/editor';
import colorSyntax from '@toast-ui/editor-plugin-color-syntax';
import './components/FlayMenu';
import { LocalStorageItem } from './lib/crazy.common.js';
import { loading } from './lib/flay.loading.js';
import { restCall } from './lib/flay.rest.service.js';

import './css/common.scss';
import './flay.diary.scss';

let currentDiary = { date: '', weather: '', title: '', content: '', created: null, lastModified: null };

const diaryMeta = document.querySelector('#diaryMeta');
const diaryTitle = document.querySelector('#diaryTitle');
const diaryDate = document.querySelector('#diaryDate');
const diaryDay = document.querySelector('#diaryDay');
const diaryEditor = new Editor({
  el: document.querySelector('#diaryEditor'),
  height: '100%',
  minHeight: '300px',
  initialEditType: 'wysiwyg',
  previewStyle: 'vertical',
  theme: LocalStorageItem.get('flay.bgtheme', 'dark'),
  hideModeSwitch: true,
  autofocus: false,
  plugins: [colorSyntax],
  events: {
    load: (editor) => {
      console.debug('load', editor);
    },
    change: (mode) => {
      console.debug('change', mode);
    },
    blur: (mode) => {
      console.debug('blur', mode);
      saveDiary();
    },
  },
});
diaryEditor.hide();

renderCalendar();
markDiaryDates();
addCalendarEventListener();
addDiaryEventListener();

/**
 * 화면에 달력 표현
 */
function renderCalendar() {
  const renderingMonthSize = Math.floor(document.querySelector('#diaryCal').clientWidth / (14 * 16));
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();

  let html = '';
  for (let r = 0; r < renderingMonthSize; r++) {
    console.debug('rendering', r);

    const refDate = new Date(today.getFullYear(), today.getMonth() - r, today.getDate());
    const refYear = refDate.getFullYear();
    const refMonth = refDate.getMonth();
    const refDay = refDate.getDate();
    const refDayOfWeek = refDate.getDay();
    console.debug('today', refYear, refMonth, refDay, refDayOfWeek);

    const firstDateOfMonth = new Date(refYear, refMonth, 1);
    const firstDayOfMonth = firstDateOfMonth.getDay();
    console.debug('first of month', firstDateOfMonth.toLocaleDateString(), firstDayOfMonth);

    const firstDateOfCalendar = new Date(refYear, refMonth, 1 - firstDayOfMonth);
    console.debug('first date of calendar', firstDateOfCalendar.toLocaleDateString());

    const lastDateOfMonth = new Date(refYear, refMonth + 1, 0);
    const lastDayOfMonth = lastDateOfMonth.getDay();
    console.debug('last date of month', lastDateOfMonth.toLocaleDateString(), lastDayOfMonth);

    const lastDateOfCalendar = new Date(refYear, refMonth + 1, 6 - lastDayOfMonth);
    console.debug('last date of calendar', lastDateOfCalendar.toLocaleDateString());

    const diffDay = Math.abs((lastDateOfCalendar - firstDateOfCalendar) / (1000 * 60 * 60 * 24)) + 1;
    console.debug('diff day', diffDay);

    const dates = [];
    for (let i = 0; i < diffDay; i++) {
      const date = new Date(refYear, refMonth, 1 - firstDayOfMonth + i);
      console.debug(date.toLocaleDateString());

      dates.push(date);
    }

    html += `
      <div class="month">
        <h5 class="month-name">${new Intl.DateTimeFormat('en-US', { month: 'long' }).format(refDate)}</h5>
        <div class="dates">${dates
          .map((date) => {
            const year = date.getFullYear();
            const month = date.getMonth();
            const day = date.getDate();

            const yyyymmdd = `${year}-${month + 1}-${day < 10 ? '0' + day : day}`;
            const isSameMonth = refYear === year && refMonth === month;
            const isToday = todayYear === year && todayMonth === month && todayDay === day;

            return `<div class="date ${isSameMonth ? 'ref' : 'side'} ${isToday ? 'today' : ''}"
                title="${date.toLocaleDateString()}"
                id="d-${isSameMonth ? yyyymmdd : ''}">${day}</div>`;
          })
          .join('')}
        </div>
      </div>`;
  }

  document.querySelector('.calendar').innerHTML = html;
}

/**
 * 달력 클릭 이벤트
 */
function addCalendarEventListener() {
  document.querySelector('.calendar').addEventListener('click', (e) => {
    console.debug('click Calendar date');

    // 클릭 이벤트에서 label node 찾기
    let clickedDate;
    if (e.target.nodeName === 'DIV') {
      clickedDate = e.target;
    } else if (e.target.nodeName === 'I') {
      clickedDate = e.target.parentNode;
    } else {
      throw Error('not found label');
    }

    // ref 날이 아니면, path
    if (!clickedDate.classList.contains('ref')) {
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
      loadDiary({
        title: '',
        date: date,
        weather: 'sunny',
        content: '',
      });
    }
  });
}

function addDiaryEventListener() {
  diaryTitle.addEventListener('blur', saveDiary);
  document.querySelectorAll('input[name="diaryWeather"]').forEach((weather) => {
    weather.addEventListener('click', saveDiary);
  });
  // 에디터 변경은 에디터에서 blur 함수 호출됨
}

/**
 * 일기쓴 날짜를 불러와 달력에 별 표시
 */
function markDiaryDates() {
  fetch('/diary/dates')
    .then((response) => response.json())
    .then((list) => {
      list.forEach((date) => {
        const dateElement = document.querySelector('#d-' + date);
        if (dateElement !== null) {
          const markerElement = document.createElement('i');
          markerElement.setAttribute('class', 'fa fa-star');

          dateElement.classList.add('written');
          dateElement.appendChild(markerElement);
        }
      });
    });
}

/**
 * 일기를 화면에 로딩
 * @param {*} diary
 */
function loadDiary(diary) {
  console.log('loadDiary', diary);

  currentDiary = diary;

  diaryTitle.value = diary.title;
  diaryDate.value = diary.date;
  diaryDay.innerHTML = getDay(diary.date);
  diaryEditor.setHTML(diary.content, false);
  document.querySelector('[name="diaryWeather"][value="' + diary.weather + '"]').checked = true;

  // 제목, 본문 show
  diaryEditor.show();
  diaryMeta.style.display = '';
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
  if (currentDiary.date !== date) {
    loading.error('date changed');
  }
  if (currentDiary.weather === weather && currentDiary.title === title && currentDiary.content === content) {
    console.debug('diary data unchanged');
    return;
  }

  // localStorage에 저장전 diary 저장
  LocalStorageItem.set(`diary-${Date.now()}`, JSON.stringify(currentDiary));
  // n일전 diary 삭제
  const today = Date.now();
  const offsetMs = 1000 * 60 * 60 * 24 * 3;
  LocalStorageItem.findStartsWith('diary-').forEach((item) => {
    // console.log('storage diary', item.key, item.value);
    const writtenMs = Number(item.key.split('-')[1]);
    if (today - writtenMs > offsetMs) {
      console.log('Storage에서 지난 일기 기록 삭제', item.key, item.value);
      LocalStorageItem.remove(item.key);
    }
  });

  currentDiary.weather = weather;
  currentDiary.title = title;
  currentDiary.content = content;

  restCall('/diary', { method: 'POST', data: currentDiary }, (diary) => {
    console.log('saved Diary', diary);
    markDiaryDates();
  });
}

// ======== utilities ========

function getDay(diaryDate) {
  return new Intl.DateTimeFormat('ko-KR', { weekday: 'short' }).format(new Date(diaryDate));
}
