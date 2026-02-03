import type { Actress, Flay } from '@lib/FlayFetch';
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
            margin: 0;
            padding: 1rem;
            z-index: 10;
          }
          main > table {
            border-collapse: collapse;
            width: 100%;
          }
          main > table th, main > table td {
            border: 1px solid var(--color-border);
            padding: 0.5rem;
            text-align: left;
          }
          main > table > thead {
            position: sticky;
            top: 0;
            background-color: var(--color-bg);
            z-index: 9;
          }
          main > table th:nth-child(1), main > table td:nth-child(1) {
            cursor: pointer;
            white-space: nowrap;
          }
          main > table td:nth-child(1):hover {
            text-shadow: var(--text-shadow-hover);
          }
          main > table th:nth-child(2), main > table td:nth-child(2) {
            text-align: center;
          }
          main > table th:nth-child(3), main > table td:nth-child(3),
          main > table th:nth-child(4), main > table td:nth-child(4) {
            text-align: right;
          }
          main > table th:nth-child(5), main > table td:nth-child(5) {
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
                <th>Actress</th>
                <th>Favorite</th>
                <th>Total</th>
                <th>Likes</th>
                <th>Flay Marker</th>
              </tr>
            </thead>
            <tbody>
            </tbody>
          </table>`;
        document.body.appendChild(main);

        const h1Height = main.querySelector('h1')!.offsetHeight;
        main.querySelector('thead')!.style.top = `${h1Height - 1}px`;

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
            flayList,
          })
        )
          .sort((a, b) => {
            let diff = b.flayLikesCount - a.flayLikesCount;
            if (diff === 0) diff = b.flayTotalCount - a.flayTotalCount;
            if (diff === 0) diff = Number(b.favorite) - Number(a.favorite);
            if (diff === 0) diff = a.name.localeCompare(b.name);
            return diff;
          })
          .forEach(({ name, favorite, flayTotalCount, flayLikesCount, flayList }) => {
            const tr = tbody.appendChild(document.createElement('tr'));
            tr.innerHTML = `
              <td>${name}</td>
              <td style="${favorite ? 'color: var(--color-checked)' : ''}">${favoriteSVG}</td>
              <td>${flayTotalCount}</td>
              <td>${flayLikesCount}</td>
              <td></td>`;
            tr.querySelector('td:last-child')!.append(...flayList.sort((a, b) => (b.video.likes?.length || 0) - (a.video.likes?.length || 0)).map((flay) => new FlayMarker(flay)));
            tr.querySelector('td:first-child')!.addEventListener('click', () => popupActress(name));
          });
      })
      .catch(console.error);
  });
