import FlayFetch from '../lib/FlayFetch';
import { popupFlay } from '../lib/FlaySearch';
import './inc/Page';
import './index.scss';

void import(/* webpackChunkName: "FacadeWebMovie" */ '@movie/FacadeWebMovie')
  .then(({ FacadeWebMovie }) => new FacadeWebMovie())
  .then((facadeWebMovie) => document.querySelector('body > main')!.appendChild(facadeWebMovie))
  .then((facadeWebMovie) => facadeWebMovie.isEnded())
  .then(() => showLikesList())
  .then(() => {
    void import(/* webpackChunkName: "FlayMarkerFloat" */ '@flay/panel/FlayMarkerFloat')
      .then(({ FlayMarkerFloat }) => new FlayMarkerFloat())
      .then((flayMarkerFloat) => document.body.appendChild(flayMarkerFloat))
      .then((flayMarkerFloat) => {
        flayMarkerFloat.addEventListener('changeFlay', (event) => {
          const { randomFlay } = (event as CustomEvent).detail;
          const element = document.body.querySelector('[data-opus="' + randomFlay.opus + '"]');
          if (element) {
            element.classList.add('highlight');
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        });
      });

    void import(/* webpackChunkName: "ImageCircle" */ '@image/ImageCircle')
      .then(({ ImageCircle }) => new ImageCircle({ rem: 10, duration: 2000, eventAllow: true }))
      .then((imageCircle) => document.body.appendChild(imageCircle))
      .then((imageCircle) => {
        imageCircle.classList.add('right-bottom');
        imageCircle.addExtraStyles(`image-circle { opacity: 0.5; transition: opacity 0.3s ease-in-out; } image-circle:hover { opacity: 1; }`);
      });
  });

const showLikesList = async () => {
  return FlayFetch.getFlayAll()
    .then((flays) => {
      return flays
        .filter((flay) => flay.video.rank > 0 && flay.video.likes?.length > 0)
        .sort((f1, f2) => {
          const rankDiff = f2.video.rank - f1.video.rank;
          if (rankDiff !== 0) return rankDiff;
          const likeDiff = (f2.video.likes?.length || 0) - (f1.video.likes?.length || 0);
          if (likeDiff !== 0) return likeDiff;
          const playDiff = f2.video.play - f1.video.play;
          if (playDiff !== 0) return playDiff;
          return 0;
        });
    })
    .then((flays) => {
      const createItem = (no: number | string, opus: string, title: string, actress: string[], rank: number | string, likes: number | string, plays: number | string) => `
        <span class="no">${no}</span>
        <span class="opus">${opus}</span>
        <span class="title">${title}</span>
        <span class="actress">${actress.join(', ')}</span>
        <span class="rank">${rank}</span>
        <span class="likes">${likes}</span>
        <span class="plays">${plays}</span>`;

      const fragment = document.createDocumentFragment();
      const ul = document.querySelector('body > main > #likesList')!.appendChild(document.createElement('ul'));

      const li = document.createElement('li');
      li.innerHTML = createItem('No', 'Opus', 'Title', ['Actress'], 'Rank', 'Likes', 'Plays');
      li.classList.add('header');
      fragment.appendChild(li);

      let idx = 0;
      for (const flay of flays) {
        const playCount = flay.video.play;
        const likeCount = flay.video.likes.length;

        const li = document.createElement('li');
        li.innerHTML = createItem(++idx, flay.opus, flay.title, flay.actressList, flay.video.rank, likeCount, playCount);
        li.dataset.opus = flay.opus;
        fragment.appendChild(li);
      }
      ul.appendChild(fragment);

      ul.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        if (target.closest('li')) {
          const opus = target.closest('li')!.dataset.opus!;
          popupFlay(opus);
        }
      });
    });
};
