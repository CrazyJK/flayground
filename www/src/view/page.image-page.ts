import { tabUI } from '@lib/TabUI';
import './inc/Page';
import './page.image-page.scss';

Promise.all([
  import(/* webpackChunkName: "ImageOne" */ '@image/ImageOne'),
  import(/* webpackChunkName: "ImagePage" */ '@image/ImagePage'),
  import(/* webpackChunkName: "ImageFall" */ '@image/ImageFall'),
  import(/* webpackChunkName: "ImageCircle" */ '@image/ImageCircle'),
  import(/* webpackChunkName: "ImageMask" */ '@image/ImageMask'),
  import(/* webpackChunkName: "ImageThumbnail" */ '@image/ImageThumbnail'),
]).then(([{ ImageOne }, { ImagePage }, { ImageFall }, { ImageCircle }, { ImageMask }, { ImageThumbnail }]) => {
  const componentClasses = [ImageOne, ImagePage, ImageFall, ImageCircle, ImageMask, ImageThumbnail];
  const componentInstances = componentClasses.map((Component) => new Component());
  const activeIndex = 0;

  document.body.innerHTML += `
  <header>
    <div role="tablist">
      ${componentClasses
        .map((component, index) => {
          return `
            <button role="tab" data-idx=${index} target="#panel${index}" ${index === activeIndex ? 'active' : ''}>
              ${component.name.replace('Image', '')}
            </button>`;
        })
        .join('')}
    </div>
  </header>
  <main></main>
  `;

  document.body.addEventListener('tabActivated', (event: CustomEvent) => {
    const { tab, panel } = event.detail;
    console.log('Tab activated:', tab, 'Panel activated:', panel);

    const index = parseInt(tab.getAttribute('data-idx') || '0', 10);

    const main = document.querySelector('main');
    main.innerHTML = '';
    main.appendChild(componentInstances[index]);
  });

  tabUI(document.body);
});
