import './lib/SseConnector';
import { sortable } from './lib/TableUtils';
import './lib/ThemeListener';
import SideNavBar from './nav/SideNavBar';
import './page.flay-girls.scss';
import { appendStyle } from './util/componentCssLoader';

class Page {
  constructor() {
    appendStyle();
    document.querySelector('body').prepend(new SideNavBar());
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
      return a2.list.length - a1.list.length;
    });
    console.log(actressInfos[0]);

    const UL = document.querySelector('ul');

    for (const info of actressInfos) {
      const list = info.list;
      const name = info.name;
      const actress = await fetch('/info/actress/' + name).then((res) => res.json());
      const topFlay = this.#getTopFlay(list);
      const age = this.#calcAge(actress.birth);
      const flaySize = list.length;
      const shotSize = list.filter((flay) => flay.video.likes?.length > 0).length;

      const LI = UL.appendChild(document.createElement('li'));
      LI.innerHTML = `
      <label class="cover" data-opus="${topFlay.opus}" style="background-image: url('/static/cover/${topFlay.opus}')">&nbsp;</label>
      <label class="name" data-name="${name}"><a>${name}</a></label>
      <label class="age">${age}</label>
      <label class="flay-size">${flaySize}</label>
      <label class="shot-size">${shotSize}</label>
      `;
      LI.addEventListener('click', (e) => {
        const label = e.target.closest('label');
        if (label?.classList.contains('cover')) {
          window.open('popup.flay.html?opus=' + label.dataset.opus, 'popup.' + label.dataset.opus, 'width=800px,height=1280px');
        } else if (label?.classList.contains('name') && e.target.tagName === 'A') {
          window.open('popup.actress.html?name=' + label.dataset.name, label.dataset.name, 'width=960px,height=1200px');
        }
      });
    }

    sortable(UL);
  }

  #calcAge(birth) {
    const year = birth?.substring(0, 4);
    if (isNaN(year) && year !== '') {
      return '&nbsp;';
    } else {
      return new Date().getFullYear() - parseInt(year) + 1;
    }
  }

  /**
   *
   * @param {flay[]} list
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
}

new Page().start();
