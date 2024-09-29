import { addLazyLoadBackgrungImage } from '../lib/ImageLazyLoad';
import { sortable } from '../lib/TableUtils';
import { popupActress, popupFlay } from '../util/FlaySearch';
import './FlayGirls.scss';

export default class FlayGirls extends HTMLDivElement {
  constructor() {
    super();

    this.classList.add('flay-girls');
    this.innerHTML = `
      <ul>
        <li class="thead">
          <label class="cover">
            <a class="view-mode">List</a>
            <a class="list-simple">simple</a>
          </label>
          <label class="name">Name</label>
          <label class="age">Age</label>
          <label class="flay-count" title="Flay count">Flay</label>
          <label class="shot-flay-count" title="shot Flay count">Shot</label>
          <label class="shot-total-count" title="total Shot count">Shots</label>
        </li>
      </ul>
    `;

    this.start();
  }

  async start() {
    this.condition = {
      search: '',
      withSubtitles: false,
      withFavorite: false,
      withNoFavorite: false,
      rank: [],
      sort: 'RELEASE',
    };
    const flayList = await fetch('/flay').then((res) => res.json());
    const actressMap = Array.from(flayList).reduce((nameMap, flay) => {
      flay.actressList.forEach((name) => {
        if (!nameMap.has(name)) {
          nameMap.set(name, { name: name, list: [flay] });
        } else {
          nameMap.get(name).list.push(flay);
        }
      });
      return nameMap;
    }, new Map());

    const actressInfos = Array.from(actressMap.values());
    actressInfos.sort((a1, a2) => {
      return this.#getTotalShotCount(a2.list) - this.#getTotalShotCount(a1.list);
    });

    const UL = document.querySelector('ul');

    for (const info of actressInfos) {
      const list = info.list;
      const name = info.name;
      const actress = await fetch('/info/actress/' + name).then((res) => res.json());
      const topFlay = this.#getTopFlay(list);
      const age = this.#calcAge(actress.birth);
      const flayCount = list.length;
      const shotFlayCount = list.filter((flay) => flay.video.likes?.length > 0).length;
      const shotTotalCount = this.#getTotalShotCount(list);

      const LI = UL.appendChild(document.createElement('li'));
      LI.innerHTML = `
      <label class="cover" data-opus="${topFlay.opus}" title="${topFlay.opus} ${topFlay.title}" data-lazy-background-image-url="/static/cover/${topFlay.opus}">&nbsp;</label>
      <label class="name" data-name="${name}"><a>${name}</a></label>
      <label class="age">${age}</label>
      <label class="flay-count">${flayCount}</label>
      <label class="shot-flay-count">${shotFlayCount}</label>
      <label class="shot-total-count">${shotTotalCount}</label>
      `;
      LI.addEventListener('click', (e) => {
        const label = e.target.closest('label');
        if (label?.classList.contains('cover')) {
          popupFlay(label.dataset.opus);
        } else if (label?.classList.contains('name') && e.target.tagName === 'A') {
          popupActress(label.dataset.name);
        }
      });

      addLazyLoadBackgrungImage(LI);
    }

    document.querySelector('.thead .cover .list-simple').addEventListener('click', () => {
      document.querySelectorAll('ul li:not(.thead)').forEach((li) => {
        if (li.style.height === 'auto') {
          li.removeAttribute('style');
        } else {
          li.style.height = 'auto';
        }
      });
    });

    document.querySelector('.thead .cover .view-mode').addEventListener('click', (e) => {
      const viewMode = UL.classList.toggle('box');
      e.target.innerHTML = viewMode ? 'Box' : 'List';
      document.querySelector('.thead .cover .list-simple').innerHTML = viewMode ? '' : 'simple';
    });

    sortable(UL, { noSort: [0], initSortIndex: 5 });
  }

  /**
   *
   * @param {string} birth
   * @returns {number} age
   */
  #calcAge(birth) {
    const age = new Date().getFullYear() - parseInt(birth?.substring(0, 4)) + 1;
    return isNaN(age) ? 0 : age;
  }

  /**
   *
   * @param {flay[]} list
   * @returns {flay} top flay
   */
  #getTopFlay(list) {
    return list.sort((f1, f2) => {
      let ret = f1.actressList.length - f2.actressList.length;
      if (ret === 0) {
        ret = f2.video.rank - f1.video.rank;
        if (ret === 0) {
          const l1 = f1.video.likes?.length > 0 ? f1.video.likes.length : 0;
          const l2 = f2.video.likes?.length > 0 ? f2.video.likes.length : 0;
          ret = l2 - l1;
        }
      }
      return ret;
    })[0];
  }

  /**
   *
   * @param {flay[]} flayList
   * @returns {number} sum of shot count
   */
  #getTotalShotCount(flayList) {
    return flayList.reduce((sum, flay) => {
      sum += flay.video.likes?.length > 0 ? flay.video.likes.length : 0;
      return sum;
    }, 0);
  }
}

customElements.define('flay-girls', FlayGirls, { extends: 'div' });
