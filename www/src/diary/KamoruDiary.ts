import FlayAttach from '@attach/FlayAttach';
import { ToastHtmlEditor } from '@editor/ToastHtmlEditor';
import { ToastHtmlViewer } from '@editor/ToastHtmlViewer';
import ApiClient from '@lib/ApiClient';
import DateUtils from '@lib/DateUtils';
import weatherSVG from '@svg/weathers';
import windowButton from '@svg/windowButton';
import './KamoruDiary.scss';

const GB = 1024 * 1024 * 1024;

interface DiaryRecord {
  meta: {
    date: string;
    weather: string;
    title: string;
    created: string | null;
    lastModified: string | null;
    attachId: string | null;
  };
  content: string;
  date: string; // date 속성 추가
  title: string; // title 속성 추가
}

const defaultDiaryRecord: DiaryRecord = {
  meta: { date: '', weather: '', title: '', created: null, lastModified: null, attachId: null },
  content: '',
  date: '',
  title: '',
};

export class KamoruDiary extends HTMLElement {
  #currentDiary: DiaryRecord = defaultDiaryRecord;
  #diaryList: DiaryRecord[] = [];

  #diaryWriteContainer!: HTMLElement;
  #diaryTitle!: HTMLInputElement;
  #diaryDay!: HTMLLabelElement;
  #diaryDate!: HTMLInputElement;

  #diaryEditor!: ToastHtmlEditor;
  #flayAttach!: FlayAttach;

  constructor() {
    super();

    this.classList.add('kamoru-diary');
    this.innerHTML = this.template();
  }

  template() {
    return `
      <div id="calendarContainer"></div>
      <div id="diaryWriteContainer" style="display: none">
        <div id="diaryWrap">
          <div id="diaryMeta">
            <input id="diaryTitle" type="text" placeholder="Title..." />
            <div id="diaryWeather">
              <input type="radio" name="diaryWeather" id="weather-sunny" value="sunny" /><label for="weather-sunny" title="Sunny">${weatherSVG.sunny}</label>
              <input type="radio" name="diaryWeather" id="weather-cloud" value="cloud" /><label for="weather-cloud" title="Cloud">${weatherSVG.cloud}</label>
              <input type="radio" name="diaryWeather" id="weather-rainy" value="rainy" /><label for="weather-rainy" title="Rain">${weatherSVG.rain}</label>
              <input type="radio" name="diaryWeather" id="weather-snowy" value="snowy" /><label for="weather-snowy" title="Snow">${weatherSVG.snow}</label>
            </div>
            <div>
              <label id="diaryDay"></label>
            </div>
            <input id="diaryDate" type="date" readonly />
            <button type="button" id="diaryViewerShow">View</button>
          </div>
          <div id="diaryBody"></div>
          <div id="diaryAttach"></div>
        </div>
      </div>
      <div id="diaryReadContainer">
        <div id="diaryViewerInner"></div>
        <button type="button" id="diaryViewerClose">${windowButton.terminate}</button>
      </div>`;
  }

  async connectedCallback() {
    this.#diaryEditor = this.querySelector('#diaryBody')!.appendChild(new ToastHtmlEditor({ blur: () => this.saveDiary() }));
    this.#diaryEditor.hide();

    this.#flayAttach = this.querySelector('#diaryAttach')!.appendChild(
      new FlayAttach({
        id: 'diaryAttach',
        totalFileCount: 0,
        totalFileLength: GB * 1,
        attachChangeCallback: (attach: { id: string }) => {
          console.debug('attachChangeCallback', attach);
          this.#currentDiary.meta.attachId = attach.id;
        },
      })
    );

    this.#diaryWriteContainer = this.querySelector('#diaryWriteContainer')!;
    this.#diaryTitle = this.querySelector('#diaryTitle')!;
    this.#diaryDay = this.querySelector('#diaryDay')!;
    this.#diaryDate = this.querySelector('#diaryDate')!;

    await this.start();
  }

  async start() {
    const diaryListResult = await ApiClient.get('/diary/meta');
    this.#diaryList = (diaryListResult as DiaryRecord[]) ?? [];
    console.debug('fetched #diaryList', this.#diaryList);

    this.#renderCalendar();
    this.#markDiaryDates();

    this.#addDiaryLoadEvent(); // 일기 로드 이벤트
    this.#addDiarySaveEvent(); // 일기 저장 이벤트
    this.#addDiaryViewEvent(); // 일기 보기 이벤트
  }

  #renderCalendar() {
    if (this.#diaryList.length === 0) return;

    const dates = this.#diaryList.map((diary) => diary.date);
    if (dates.length === 0) return;

    const startStr = dates.reduce((min: string, d: string) => (d < min ? d : min), dates[0]!);
    const endStr = DateUtils.format(new Date(), 'yyyy-MM-dd');

    const container = this.querySelector('#calendarContainer')!;
    container.innerHTML = '';

    // 파싱: 시작 날짜와 종료 날짜 (형식: YYYY-MM-DD)
    const [startYear, startMonth] = startStr.split('-').map(Number);
    const [endYear, endMonth] = endStr.split('-').map(Number);
    const startDate = new Date(startYear!, startMonth! - 1, 1);
    const endDate = new Date(endYear!, endMonth! - 1, 1);

    // 시작부터 종료까지 월별 배열 (월은 오름차순)
    let current = new Date(startDate);
    const monthList: Date[] = [];
    while (current <= endDate) {
      monthList.push(new Date(current));
      current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    }

    // 연도별로 그룹핑 (연도는 시간 역순)
    const yearGroups: Record<number, Date[]> = {};
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
      const monthsForYear = yearGroups[year]?.sort((a: Date, b: Date) => a.getMonth() - b.getMonth()) ?? [];
      const yearContainer = document.createElement('div');
      yearContainer.classList.add('year-group');

      const yearHeader = document.createElement('h2');
      yearHeader.textContent = String(year);
      yearContainer.appendChild(yearHeader);

      monthsForYear.forEach((monthDate: Date) => {
        const y = monthDate.getFullYear();
        const m = monthDate.getMonth(); // 0-indexed
        const firstOfMonth = new Date(y, m, 1);
        const firstDayOfWeek = firstOfMonth.getDay();
        const startCalendar = new Date(y, m, 1 - firstDayOfWeek);

        const lastOfMonth = new Date(y, m + 1, 0);
        const lastDayOfWeek = lastOfMonth.getDay();
        const endCalendar = new Date(y, m, lastOfMonth.getDate() + (6 - lastDayOfWeek));

        // 생성할 날짜 배열
        const totalDays = Math.round((endCalendar.getTime() - startCalendar.getTime()) / (1000 * 60 * 60 * 24)) + 1;
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

        dates.forEach((date) => {
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
          span.textContent = String(date.getDate());
          dateDiv.appendChild(span);
          datesDiv.appendChild(dateDiv);
        });

        monthDiv.appendChild(datesDiv);
        yearContainer.appendChild(monthDiv);
      });
      container.appendChild(yearContainer);
    });

    // 오늘날짜(endStr)에 today 클래스 추가
    this.querySelector(`#d-${endStr}`)?.classList.add('today');
  }

  #markDiaryDates() {
    this.#diaryList.forEach((diary) => {
      const dateElement = this.querySelector('#d-' + diary.date);
      dateElement?.classList.add('written');
      dateElement?.setAttribute('title', diary.title);
    });
  }

  #addDiaryLoadEvent() {
    this.querySelectorAll('.dates .date.current').forEach((date) => {
      date.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const clickedDate = target.closest('.date');
        console.debug('click Calendar date', clickedDate);

        if (!clickedDate) return;

        // 중복 클릭 방지
        if (clickedDate.classList.contains('active')) return;

        // 목록에서 클릭한 일기에 액티브 클래스 추가
        this.querySelectorAll('.date.active').forEach((date) => date.classList.remove('active'));
        clickedDate.classList.add('active');

        const date = clickedDate.id.substring(2);
        if (clickedDate.classList.contains('written')) {
          void ApiClient.get('/diary/date/' + date).then((diary) => this.loadDiary(diary as DiaryRecord));
        } else {
          const newDiaryRecord: DiaryRecord = {
            meta: {
              date,
              weather: 'sunny',
              title: '',
              created: null,
              lastModified: null,
              attachId: null,
            },
            content: '',
            date,
            title: '',
          };
          this.loadDiary(newDiaryRecord);
        }
      });
    });
  }

  #addDiarySaveEvent() {
    this.#diaryTitle.addEventListener('blur', this.saveDiary);
    this.querySelectorAll('input[name="diaryWeather"]').forEach((weather) => weather.addEventListener('click', this.saveDiary));
    // 에디터 변경은 에디터에서 blur 함수 호출됨
  }

  #addDiaryViewEvent() {
    const diaryReadContainer = this.querySelector('#diaryReadContainer') as HTMLElement;
    // diary Viewer Close
    this.querySelector('#diaryViewerClose')!.addEventListener('click', () => {
      diaryReadContainer.style.display = 'none';
    });
    // diary Viewer Show
    this.querySelector('#diaryViewerShow')!.addEventListener('click', () => {
      let htmlViewer = this.querySelector('#diaryViewerInner .toast-html-viewer') as ToastHtmlViewer;
      if (htmlViewer === null) {
        htmlViewer = this.querySelector('#diaryViewerInner')!.appendChild(new ToastHtmlViewer());
      }
      htmlViewer.setHTML(this.#diaryEditor.getHTML());
      diaryReadContainer.style.display = 'block';
    });
  }

  loadDiary(diary: DiaryRecord) {
    console.log('loadDiary', diary);

    this.#currentDiary = diary;

    this.#diaryWriteContainer.style.display = 'block';
    this.#diaryTitle.value = diary.meta.title; // title
    (this.querySelector('[name="diaryWeather"][value="' + diary.meta.weather + '"]') as HTMLInputElement).checked = true; // weather
    this.#diaryDay.innerHTML = DateUtils.getDayOfWeek(diary.meta.date); // day of week
    this.#diaryDate.value = diary.meta.date; // date
    this.#diaryEditor.setEditorHTML(diary.content); // content
    this.#diaryEditor.show();
    this.#flayAttach.initiate(diary.meta.attachId ?? '', 'DIARY', diary.meta.date); // attach
  }

  saveDiary() {
    console.debug('saveDiary');

    const date = this.#diaryDate.value;
    const title = this.#diaryTitle.value;
    const weather = (this.querySelector('[name="diaryWeather"]:checked') as HTMLInputElement)?.value;
    const content = this.#diaryEditor.getHTML();

    if (date === '' || title === '' || typeof weather === 'undefined') {
      console.debug('diary date is empty');
      return;
    }
    if (this.#currentDiary.meta.date !== date) {
      alert('date changed');
      return;
    }
    if (this.#currentDiary.meta.weather === weather && this.#currentDiary.meta.title === title && this.#currentDiary.content === content) {
      console.debug('diary data unchanged');
      return;
    }

    this.#currentDiary.meta.weather = weather;
    this.#currentDiary.meta.title = title;
    this.#currentDiary.content = content;

    void ApiClient.post('/diary', { data: this.#currentDiary }).then((diary: unknown) => {
      const savedDiary = diary as DiaryRecord;
      console.log('saved Diary', savedDiary);
      this.#currentDiary = savedDiary;
      this.#markDiaryDates();
    });
  }
}

customElements.define('kamoru-diary', KamoruDiary);
