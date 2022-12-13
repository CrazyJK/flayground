import Editor from '@toast-ui/editor';
import 'bootstrap/dist/js/bootstrap';
import './components/FlayMenu';
import { LocalStorageItem } from './lib/crazy.common.js';
import { restCall } from './lib/flay.rest.service.js';

import './css/common.scss';
import './flay.diary.scss';

const weatherMap = {
  sunny: 'sun-o',
  cloud: 'cloud',
  rainy: 'tint',
  snowy: 'snowflake-o',
};

const diaryList = document.querySelector('#diaryList > .diary-list');
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

loadDiaryList();

/**
 * 일기 목록 로딩
 */
function loadDiaryList() {
  /**
   * 일기 목록에 요소 추가
   * @param {*} diary
   */
  function appendDiary(diary) {
    function getDay() {
      return new Intl.DateTimeFormat('ko-KR', { weekday: 'short' }).format(new Date(diary.date));
    }
    const labelElement = document.createElement('label');
    labelElement.textContent = diary.new ? 'new Diary' : diary.date.substring(2, 10) + ' (' + getDay() + ')';
    labelElement.setAttribute('date', diary.date);
    labelElement.setAttribute('title', diary.title);
    labelElement.addEventListener('click', (e) => {
      console.log('click Diary label', diary);

      // 클릭 이벤트에서 label node 찾기
      let clickedLabel;
      if (e.target.nodeName === 'LABEL') {
        clickedLabel = e.target;
      } else if (e.target.nodeName === 'I') {
        clickedLabel = e.target.parentNode;
      } else {
        throw Error('not found label');
      }

      // 중복 클릭 방지
      if (clickedLabel.classList.contains('active')) {
        return;
      }

      // 목록에서 클릭한 일기에 액티브 클래스 추가
      diaryList.childNodes.forEach((c) => {
        c.classList.remove('active');
      });
      clickedLabel.classList.add('active');

      // 일기를 화면에 로딩
      diaryTitle.value = diary.title;
      diaryDate.value = diary.date;
      diaryDay.innerHTML = getDay();
      document.querySelector('[name="diaryWeather"][value="' + diary.weather + '"]').click();
      diaryEditor.setHTML(diary.content, false);

      // 제목, 본문 쓰기 모드 설정
      diaryTitle.removeAttribute('readonly');
      diaryEditor.show();
    });

    if (!diary.new) {
      const weatherElement = document.createElement('i');
      weatherElement.setAttribute('class', 'fa fa-' + weatherMap[diary.weather]);
      labelElement.appendChild(weatherElement);
    }

    diaryList.prepend(labelElement);
  }

  const today = new Date().toLocaleDateString().replace(/. /g, '-').substring(0, 10);

  diaryList.replaceChildren();

  fetch('/diary')
    .then((response) => response.json())
    .then((list) => {
      list.forEach((diary) => appendDiary(diary));
      appendDiary({
        title: '',
        date: today,
        weather: 'sunny',
        content: '',
        new: true,
      });
    });
}

/**
 * 작성된 일기를 서버에 저장
 * @returns 제목, 날짜 필수
 */
function saveDiary() {
  const date = diaryDate.value;
  const title = diaryTitle.value;
  const weather = document.querySelector('[name="diaryWeather"]:checked')?.value;
  const content = diaryEditor.getHTML();

  if (date === '' || title === '' || typeof weather === 'undefined') {
    return;
  }

  const diary = {
    date: date,
    weather: weather,
    title: title,
    content: content,
  };

  console.log('saveDiary', diary);

  restCall('/diary', { method: 'POST', data: diary }, (diary) => {
    console.log('성공:', diary);
    loadDiaryList();
  });
}
