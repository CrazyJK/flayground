import FlayStorage from '@lib/FlayStorage';
import { tabUI } from '@lib/TabUI';
import './inc/Page';
import './page.image-page.scss';

void Promise.all([
  import(/* webpackChunkName: "ImageOne" */ '@image/ImageOne'),
  import(/* webpackChunkName: "ImagePage" */ '@image/ImagePage'),
  import(/* webpackChunkName: "ImageFall" */ '@image/ImageFall'),
  import(/* webpackChunkName: "ImageCircle" */ '@image/ImageCircle'),
  import(/* webpackChunkName: "ImageMask" */ '@image/ImageMask'),
  import(/* webpackChunkName: "ImageThumbnail" */ '@image/ImageThumbnail'),
  import(/* webpackChunkName: "ImageSequence" */ '@image/ImageSequence'),
]).then(([{ ImageOne }, { ImagePage }, { ImageFall }, { ImageCircle }, { ImageMask }, { ImageThumbnail }, { ImageSequence }]) => {
  const componentNames = ['One', 'Page', 'Fall', 'Circle', 'Mask', 'Thumbnail', 'Sequence'];
  const componentClasses = [ImageOne, ImagePage, ImageFall, ImageCircle, ImageMask, ImageThumbnail, ImageSequence];
  const componentInstances = componentClasses.map((Component) => new Component());
  const activeIndex = FlayStorage.local.getNumber('imagePageActiveIndex', 0);

  document.body.innerHTML += `
  <header>
    <div role="tablist">
      ${componentClasses
        .map((_, index) => {
          return `
            <button role="tab" data-idx=${index} target="#panel${index}" ${index === activeIndex ? 'active' : ''}>
              ${componentNames[index]}
            </button>`;
        })
        .join('')}
    </div>
  </header>
  <main></main>
  `;

  document.body.addEventListener('tabActivated', (event: Event) => {
    const { tab, panel } = (event as CustomEvent).detail;
    console.log('Tab activated:', tab, 'Panel activated:', panel);

    const index = parseInt(tab.getAttribute('data-idx') || '0', 10);

    const main = document.querySelector('main')!;
    main.innerHTML = '';
    main.appendChild(componentInstances[index]!);

    FlayStorage.local.set('imagePageActiveIndex', String(index));
  });

  tabUI(document.body);
});
