import type { Actress, Flay } from '@lib/FlayFetch';
import NumberUtils from '../lib/NumberUtils';
import './inc/Page';
import './index.scss';

import(/* webpackChunkName: "FacadeWebMovie" */ '@movie/FacadeWebMovie')
  .then(({ FacadeWebMovie }) => new FacadeWebMovie())
  .then((facadeWebMovie) => document.body.appendChild(facadeWebMovie))
  .then((facadeWebMovie) => facadeWebMovie.isEnded())
  .catch(console.error)
  .finally(() => {
    // Application is initialized

    Promise.all([import(/* webpackChunkName: "FlayMarker" */ '@flay/domain/FlayMarker'), import(/* webpackChunkName: "FlayFetch" */ '@lib/FlayFetch'), import(/* webpackChunkName: "FlaySearch" */ '@lib/FlaySearch'), import(/* webpackChunkName: "favorite" */ '@svg/favorite')])
      .then(async ([{ default: FlayMarker }, { default: FlayFetch }, { popupActress }, { default: favoriteSVG }]) => {
        return FlayFetch.getFullyFlayList().then((fullyFlayList) => ({ fullyFlayList, FlayMarker, FlayFetch, popupActress, favoriteSVG }));
      })
      .then(({ fullyFlayList, FlayMarker, popupActress, favoriteSVG }) => {
        const style = document.createElement('style');
        style.id = 'actress-flay-summary-style';
        style.textContent = `
          main {
            height: 100%;
            overflow: auto;
          }
          main > h1 {
            position: sticky;
            top: 0;
            background-color: var(--color-bg);
            min-height: 5rem;
            margin: 0;
            padding: 1rem;
            z-index: 10;
          }
          main > table {
            border-collapse: collapse;
            width: 100%;
          }
          main > table > thead {
            position: sticky;
            top: calc(5rem - 1px);
            background-color: var(--color-bg);
            z-index: 9;
          }
          main > table th,
          main > table td {
            border: 1px solid var(--color-border);
            padding: 0.5rem;
            text-align: left;
          }
          main > table td.name {
            cursor: pointer;
            white-space: nowrap;
          }
          main > table td.name:hover {
            text-shadow: var(--text-shadow-hover);
          }
          main > table td.favorite {
            text-align: center;
          }
          main > table td.count,
          main > table td.likes,
          main > table td.likes-sum,
          main > table td.score {
            text-align: right;
          }
          main > table td.flay-marker {
            width: auto;
          }
          main > table svg {
            height: 1.5rem;
          }`;
        document.head.appendChild(style);

        const main = document.createElement('main');
        main.innerHTML = `<h1>Actress Flay Summary</h1>
          <table>
            <thead>
              <tr>
                <th class="name">Actress</th>
                <th class="favorite">Fav.</th>
                <th class="count">Total</th>
                <th class="likes">Shot</th>
                <th class="likes-sum">Shots</th>
                <th class="score">Score</th>
                <th class="flay-marker">Flay</th>
              </tr>
            </thead>
            <tbody>
            </tbody>
          </table>`;
        document.body.appendChild(main);

        const tbody = main.querySelector('tbody')!;

        Array.from(
          fullyFlayList
            .flatMap(({ actress, flay }) => actress.map((a) => ({ actress: a, flay })))
            .reduce((map, { actress, flay }) => {
              const existing = map.get(actress.name);
              if (existing) {
                existing.flayList.push(flay);
              } else {
                map.set(actress.name, { actress, flayList: [flay] });
              }
              return map;
            }, new Map<string, { actress: Actress; flayList: Flay[] }>())
            .entries(),
          ([name, { actress, flayList }]) => ({
            name,
            favorite: actress.favorite,
            flayTotalCount: flayList.length,
            flayLikesCount: flayList.filter((flay) => flay.video.likes?.length > 0).length,
            flayLikesSum: flayList.reduce((sum, flay) => sum + (flay.video.likes?.length || 0), 0),
            flayScoreSum: flayList.reduce((sum, flay) => sum + (flay.score || 0), 0),
            flayList,
          })
        )
          .sort((a, b) => {
            let diff = 0;
            if (diff === 0) diff = b.flayScoreSum - a.flayScoreSum;
            if (diff === 0) diff = b.flayLikesSum - a.flayLikesSum;
            if (diff === 0) diff = b.flayLikesCount - a.flayLikesCount;
            if (diff === 0) diff = b.flayTotalCount - a.flayTotalCount;
            if (diff === 0) diff = Number(b.favorite) - Number(a.favorite);
            if (diff === 0) diff = a.name.localeCompare(b.name);
            return diff;
          })
          .forEach(({ name, favorite, flayTotalCount, flayLikesCount, flayLikesSum, flayScoreSum, flayList }) => {
            const tr = tbody.appendChild(document.createElement('tr'));
            tr.innerHTML = `
              <td class="name">${name}</td>
              <td class="favorite" style="${favorite ? 'color: var(--color-checked)' : ''}">${favoriteSVG}</td>
              <td class="count">${NumberUtils.formatWithCommas(flayTotalCount)}</td>
              <td class="likes">${NumberUtils.formatWithCommas(flayLikesCount)}</td>
              <td class="likes-sum">${NumberUtils.formatWithCommas(flayLikesSum)}</td>
              <td class="score">${NumberUtils.formatWithCommas(flayScoreSum)}</td>
              <td class="flay-marker"></td>`;
            tr.querySelector('.flay-marker')!.append(...flayList.sort((a, b) => (b.video.likes?.length || 0) - (a.video.likes?.length || 0)).map((flay) => new FlayMarker(flay)));
            tr.querySelector('.name')!.addEventListener('click', () => popupActress(name));
          });
      })
      .catch(console.error);
  });
