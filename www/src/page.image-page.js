import './image/part/ImageFrame';
import { lazyLoadBackgrungImage } from './lib/ImageLazyLoad';
import './lib/ThemeListener';
import SideNavBar from './nav/SideNavBar';
import './page.image-page.scss';
import { appendStyle } from './util/componentCssLoader';
import { dateFormat } from './util/dateUtils';
import { getPrettyFilesize } from './util/fileUtils';

appendStyle();
document.querySelector('body').prepend(new SideNavBar());

fetch('/image')
  .then((res) => res.json())
  .then((list) => {
    console.debug(list);
    // [{ idx, name, path, length, modified, file }]
    const imagePathMap = new Map();
    Array.from(list).forEach((image, i) => {
      let images = imagePathMap.get(image.path);
      if (!images) {
        images = [];
        imagePathMap.set(image.path, images);
      }
      images.push(image);
    });
    console.debug(imagePathMap);

    const wrapper = document.querySelector('aside');
    const root = wrapper.appendChild(document.createElement('div'));
    root.id = 'root';

    const ID = {
      encode: (s) => s.replace(/:/gi, '：').replace(/ /gi, '□').replace(/#/gi, '＃'),
      decode: (s) => s.replace(/：/gi, ':').replace(/□/gi, ' ').replace(/＃/gi, '#'),
    };

    new Map([...imagePathMap].sort()).forEach((images, imagePath) => {
      const idArray = imagePath.split('\\').map((p) => ID.encode(p));

      let parentId = root.id;
      let currentId = '';
      for (let i = 0; i < idArray.length; i++) {
        if (i === 0) {
          currentId = idArray[i];
        } else {
          parentId = currentId;
          currentId += '_' + idArray[i];
        }

        let folderDiv = wrapper.querySelector('#' + currentId);
        if (!folderDiv) {
          folderDiv = wrapper.querySelector('#' + parentId).appendChild(document.createElement('div'));
          folderDiv.id = currentId;
          folderDiv.title = imagePath;

          const folderLabel = folderDiv.appendChild(document.createElement('label'));

          folderLabel.appendChild(document.createElement('span'));

          const nameLabel = folderLabel.appendChild(document.createElement('a'));
          nameLabel.innerHTML = ID.decode(idArray[i]);

          if (i === idArray.length - 1) {
            nameLabel.innerHTML += ' (' + images.length + ')';
            nameLabel.addEventListener('click', () => {
              renderImage(images);
              wrapper.querySelectorAll('a.active').forEach((a) => a.classList.remove('active'));
              nameLabel.classList.add('active');
            });
          }
        }
      }
    });

    wrapper.querySelectorAll('div:not(#root)').forEach((div) => {
      // children 있으면, fold 이벤트 추가
      if (div.querySelectorAll('div').length > 0) {
        div.querySelector('span').addEventListener('click', (e) => {
          e.target.closest('div').classList.toggle('fold');
        });
      } else {
        div.querySelector('span').classList.add('no-child');
      }
    });
  });

const renderImage = async (images) => {
  console.debug(images);

  const pathLabel = document.querySelector('#path');
  pathLabel.innerHTML = images[0].path;

  const countLabel = document.querySelector('#count');
  countLabel.innerHTML = images.length + ' <small>images</small>';

  const previewLayer = document.querySelector('.preview');
  previewLayer.classList.remove('show');
  const imageFrame = document.querySelector('image-frame');

  const article = document.querySelector('article');
  article.textContent = null;

  for (const image of images) {
    const item = article.appendChild(document.createElement('div'));
    item.dataset.lazyBackgroundImageUrl = `/static/image/${image.idx}`;
    item.title = `#${image.idx} - ${image.name} - ${getPrettyFilesize(image.length).join(' ')} - ${dateFormat(image.modified, 'yyyy-mm-dd')}`;
    item.addEventListener('click', () => {
      imageFrame.set(image.idx);
      previewLayer.classList.add('show');
    });
  }

  lazyLoadBackgrungImage();
};

document.querySelectorAll('main header button').forEach((button) =>
  button.addEventListener('click', (e) => {
    const article = document.querySelector('main article');
    const currentClass = article.className;
    const maxSize = Math.ceil(article.clientWidth / 50) * 50;

    let size = parseInt(currentClass.substring(5));
    size += e.target.role === 'enlarge' ? 50 : -50;
    size = Math.min(size, maxSize);
    size = Math.max(100, size);

    article.classList.remove(currentClass);
    article.classList.add('size-' + size);
  })
);

document.querySelector('.preview').addEventListener('click', (e) => {
  e.target.classList.remove('show');
});
