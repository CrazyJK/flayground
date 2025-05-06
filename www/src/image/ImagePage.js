import '@image/part/ImageFrame';
import ApiClient from '@lib/ApiClient';
import DateUtils from '@lib/DateUtils';
import FileUtils from '@lib/FileUtils';
import FlayFetch from '@lib/FlayFetch';
import { lazyLoadBackgroundImage } from '@lib/ImageLazyLoad';
import './ImagePage.scss';

export class ImagePage extends HTMLDivElement {
  constructor() {
    super();
    this.classList.add('image-page');
    this.innerHTML = this.template();
  }

  template() {
    return `
      <header>
        <label id="path">Image path</label>
        <label id="count">Image count</label>
        <button type="button" role="enlarge">┼</button>
        <button type="button" role="shrink">━</button>
      </header>
      <div class="resizable-container">
        <main>
          <article class="size-200"></article>
          <div class="preview">
            <div is="image-frame" class="image-frame"></div>
          </div>
        </main>
        <div class="resizer"></div>
        <aside class="folder-tree">
          <div id="root"></div>
        </aside>
      </div>`;
  }

  connectedCallback() {
    this.loadImages();
    this.registerUIEvents();
    this.registerResizeEvents();
  }

  loadImages() {
    FlayFetch.getImageAll().then((list) => {
      const imagePathMap = this.groupImagesByPath(list);
      this.buildFolderTree(imagePathMap);
      this.addCollapseBehavior();
    });
  }

  groupImagesByPath(list) {
    const map = new Map();
    list.forEach((image) => {
      const group = map.get(image.path) || [];
      group.push(image);
      map.set(image.path, group);
    });
    return map;
  }

  static encodeID(s) {
    return s.replace(/:/gi, '：').replace(/ /gi, '□').replace(/#/gi, '＃');
  }

  static decodeID(s) {
    return s.replace(/：/gi, ':').replace(/□/gi, ' ').replace(/＃/gi, '#');
  }

  buildFolderTree(imagePathMap) {
    const sortedEntries = [...imagePathMap.entries()].sort();
    sortedEntries.forEach(([imagePath, images]) => {
      const idArray = imagePath.split('\\').map(ImagePage.encodeID);
      let parentId = 'root';
      let currentId = '';

      idArray.forEach((idPart, idx) => {
        currentId = idx === 0 ? idPart : `${currentId}_${idPart}`;
        let folderDiv = this.querySelector('#' + currentId);
        if (!folderDiv) {
          const parentElement = this.querySelector('#' + parentId) || this;
          folderDiv = parentElement.appendChild(document.createElement('div'));
          folderDiv.id = currentId;
          folderDiv.title = imagePath;
          const folderLabel = folderDiv.appendChild(document.createElement('label'));
          folderLabel.appendChild(document.createElement('span'));
          const nameLabel = folderLabel.appendChild(document.createElement('a'));
          nameLabel.innerHTML = ImagePage.decodeID(idPart);

          if (idx === idArray.length - 1) {
            nameLabel.innerHTML += ` <i>(${images.length})</i>`;
            nameLabel.addEventListener('click', () => {
              this.renderImage(images);
              this.deactivateActiveLinks();
              nameLabel.classList.add('active');
            });
          }
        }
        parentId = currentId;
      });
    });
  }

  deactivateActiveLinks() {
    this.querySelectorAll('a.active').forEach((a) => a.classList.remove('active'));
  }

  addCollapseBehavior() {
    this.querySelectorAll('.folder-tree div:not(#root)').forEach((div) => {
      const span = div.querySelector('span');
      if (div.querySelectorAll('div').length > 0) {
        span.addEventListener('click', (e) => {
          e.target.closest('div').classList.toggle('fold');
        });
      } else {
        span.classList.add('no-child');
      }
    });
  }

  registerUIEvents() {
    // Adjust article size on click.
    this.querySelectorAll('main header button').forEach((button) =>
      button.addEventListener('click', (e) => {
        this.adjustArticleSize(e.target.getAttribute('role'));
      })
    );

    // Hide preview layer when clicked.
    const previewLayer = this.querySelector('.preview');
    if (previewLayer) {
      previewLayer.addEventListener('click', (e) => {
        e.target.classList.remove('show');
      });
    }
  }

  registerResizeEvents() {
    const resizableContainer = this.querySelector('.resizable-container');
    const resizer = this.querySelector('.resizer');
    const folderTree = this.querySelector('.folder-tree');
    let startX = 0;
    let startWidth = 0;

    const onMouseMove = (e) => {
      const newWidth = Math.max(100, startWidth - (e.clientX - startX) + 4);
      resizableContainer.style.gridTemplateColumns = `1fr 5px ${newWidth}px`;
    };

    const onMouseUp = () => {
      resizer.classList.remove('resizing');
      document.documentElement.style.cursor = '';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    resizer.addEventListener('mousedown', (e) => {
      resizer.classList.add('resizing');
      startX = e.clientX;
      startWidth = folderTree.clientWidth;
      document.documentElement.style.cursor = 'col-resize';
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  }

  adjustArticleSize(action) {
    const article = this.querySelector('article');
    if (!article) return;
    const currentClass = article.className;
    const maxSize = Math.ceil(article.clientWidth / 50) * 50;
    let size = parseInt(currentClass.substring(5), 10);
    size += action === 'enlarge' ? 50 : -50;
    size = Math.min(maxSize, Math.max(100, size));
    article.classList.replace(currentClass, 'size-' + size);
  }

  renderImage(images) {
    console.debug(images);
    const pathLabel = this.querySelector('#path');
    if (pathLabel) pathLabel.innerHTML = images[0].path;

    const countLabel = this.querySelector('#count');
    if (countLabel) countLabel.innerHTML = `${images.length} <small>images</small>`;

    const previewLayer = this.querySelector('.preview');
    previewLayer && previewLayer.classList.remove('show');

    const imageFrame = this.querySelector('.image-frame');
    const article = this.querySelector('article');
    if (article) article.textContent = '';

    images.forEach((image) => {
      const item = article.appendChild(document.createElement('div'));
      item.dataset.lazyBackgroundImageUrl = ApiClient.buildUrl(`/static/image/${image.idx}`);
      item.title = `#${image.idx} - ${image.name} - ${FileUtils.prettySize(image.length).join(' ')} - ${DateUtils.format(image.modified, 'yyyy-MM-dd')}`;
      item.addEventListener('click', () => {
        imageFrame.set(image.idx);
        previewLayer && previewLayer.classList.add('show');
      });
    });

    if (article.firstChild) {
      article.firstChild.scrollIntoView(false);
    }
    lazyLoadBackgroundImage();
  }
}

// Register the custom element (extending a built-in div element).
customElements.define('image-page', ImagePage, { extends: 'div' });
