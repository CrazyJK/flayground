import FlayFetch from '../lib/FlayFetch';
import './InfiniteImageGallery.scss';

/**
 * 무한 스크롤 이미지 갤러리 커스텀 엘리먼트
 */
export class InfiniteImageGallery extends HTMLElement {
  private imageContainer: HTMLDivElement;
  private totalImageCount: number = 0;
  private loadedImages: Set<number> = new Set();
  private isDragging: boolean = false;
  private startX: number = 0;
  private scrollLeftPosition: number = 0;
  private isLoading: boolean = false;
  private currentStartIndex: number = 0; // 현재 시작 인덱스 (랜덤으로 설정됨)
  private nextForwardIndex: number = 0; // 오른쪽으로 다음에 로드할 인덱스
  private nextBackwardIndex: number = 0; // 왼쪽으로 다음에 로드할 인덱스

  // 미니맵과 UI 요소들
  private miniMapContainer: HTMLDivElement;
  private leftLoadingIndicator: HTMLDivElement;
  private rightLoadingIndicator: HTMLDivElement;

  // 성능 최적화를 위한 추가 속성
  private lastActiveIndex: number = -1; // 마지막 활성화된 썸네일 인덱스
  private imageUrls: Map<number, string> = new Map(); // 이미지 URL 관리

  constructor() {
    super();
  }

  connectedCallback(): void {
    this.setupContainer();
    this.initialize().catch(console.error);
  }

  disconnectedCallback(): void {
    // 클린업 작업
    this.cleanup();
  }

  private setupContainer(): void {
    this.imageContainer = document.createElement('div');
    this.imageContainer.className = 'image-container';
    this.appendChild(this.imageContainer);

    // 미니맵과 로딩 인디케이터 컨테이너 생성
    this.createMiniMapAndIndicators();

    this.setupDragFunctionality();
    this.setupScrollListener();
    this.setupKeyboardNavigation();
  }

  /**
   * 미니맵과 로딩 인디케이터 UI 생성
   */
  private createMiniMapAndIndicators(): void {
    // 미니맵 컨테이너 생성 (모든 이미지 썸네일 표시)
    this.miniMapContainer = document.createElement('div');
    this.miniMapContainer.className = 'mini-map-container';
    this.miniMapContainer.innerHTML = `
      <div class="thumbnail-strip"></div>
    `;

    // 커스텀 엘리먼트 내부에 미니맵 추가
    this.appendChild(this.miniMapContainer);

    // 좌측 로딩 인디케이터 생성
    this.leftLoadingIndicator = document.createElement('div');
    this.leftLoadingIndicator.className = 'loading-indicator left';
    this.leftLoadingIndicator.innerHTML = `
      <span class="loading-text">←</span>
      <div class="loading-spinner"></div>
    `;
    this.appendChild(this.leftLoadingIndicator);

    // 우측 로딩 인디케이터 생성
    this.rightLoadingIndicator = document.createElement('div');
    this.rightLoadingIndicator.className = 'loading-indicator right';
    this.rightLoadingIndicator.innerHTML = `
      <div class="loading-spinner"></div>
      <span class="loading-text">→</span>
    `;
    this.appendChild(this.rightLoadingIndicator);

    // 초기에는 로딩 인디케이터 숨김
    this.hideLoadingIndicators();
  }

  /**
   * 방향에 따른 로딩 인디케이터 표시
   */
  private showLoadingIndicator(direction: 'left' | 'right'): void {
    const indicator = direction === 'left' ? this.leftLoadingIndicator : this.rightLoadingIndicator;

    // 먼저 display를 flex로 설정
    indicator.style.display = 'flex';

    // 다음 프레임에서 show 클래스 추가 (부드러운 애니메이션을 위해)
    requestAnimationFrame(() => {
      indicator.classList.add('show');
    });
  }

  /**
   * 모든 로딩 인디케이터 숨김
   */
  private hideLoadingIndicators(): void {
    [this.leftLoadingIndicator, this.rightLoadingIndicator].forEach((indicator) => {
      indicator.classList.remove('show');

      // 애니메이션 완료 후 display none 설정
      setTimeout(() => {
        indicator.style.display = 'none';
      }, 300); // CSS transition 시간과 동일
    });
  }

  /**
   * 미니맵에 썸네일 추가
   */
  private addThumbnailToMiniMap(imageSrc: string, index: number, prepend: boolean = false): void {
    const thumbnailStrip = this.miniMapContainer.querySelector('.thumbnail-strip') as HTMLDivElement;

    const thumbnailElement = document.createElement('div');
    thumbnailElement.className = 'mini-thumbnail-item';
    thumbnailElement.dataset.index = String(index);

    const img = document.createElement('img');
    img.src = imageSrc;
    img.alt = `Image ${index}`;

    thumbnailElement.appendChild(img);

    if (prepend) {
      thumbnailStrip.insertBefore(thumbnailElement, thumbnailStrip.firstChild);
    } else {
      thumbnailStrip.appendChild(thumbnailElement);
    }

    // 클릭 시 해당 이미지로 스크롤
    thumbnailElement.addEventListener('click', () => {
      this.scrollToImage(index);
    });
  }

  /**
   * 특정 인덱스의 이미지로 스크롤
   */
  private async scrollToImage(targetIndex: number): Promise<void> {
    const targetImg = this.imageContainer.querySelector(`img[data-idx="${targetIndex}"]`) as HTMLImageElement;
    if (targetImg) {
      targetImg.scrollIntoView({ behavior: 'smooth', inline: 'center' });
    }
  }

  /**
   * 특정 인덱스의 이미지로 스크롤
   */
  private async scrollToSpecificImage(targetIndex: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const targetImg = this.imageContainer.querySelector(`img[data-idx="${targetIndex}"]`) as HTMLImageElement;
        if (targetImg) {
          // 특정 이미지를 화면 중앙으로 스크롤
          targetImg.scrollIntoView({ behavior: 'smooth', inline: 'center' });
        }

        // 미니맵 하이라이트 업데이트
        this.updateMiniMapHighlight();

        // 스크롤 완료 신호
        resolve();
      }, 100);
    });
  }

  /**
   * 미니맵에서 현재 보이는 이미지 하이라이트
   */
  private updateMiniMapHighlight(): void {
    // 성능 최적화를 위해 requestAnimationFrame 사용
    requestAnimationFrame(() => {
      const containerRect = this.imageContainer.getBoundingClientRect();
      const centerX = containerRect.left + containerRect.width / 2;

      // 현재 중앙에 있는 이미지 찾기
      const images = this.imageContainer.querySelectorAll('img');
      let closestImage: HTMLImageElement | null = null;
      let closestDistance = Infinity;

      images.forEach((img) => {
        const imgRect = img.getBoundingClientRect();
        const imgCenterX = imgRect.left + imgRect.width / 2;
        const distance = Math.abs(imgCenterX - centerX);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestImage = img;
        }
      });

      // 현재 이미지에 해당하는 썸네일 찾기
      if (closestImage) {
        const currentIndex = parseInt(closestImage.dataset.idx || '-1');

        // 이전과 같은 이미지면 업데이트 건너뛰기 (성능 최적화)
        if (currentIndex === this.lastActiveIndex) {
          return;
        }

        this.lastActiveIndex = currentIndex;

        // 모든 썸네일에서 active 클래스 제거
        const allThumbnails = this.miniMapContainer.querySelectorAll('.mini-thumbnail-item');
        allThumbnails.forEach((thumb) => thumb.classList.remove('active'));

        // 현재 썸네일에 active 클래스 추가
        const activeThumbnail = this.miniMapContainer.querySelector(`[data-index="${currentIndex}"]`);
        if (activeThumbnail) {
          activeThumbnail.classList.add('active');
          // 썸네일도 중앙으로 스크롤
          activeThumbnail.scrollIntoView({ behavior: 'smooth', inline: 'center' });
        }
      }
    });
  }

  private async initialize(): Promise<void> {
    this.totalImageCount = await FlayFetch.getImageSize();
    if (this.totalImageCount === 0) {
      console.warn('No images available');
      return;
    }

    // 랜덤 시작 인덱스 설정
    this.currentStartIndex = Math.floor(Math.random() * this.totalImageCount);
    this.nextForwardIndex = this.currentStartIndex;
    this.nextBackwardIndex = this.currentStartIndex;

    // 초기 이미지들 로드 (화면에 보이는 개수 + 여분)
    await this.loadInitialImages();
  }

  private async loadInitialImages(): Promise<void> {
    // 화면 너비를 고려해서 충분한 이미지 로드 개수 계산
    const screenWidth = window.innerWidth;
    const imageWidth = 20 * 16 + 16; // 20rem + 1rem gap (픽셀 단위, 기본 16px/rem)
    const imagesPerScreen = Math.ceil(screenWidth / imageWidth);

    // 화면에 보이는 개수의 3배 정도로 여분 로드 (좌우 여분 포함)
    const initialCount = Math.max(imagesPerScreen * 3, 12);

    console.log(`Loading initial ${initialCount} images starting from index ${this.currentStartIndex}...`);

    // 중앙 이미지 먼저 로드하고 DOM에 추가될 때까지 대기
    await this.loadImageAtCenter(this.currentStartIndex);

    // 좌우 번갈아가며 이미지 로드
    let leftIndex = this.currentStartIndex;
    let rightIndex = this.currentStartIndex;
    const imagePromises: Promise<void>[] = [];

    for (let i = 1; i < initialCount; i++) {
      if (i % 2 === 1) {
        // 홀수 번째: 오른쪽으로 이미지 추가
        rightIndex = (rightIndex + 1) % this.totalImageCount;
        imagePromises.push(this.loadImage(rightIndex));
      } else {
        // 짝수 번째: 왼쪽으로 이미지 추가
        leftIndex = (leftIndex - 1 + this.totalImageCount) % this.totalImageCount;
        imagePromises.push(this.loadImageAtStart(leftIndex));
      }
    }

    // 다음 로드할 인덱스 업데이트
    this.nextForwardIndex = (rightIndex + 1) % this.totalImageCount;
    this.nextBackwardIndex = (leftIndex - 1 + this.totalImageCount) % this.totalImageCount;

    await Promise.all(imagePromises);

    // 모든 이미지가 로드된 후 중앙 이미지로 스크롤 (완료 대기)
    await this.scrollToCenterImage();

    // 중앙 정렬 완료 후 갤러리 보이기 (페이드인 효과)
    this.showGallery();
  }

  /**
   * 갤러리를 보이도록 설정
   */
  private showGallery(): void {
    this.classList.add('show');
  }

  /**
   * 로드된 이미지들의 가운데로 스크롤
   */
  private scrollToCenter(): Promise<void> {
    return new Promise((resolve) => {
      // 짧은 지연 후 스크롤 (DOM 업데이트 완료 대기)
      setTimeout(() => {
        const container = this.imageContainer;
        const scrollWidth = container.scrollWidth;
        const clientWidth = container.clientWidth;

        // 전체 스크롤 가능한 너비의 중앙으로 스크롤
        const centerPosition = (scrollWidth - clientWidth) / 2;
        container.scrollLeft = centerPosition;

        // 미니맵 하이라이트 업데이트
        this.updateMiniMapHighlight();

        // 스크롤 완료 신호
        resolve();
      }, 100);
    });
  }

  /**
   * 다음 앞쪽(오른쪽) 인덱스를 반환하고 인덱스를 증가시킵니다
   */
  private getNextForwardIndex(): number {
    const index = this.nextForwardIndex;
    this.nextForwardIndex = (this.nextForwardIndex + 1) % this.totalImageCount;
    return index;
  }

  /**
   * 다음 뒤쪽(왼쪽) 인덱스를 반환하고 인덱스를 감소시킵니다
   */
  private getNextBackwardIndex(): number {
    this.nextBackwardIndex = (this.nextBackwardIndex - 1 + this.totalImageCount) % this.totalImageCount;
    return this.nextBackwardIndex;
  }

  private async loadImage(index: number): Promise<void> {
    // 순차적 로드에서는 중복 체크를 하지 않음 (이미 순서가 보장됨)
    this.loadedImages.add(index);

    try {
      const imageData = await FlayFetch.getStaticImage(index);
      const url = URL.createObjectURL(imageData.imageBlob);

      // URL 관리를 위해 저장
      this.imageUrls.set(index, url);

      const img = document.createElement('img');
      img.src = url;
      img.dataset.idx = String(index);
      img.alt = imageData.name;
      img.title = `${imageData.name} (${imageData.path})`;

      // 이미지 로드 완료 후 추가
      img.onload = () => {
        this.imageContainer.appendChild(img);
        // 미니맵에 썸네일 추가
        this.addThumbnailToMiniMap(img.src, index);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        this.imageUrls.delete(index);
        console.error(`Failed to load image at index: ${index}`);
      };
    } catch (error) {
      console.error(`Error loading image ${index}:`, error);
    }
  }

  /**
   * 이미지 로드 시 로딩 상태 개선
   */
  private async loadImageWithRetry(index: number, retryCount: number = 2): Promise<void> {
    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        await this.loadImage(index);
        return; // 성공시 종료
      } catch (error) {
        console.warn(`Image load attempt ${attempt + 1} failed for index ${index}:`, error);
        if (attempt === retryCount) {
          console.error(`Failed to load image ${index} after ${retryCount + 1} attempts`);
          throw error;
        }
        // 재시도 전 짧은 대기
        await new Promise((resolve) => setTimeout(resolve, 100 * (attempt + 1)));
      }
    }
  }

  /**
   * 키보드 네비게이션 설정
   */
  private setupKeyboardNavigation(): void {
    // 컴포넌트에 포커스 가능하도록 설정
    this.tabIndex = 0;

    this.addEventListener('keydown', (e) => {
      // 스페이스 키 (코드 32 또는 ' ')
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault(); // 페이지 스크롤 방지
        this.jumpToRandomPosition();
      }
    });

    // 컴포넌트 클릭 시 포커스 설정 (키보드 이벤트 활성화)
    this.addEventListener('click', () => {
      this.focus();
    });
  }

  /**
   * 랜덤 위치로 점프
   */
  private async jumpToRandomPosition(): Promise<void> {
    if (this.totalImageCount === 0) return;

    // 기존 이미지들 모두 초기화
    await this.clearAllImages();

    // 랜덤 인덱스 생성
    const randomIndex = Math.floor(Math.random() * this.totalImageCount);

    // 새로운 시작점으로 인덱스 재설정
    this.currentStartIndex = randomIndex;
    this.nextForwardIndex = randomIndex;
    this.nextBackwardIndex = randomIndex;

    // 새로운 위치에서 초기 이미지들 로드
    await this.loadInitialImagesFromPosition(randomIndex);
  }

  /**
   * 모든 이미지 및 썸네일 초기화
   */
  private async clearAllImages(): Promise<void> {
    // 로딩 인디케이터 표시
    this.showLoadingIndicator('left');
    this.showLoadingIndicator('right');

    // 기존 이미지들 제거
    const images = this.imageContainer.querySelectorAll('img');
    images.forEach((img) => {
      this.imageContainer.removeChild(img);
    });

    // 미니맵 썸네일들 제거
    const thumbnailStrip = this.miniMapContainer.querySelector('.thumbnail-strip') as HTMLDivElement;
    thumbnailStrip.innerHTML = '';

    // 이미지 URL 메모리 해제
    this.imageUrls.forEach((url) => {
      URL.revokeObjectURL(url);
    });
    this.imageUrls.clear();

    // 로딩 상태 초기화
    this.loadedImages.clear();
    this.lastActiveIndex = -1;
  }

  /**
   * 특정 위치에서 초기 이미지들 로드
   */
  private async loadInitialImagesFromPosition(startIndex: number): Promise<void> {
    // 화면 너비를 고려해서 충분한 이미지 로드 개수 계산
    const screenWidth = window.innerWidth;
    const imageWidth = 20 * 16 + 16; // 20rem + 1rem gap (픽셀 단위, 기본 16px/rem)
    const imagesPerScreen = Math.ceil(screenWidth / imageWidth);

    // 화면에 보이는 개수의 3배 정도로 여분 로드 (좌우 여분 포함)
    const initialCount = Math.max(imagesPerScreen * 3, 12);

    console.log(`Loading initial ${initialCount} images from position ${startIndex}...`);

    // 중앙 이미지 먼저 로드하고 DOM에 추가될 때까지 대기
    await this.loadImageAtCenter(startIndex);

    // 좌우 번갈아가며 이미지 로드
    let leftIndex = startIndex;
    let rightIndex = startIndex;
    const imagePromises: Promise<void>[] = [];

    for (let i = 1; i < initialCount; i++) {
      if (i % 2 === 1) {
        // 홀수 번째: 오른쪽으로 이미지 추가
        rightIndex = (rightIndex + 1) % this.totalImageCount;
        imagePromises.push(this.loadImage(rightIndex));
      } else {
        // 짝수 번째: 왼쪽으로 이미지 추가
        leftIndex = (leftIndex - 1 + this.totalImageCount) % this.totalImageCount;
        imagePromises.push(this.loadImageAtStart(leftIndex));
      }
    }

    // 다음 로드할 인덱스 업데이트
    this.nextForwardIndex = (rightIndex + 1) % this.totalImageCount;
    this.nextBackwardIndex = (leftIndex - 1 + this.totalImageCount) % this.totalImageCount;

    await Promise.all(imagePromises);

    // 모든 이미지가 로드된 후 중앙 이미지로 스크롤
    await this.scrollToSpecificImage(startIndex);

    // 로딩 인디케이터 숨김
    this.hideLoadingIndicators();
  }

  /**
   * 중앙에 이미지를 로드하고 DOM에 추가될 때까지 대기
   */
  private async loadImageAtCenter(index: number): Promise<void> {
    this.loadedImages.add(index);

    try {
      const imageData = await FlayFetch.getStaticImage(index);
      const url = URL.createObjectURL(imageData.imageBlob);

      // URL 관리를 위해 저장
      this.imageUrls.set(index, url);

      const img = document.createElement('img');
      img.src = url;
      img.dataset.idx = String(index);
      img.alt = imageData.name;
      img.title = `${imageData.name} (${imageData.path})`;

      // 이미지 로드 완료를 Promise로 대기
      return new Promise((resolve, reject) => {
        img.onload = () => {
          this.imageContainer.appendChild(img);
          // 미니맵에 썸네일 추가
          this.addThumbnailToMiniMap(img.src, index);
          resolve();
        };

        img.onerror = () => {
          URL.revokeObjectURL(url);
          this.imageUrls.delete(index);
          console.error(`Failed to load image at index: ${index}`);
          reject(new Error(`Failed to load image at index: ${index}`));
        };
      });
    } catch (error) {
      console.error(`Error loading image ${index}:`, error);
      throw error;
    }
  }

  /**
   * 중앙 이미지(startIndex)로 스크롤
   */
  private async scrollToCenterImage(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const centerImg = this.imageContainer.querySelector(`img[data-idx="${this.currentStartIndex}"]`) as HTMLImageElement;
        if (centerImg) {
          // 중앙 이미지를 화면 중앙으로 스크롤
          centerImg.scrollIntoView({ behavior: 'smooth', inline: 'center' });
        }

        // 미니맵 하이라이트 업데이트
        this.updateMiniMapHighlight();

        // 스크롤 완료 신호
        resolve();
      }, 100);
    });
  }

  private setupDragFunctionality(): void {
    this.imageContainer.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.imageContainer.classList.add('dragging');
      this.startX = e.pageX - this.imageContainer.offsetLeft;
      this.scrollLeftPosition = this.imageContainer.scrollLeft;
      e.preventDefault();
    });

    this.imageContainer.addEventListener('mouseleave', () => {
      this.isDragging = false;
      this.imageContainer.classList.remove('dragging');
    });

    this.imageContainer.addEventListener('mouseup', () => {
      this.isDragging = false;
      this.imageContainer.classList.remove('dragging');
    });

    this.imageContainer.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      e.preventDefault();

      const x = e.pageX - this.imageContainer.offsetLeft;
      const walk = x - this.startX; // 마우스 이동과 1:1 속도로 조정
      this.imageContainer.scrollLeft = this.scrollLeftPosition - walk;
    });

    // 마우스 컨텍스트 메뉴 방지
    this.imageContainer.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });

    // 마우스 휠로 가로 스크롤
    this.imageContainer.addEventListener('wheel', (e) => {
      e.preventDefault();

      // 휠 스크롤 방향에 따라 가로 스크롤
      const scrollAmount = e.deltaY * 6; // 스크롤 속도 조절 (3배로 증가)
      this.imageContainer.scrollLeft += scrollAmount;
    });
  }

  private setupScrollListener(): void {
    let scrollTimeout: ReturnType<typeof setTimeout>;

    this.imageContainer.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(async () => {
        await this.checkAndLoadMoreImages();
        this.updateMiniMapHighlight(); // 동기 호출로 변경
      }, 100);
    });
  }

  private async checkAndLoadMoreImages(): Promise<void> {
    if (this.isLoading) return; // 드래그 중이어도 이미지 로드는 허용

    const container = this.imageContainer;
    const scrollLeft = container.scrollLeft;
    const scrollWidth = container.scrollWidth;
    const clientWidth = container.clientWidth;

    // 화면 너비를 고려한 로딩 트리거 계산
    const imageWidth = 20 * 16 + 16; // 20rem + 1rem gap (픽셀 단위)
    const loadTriggerDistance = Math.max(clientWidth, imageWidth * 3); // 최소 3개 이미지 너비 또는 화면 너비

    // 좌측 끝에 가까워졌을 때 (로딩 트리거 거리 이내)
    if (scrollLeft < loadTriggerDistance) {
      await this.loadMoreImages('left');
    }

    // 우측 끝에 가까워졌을 때 (로딩 트리거 거리 이내)
    if (scrollLeft + clientWidth > scrollWidth - loadTriggerDistance) {
      await this.loadMoreImages('right');
    }
  }

  private async loadMoreImages(direction: 'left' | 'right'): Promise<void> {
    if (this.isLoading) return;

    this.isLoading = true;
    this.showLoadingIndicator(direction); // 방향에 따른 로딩 시작 표시

    // 화면 너비를 고려한 로드 개수 계산
    const screenWidth = window.innerWidth;
    const imageWidth = 20 * 16 + 16; // 20rem + 1rem gap (픽셀 단위)
    const imagesPerScreen = Math.ceil(screenWidth / imageWidth);
    const loadCount = Math.max(imagesPerScreen, 4); // 최소 4개, 또는 화면에 보이는 개수만큼

    // 드래그 중이면 현재 스크롤 상태를 보존
    const isDraggingNow = this.isDragging;
    let preservedScrollState = null;

    if (isDraggingNow && direction === 'left') {
      // 왼쪽 이미지 추가 시 드래그 상태 보존
      preservedScrollState = {
        scrollLeft: this.imageContainer.scrollLeft,
        startX: this.startX,
        scrollLeftAtStart: this.scrollLeftPosition,
      };
    }

    try {
      const imagePromises: Promise<void>[] = [];

      for (let i = 0; i < loadCount; i++) {
        let imageIndex: number;

        if (direction === 'left') {
          // 왼쪽으로는 이전 인덱스들을 순차적으로 로드
          imageIndex = this.getNextBackwardIndex();
          imagePromises.push(this.loadImageAtStart(imageIndex));
        } else {
          // 오른쪽으로는 다음 인덱스들을 순차적으로 로드
          imageIndex = this.getNextForwardIndex();
          imagePromises.push(this.loadImage(imageIndex));
        }
      }

      await Promise.all(imagePromises);

      // 좌측에 이미지를 추가했을 때 스크롤 위치 조정
      if (direction === 'left') {
        const scrollAdjustment = loadCount * imageWidth;

        if (isDraggingNow && preservedScrollState) {
          // 드래그 중이면 드래그 상태를 유지하면서 스크롤 위치 조정
          this.imageContainer.scrollLeft = preservedScrollState.scrollLeft + scrollAdjustment;
          this.scrollLeftPosition = preservedScrollState.scrollLeftAtStart + scrollAdjustment;
        } else {
          // 드래그 중이 아니면 일반적인 스크롤 위치 조정
          this.imageContainer.scrollLeft += scrollAdjustment;
        }
      }
    } catch (error) {
      console.error('Error loading more images:', error);
    } finally {
      this.isLoading = false;
      this.hideLoadingIndicators(); // 로딩 완료 표시
    }
  }

  private async loadImageAtStart(index: number): Promise<void> {
    // 순차적 로드에서는 중복 체크를 하지 않음 (이미 순서가 보장됨)
    this.loadedImages.add(index);

    try {
      const imageData = await FlayFetch.getStaticImage(index);
      const url = URL.createObjectURL(imageData.imageBlob);

      // URL 관리를 위해 저장
      this.imageUrls.set(index, url);

      const img = document.createElement('img');
      img.src = url;
      img.dataset.idx = String(index);
      img.alt = imageData.name;
      img.title = `${imageData.name} (${imageData.path})`;

      // 이미지 로드 완료 후 컨테이너 맨 앞에 추가
      img.onload = () => {
        this.imageContainer.insertBefore(img, this.imageContainer.firstChild);
        // 미니맵 맨 앞에 썸네일 추가
        this.addThumbnailToMiniMap(img.src, index, true);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        this.imageUrls.delete(index);
        console.error(`Failed to load image at index: ${index}`);
      };
    } catch (error) {
      console.error(`Error loading image ${index}:`, error);
    }
  }

  /**
   * 클린업 작업
   */
  private cleanup(): void {
    // 생성된 모든 이미지 URL 해제 (메모리 누수 방지)
    this.imageUrls.forEach((url) => {
      URL.revokeObjectURL(url);
    });
    this.imageUrls.clear();

    // 로딩 상태 초기화
    this.loadedImages.clear();
    this.isLoading = false;
    this.isDragging = false;
  }
}

// 커스텀 엘리먼트 등록
customElements.define('infinite-image-gallery', InfiniteImageGallery);
