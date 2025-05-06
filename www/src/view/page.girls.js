import ApiClient from '@lib/ApiClient';
import FlayFetch from '@lib/FlayFetch';
import { popupActress, popupFlay } from '@lib/FlaySearch';
import { addLazyLoadBackgroundImage } from '@lib/ImageLazyLoad';
import { sortable } from '@lib/TableUtils';
import favoriteSVG from '@svg/favorite';
import './inc/Page';
import './page.girls.scss';

class PageGirls {
  constructor() {
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
      const viewMode = document.querySelector('ul').classList.toggle('box');
      e.target.innerHTML = viewMode ? 'Box' : 'List';
      document.querySelector('.thead .cover .list-simple').innerHTML = viewMode ? '' : 'simple';
    });
  }

  async start() {
    const fragment = document.createDocumentFragment();

    Array.from(await FlayFetch.getFullyFlayList())
      .reduce((map, { flay, actress: actressList }) => {
        actressList.forEach((actress) => {
          if (!map.has(actress.name)) {
            map.set(actress.name, { actress: actress, flayList: [flay] });
          } else {
            map.get(actress.name).flayList.push(flay);
          }
        });
        return map;
      }, new Map())
      .forEach(({ actress, flayList }, name) => {
        const age = new Date().getFullYear() - parseInt(actress.birth?.substring(0, 4) || new Date().getFullYear() + 1) + 1;
        const flayCount = flayList.length;
        const shotFlayCount = flayList.filter((flay) => flay.video.likes?.length > 0).length;
        const { shotTotalCount, score } = flayList.reduce(
          (acc, flay) => {
            return {
              shotTotalCount: acc.shotTotalCount + (flay.video.likes?.length > 0 ? flay.video.likes.length : 0),
              score: acc.score + flay.score,
            };
          },
          { shotTotalCount: 0, score: 0 }
        );
        const topFlay = flayList.sort((f1, f2) => {
          let ret = f1.actressList.length - f2.actressList.length;
          if (ret === 0) {
            ret = f2.video.rank - f1.video.rank;
            if (ret === 0) {
              ret = (f2.video.likes?.length || 0) - (f1.video.likes?.length || 0);
            }
          }
          return ret;
        })[0];

        const LI = fragment.appendChild(document.createElement('li'));
        LI.innerHTML = `
          <label class="cover" title="${topFlay.opus} ${topFlay.title}" data-lazy-background-image-url="${ApiClient.buildUrl(`/static/cover/${topFlay.opus}`)}">&nbsp;</label>
          <label class="name"><span class="${actress.favorite ? 'fav' : ''}">${favoriteSVG}</span><a>${name}</a></label>
          <label class="age" title="나이">${age}</label>
          <label class="flay-count" title="Flay 수">${flayCount}</label>
          <label class="shot-flay-count" title="샷한 Flay 수">${shotFlayCount}</label>
          <label class="shot-total-count" title="전체 샷 수">${shotTotalCount}</label>
          <label class="total-score" title="스코어 합계">${score}</label>
        `;
        LI.querySelector('.cover').addEventListener('click', () => popupFlay(topFlay.opus));
        LI.querySelector('.name a').addEventListener('click', () => popupActress(name));
      });

    const UL = document.querySelector('ul');
    UL.appendChild(fragment);
    addLazyLoadBackgroundImage(UL);
    sortable(UL, { noSort: [0], initSortIndex: 6 });
  }
}

new PageGirls().start();
