import { ImageThumbnail } from '@/image/ImageThumbnail';
import { ImageCircle } from '@image/ImageCircle';
import { ImageFall } from '@image/ImageFall';
import { ImageMask } from '@image/ImageMask';
import { ImageOne } from '@image/ImageOne';
import { ImagePage } from '@image/ImagePage';
import { tabUI } from '@lib/TabUI';
import './inc/Page';
import './page.image-page.scss';

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
