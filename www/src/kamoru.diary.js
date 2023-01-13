/**
 * kamoru diary
 *
 * ref) toast-ui/editor. https://nhn.github.io/tui.editor/latest/
 */

import Editor from '@toast-ui/editor';
import colorSyntax from '@toast-ui/editor-plugin-color-syntax';

import FlayAttach from './components/FlayAttach';
import './components/FlayMenu';
import { GB, LocalStorageItem } from './lib/crazy.common.js';
import { loading } from './lib/flay.loading.js';
import { restCall } from './lib/flay.rest.service.js';

import './kamoru.diary.scss';
import './styles/common.scss';

const newDiary = { meta: { date: '', weather: '', title: '', created: null, lastModified: null, attachId: null }, content: '' };
let currentDiary = newDiary;

const gridDiary = document.querySelector('#grid-diary');
const diaryWrap = document.querySelector('#diaryWrap');
const diaryTitle = document.querySelector('#diaryTitle');
const diaryWeather = document.querySelector('#diaryWeather');
const diaryDate = document.querySelector('#diaryDate');
const diaryDay = document.querySelector('#diaryDay');
const diaryEditor = new Editor({
  el: document.querySelector('#diaryBody'),
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
const diaryAttch = document.querySelector('#diaryAttch');

// flay attach
// const flayAttach = diaryAttch.appendChild(document.createElement('flay-attach'));
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

renderCalendar();
addCalendarEventListener();
addDiaryEventListener();
addDiaryViewerEventListener();

/**
 * 화면에 달력 표현
 */
function renderCalendar() {
  const renderingMonthSize = Math.floor(document.querySelector('#diaryCal').clientWidth / (14 * 16));
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();

  const calendar = document.querySelector('.calendar');
  calendar.innerHTML = '';

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

    const month = document.createElement('div');
    month.setAttribute('class', 'month');
    month.innerHTML = `
      <h6 class="month-name">${refYear}. ${refMonth + 1}</h6>
      <div class="dates">${dates
        .map((date) => {
          const year = date.getFullYear();
          const month = date.getMonth();
          const day = date.getDate();

          const yyyymmdd = `${year}-${month + 1 < 10 ? '0' + (month + 1) : month + 1}-${day < 10 ? '0' + day : day}`;
          const isSameMonth = refYear === year && refMonth === month;
          const isToday = todayYear === year && todayMonth === month && todayDay === day;

          return `<div class="date ${isSameMonth ? 'ref' : 'side'} ${isToday ? 'today' : ''}"
              title="${date.toLocaleDateString()}"
              id="d-${isSameMonth ? yyyymmdd : ''}">${day}</div>`;
        })
        .join('')}
      </div>`;

    calendar.appendChild(month);
  }

  markDiaryDates();
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
      newDiary.meta.attachId = null;
      newDiary.meta.date = date;
      newDiary.meta.weather = 'sunny';
      loadDiary(newDiary);
    }
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
  document.getElementById('diaryViewerClose').addEventListener('click', (e) => {
    document.getElementById('diaryViewer').style.display = 'none';
  });
  // diary Viewer Show
  document.getElementById('diaryViewerShow').addEventListener('click', (e) => {
    Editor.factory({
      el: document.querySelector('#diaryViewerInner'),
      viewer: true,
      height: '100%',
      theme: LocalStorageItem.get('flay.bgtheme', 'dark'),
      initialValue: diaryEditor.getHTML(),
    });
    document.getElementById('diaryViewer').style.display = 'block';
  });
}

/**
 * 일기쓴 날짜를 불러와 달력에 별 표시
 */
function markDiaryDates() {
  fetch('/diary/meta')
    .then((response) => response.json())
    .then((list) => {
      list.forEach((meta) => {
        const dateElement = document.querySelector('#d-' + meta.date);
        if (dateElement !== null) {
          const markerElement = document.createElement('i');
          markerElement.setAttribute('class', 'fa fa-star');
          markerElement.setAttribute('title', meta.title);

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

  gridDiary.style.display = 'block';
  diaryTitle.value = diary.meta.title; // title
  document.querySelector('[name="diaryWeather"][value="' + diary.meta.weather + '"]').checked = true; // weather
  diaryDay.innerHTML = getDay(diary.meta.date); // day of week
  diaryDate.value = diary.meta.date; // date
  diaryEditor.setHTML(diary.content, false); // content
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
    loading.error('date changed');
    return;
  }
  if (currentDiary.meta.weather === weather && currentDiary.meta.title === title && currentDiary.content === content) {
    console.debug('diary data unchanged');
    return;
  }

  // localStorage에 저장전 diary 저장
  try {
    LocalStorageItem.set(`diary-${Date.now()}`, JSON.stringify(currentDiary));
  } catch (e) {
    console.warn(e.message);
  }

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

  currentDiary.meta.weather = weather;
  currentDiary.meta.title = title;
  currentDiary.content = content;

  restCall('/diary', { method: 'POST', data: currentDiary }, (diary) => {
    console.log('saved Diary', diary);
    currentDiary = diary;
    markDiaryDates();
  });
}

// ======== utilities ========

function getDay(diaryDate) {
  return new Intl.DateTimeFormat('ko-KR', { weekday: 'short' }).format(new Date(diaryDate));
}
