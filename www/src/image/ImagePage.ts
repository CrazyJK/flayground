import FlayDiv from '@flay/FlayDiv';
import '@image/part/ImageFrame';
import ImageFrame from '@image/part/ImageFrame';
import ApiClient from '@lib/ApiClient';
import DateUtils from '@lib/DateUtils';
import FileUtils from '@lib/FileUtils';
import FlayFetch, { ImageDomain } from '@lib/FlayFetch';
import { lazyLoadBackgroundImage } from '@lib/ImageLazyLoad';
import './ImagePage.scss';

// 이미지 정보 타입 정의 (사용하지 않음 - ImageDomain 사용)
// interface ImageInfo {
//   idx: number;
//   name: string;
//   path: string;
//   length: number;
//   modified: number;
// }

// 이벤트 리스너 추적 타입
interface EventListenerInfo {
  element: Element;
  event: string;
  handler: (event: Event) => void;
}

interface DocumentEventListenerInfo {
  event: string;
  handler: (event: Event) => void;
}

export class ImagePage extends FlayDiv {
  // 이벤트 리스너들을 추적하기 위한 변수들
  private eventListeners: EventListenerInfo[] = [];
  private documentEventListeners: DocumentEventListenerInfo[] = [];

  constructor() {
    super();
    this.classList.add('image-page');
    this.innerHTML = this.template();
  }

  template(): string {
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
            <image-frame class="image-frame"></image-frame>
          </div>
        </main>
        <div class="resizer"></div>
        <aside class="folder-tree">
          <div id="root"></div>
        </aside>
      </div>`;
  }

  connectedCallback(): void {
    this.loadImages();
    this.registerUIEvents();
    this.registerResizeEvents();
  }

  disconnectedCallback(): void {
    // 등록된 이벤트 리스너들 정리
    this.eventListeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.eventListeners = [];

    // document에 등록된 이벤트 리스너들 정리
    this.documentEventListeners.forEach(({ event, handler }) => {
      document.removeEventListener(event, handler);
    });
    this.documentEventListeners = [];

    // CSS 스타일 정리
    document.documentElement.style.cursor = '';

    // 동적으로 생성된 요소들의 이벤트 리스너 정리
    this.querySelectorAll('a').forEach((link) => {
      link.replaceWith(link.cloneNode(true)); // 이벤트 리스너 제거
    });

    this.querySelectorAll('.folder-tree div:not(#root) span').forEach((span) => {
      span.replaceWith(span.cloneNode(true)); // 이벤트 리스너 제거
    });

    this.querySelectorAll('article div').forEach((item) => {
      item.replaceWith(item.cloneNode(true)); // 이벤트 리스너 제거
    });

    console.debug('[ImagePage] Component disconnected and cleaned up');
  }

  loadImages(): void {
    void FlayFetch.getImageAll().then((list: ImageDomain[]) => {
      const imagePathMap = this.groupImagesByPath(list);
      this.buildFolderTree(imagePathMap);
      this.addCollapseBehavior();
    });
  }

  groupImagesByPath(list: ImageDomain[]): Map<string, ImageDomain[]> {
    const map = new Map<string, ImageDomain[]>();
    list.forEach((image) => {
      const group = map.get(image.path) ?? [];
      group.push(image);
      map.set(image.path, group);
    });
    return map;
  }

  static encodeID(s: string): string {
    return s.replace(/:/gi, '：').replace(/ /gi, '□').replace(/#/gi, '＃');
  }

  static decodeID(s: string): string {
    return s.replace(/：/gi, ':').replace(/□/gi, ' ').replace(/＃/gi, '#');
  }

  // 이벤트 리스너 등록 헬퍼 메서드
  addEventListenerTracked(element: Element, event: string, handler: (event: Event) => void): void {
    element.addEventListener(event, handler);
    this.eventListeners.push({ element, event, handler });
  }

  addDocumentEventListenerTracked(event: string, handler: (event: Event) => void): void {
    document.addEventListener(event, handler);
    this.documentEventListeners.push({ event, handler });
  }

  buildFolderTree(imagePathMap: Map<string, ImageDomain[]>): void {
    const sortedEntries = [...imagePathMap.entries()].sort();
    sortedEntries.forEach(([imagePath, images]) => {
      const idArray = imagePath.split('\\').map(ImagePage.encodeID);
      let parentId = 'root';
      let currentId = '';

      idArray.forEach((idPart, idx) => {
        currentId = idx === 0 ? idPart : `${currentId}_${idPart}`;
        let folderDiv = this.querySelector('#' + currentId) as HTMLDivElement;
        if (!folderDiv) {
          const parentElement = this.querySelector('#' + parentId) ?? this;
          folderDiv = parentElement.appendChild(document.createElement('div'));
          folderDiv.id = currentId;
          folderDiv.title = imagePath;
          const folderLabel = folderDiv.appendChild(document.createElement('label'));
          folderLabel.appendChild(document.createElement('span'));
          const nameLabel = folderLabel.appendChild(document.createElement('a'));
          nameLabel.innerHTML = ImagePage.decodeID(idPart);

          if (idx === idArray.length - 1) {
            nameLabel.innerHTML += ` <i>(${images.length})</i>`;
            const clickHandler = () => {
              this.renderImage(images);
              this.deactivateActiveLinks();
              nameLabel.classList.add('active');
            };
            this.addEventListenerTracked(nameLabel, 'click', clickHandler);
          }
        }
        parentId = currentId;
      });
    });
  }

  deactivateActiveLinks(): void {
    this.querySelectorAll('a.active').forEach((a) => a.classList.remove('active'));
  }

  addCollapseBehavior(): void {
    this.querySelectorAll('.folder-tree div:not(#root)').forEach((div) => {
      const span = div.querySelector('span');
      if (div.querySelectorAll('div').length > 0) {
        const clickHandler = (e: Event) => {
          (e.target as HTMLElement).closest('div')?.classList.toggle('fold');
        };
        this.addEventListenerTracked(span!, 'click', clickHandler);
      } else {
        span!.classList.add('no-child');
      }
    });
  }

  registerUIEvents(): void {
    // Adjust article size on click.
    this.querySelectorAll('main header button').forEach((button) => {
      const clickHandler = (e: Event) => {
        this.adjustArticleSize((e.target as HTMLElement).getAttribute('role')!);
      };
      this.addEventListenerTracked(button, 'click', clickHandler);
    });

    // Hide preview layer when clicked.
    const previewLayer = this.querySelector('.preview');
    if (previewLayer) {
      const clickHandler = (e: Event) => {
        (e.target as HTMLElement).classList.remove('show');
      };
      this.addEventListenerTracked(previewLayer, 'click', clickHandler);
    }
  }

  registerResizeEvents(): void {
    const resizableContainer = this.querySelector('.resizable-container') as HTMLElement;
    const resizer = this.querySelector('.resizer') as HTMLElement;
    const folderTree = this.querySelector('.folder-tree') as HTMLElement;
    let startX = 0;
    let startWidth = 0;

    const onMouseMove = (e: Event) => {
      const mouseEvent = e as MouseEvent;
      const newWidth = Math.max(100, startWidth - (mouseEvent.clientX - startX) + 4);
      resizableContainer.style.gridTemplateColumns = `1fr 5px ${newWidth}px`;
    };

    const onMouseUp = () => {
      resizer.classList.remove('resizing');
      document.documentElement.style.cursor = '';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    const mouseDownHandler = (e: Event) => {
      const mouseEvent = e as MouseEvent;
      resizer.classList.add('resizing');
      startX = mouseEvent.clientX;
      startWidth = folderTree.clientWidth;
      document.documentElement.style.cursor = 'col-resize';
      this.addDocumentEventListenerTracked('mousemove', onMouseMove);
      this.addDocumentEventListenerTracked('mouseup', onMouseUp);
    };

    this.addEventListenerTracked(resizer, 'mousedown', mouseDownHandler);
  }

  adjustArticleSize(action: string): void {
    const article = this.querySelector('article') as HTMLElement;
    if (!article) return;
    const currentClass = article.className;
    const maxSize = Math.ceil(article.clientWidth / 50) * 50;
    let size = parseInt(currentClass.substring(5), 10);
    size += action === 'enlarge' ? 50 : -50;
    size = Math.min(maxSize, Math.max(100, size));
    article.classList.replace(currentClass, 'size-' + size);
  }

  renderImage(images: ImageDomain[]): void {
    console.debug(images);
    const pathLabel = this.querySelector('#path');
    if (pathLabel) pathLabel.innerHTML = images[0]!.path;

    const countLabel = this.querySelector('#count');
    if (countLabel) countLabel.innerHTML = `${images.length} <small>images</small>`;

    const previewLayer = this.querySelector('.preview');
    previewLayer && previewLayer.classList.remove('show');

    const imageFrame = this.querySelector('.image-frame') as ImageFrame;
    const article = this.querySelector('article');
    if (article) article.textContent = '';

    images.forEach((image) => {
      const item = article!.appendChild(document.createElement('div'));
      item.dataset.lazyBackgroundImageUrl = ApiClient.buildUrl(`/static/image/${image.idx}`);
      item.title = `#${image.idx} - ${image.name} - ${FileUtils.formatSize(image.length)} - ${DateUtils.format(image.modified, 'yyyy-MM-dd')}`;
      const clickHandler = () => {
        void imageFrame.set(image.idx);
        previewLayer && previewLayer.classList.add('show');
      };
      this.addEventListenerTracked(item, 'click', clickHandler);
    });

    if (article!.firstChild) {
      (article!.firstChild as Element).scrollIntoView(false);
    }
    lazyLoadBackgroundImage();
  }
}

// Register the custom element (extending a built-in div element).
customElements.define('image-page', ImagePage);
