import DateUtils from '../lib/DateUtils';
import './inc/Page';
import './page.history-play.scss';

class Page {
  constructor() {}

  async start() {
    const playHistories = await fetch('/info/history/find/action/PLAY').then((res) => res.json());

    const dateMap = Array.from(playHistories).reduce((map, history) => {
      const [date, opus] = [this.#getRefDate(history.date), history.opus];
      if (!map.has(date)) map.set(date, []);
      if (!map.get(date).includes(opus)) map.get(date).push(opus);
      return map;
    }, new Map());

    const dates = Array.from(dateMap.keys()).sort((d1, d2) => d1.localeCompare(d2));
    const [minYear, maxYear] = [Number(dates[0].substring(0, 4)), Number(dates[dates.length - 1].substring(0, 4))];

    const main = document.querySelector('body > main');
    for (let year = maxYear; year >= minYear; year--) {
      const yearArticle = main.appendChild(document.createElement('article'));
      yearArticle.id = 'y' + year;

      for (let d = 0; d < 366; d++) {
        const date = this.#getDateOfAddedDay(year, d);
        if (year !== date.getFullYear()) continue;

        const dayBar = yearArticle.appendChild(document.createElement('div'));
        dayBar.id = 'd' + DateUtils.format(date, 'yyyy-MM-dd');
        dayBar.innerHTML = '&nbsp;';
      }

      const legend = main.appendChild(document.createElement('h2'));
      legend.className = 'legend';
      legend.innerHTML = year;
    }

    dateMap.forEach((opusList, date) => {
      const dayBar = document.querySelector('#d' + date);
      dayBar.style.height = opusList.length * 8 + 'px';
      dayBar.title = `[${date}] ${opusList.length} played\n\n${opusList.join(', ')}`;
    });
  }

  #getRefDate(date) {
    const refDate = new Date(date);
    refDate.setHours(refDate.getHours() - 9);
    return refDate.toISOString().substring(0, 10);
  }

  #getDateOfAddedDay(year, day) {
    const date = new Date(String(year));
    date.setDate(date.getDate() + day);
    return date;
  }
}

new Page().start();
