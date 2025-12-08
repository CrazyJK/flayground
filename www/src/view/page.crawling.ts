import NanoStore from '@flay/idb/nano/store/NanoStore';
import ApiClient from '@lib/ApiClient';
import DateUtils from '@lib/DateUtils';
import FlayFetch from '@lib/FlayFetch';
import FlaySearch, { popupActress, popupFlay } from '@lib/FlaySearch';
import './inc/Page';
import './page.crawling.scss';

interface LinkItem {
  text: string;
  href: string;
}

interface DownloadItem extends LinkItem {
  type: string;
}

interface VideoInfo {
  error?: boolean;
  rank?: number;
  play?: number;
  lastModified?: number;
}

interface ActressItem extends LinkItem {
  eng?: string;
  jap?: string;
  fav?: string;
}

interface CrawlingItem {
  opus: LinkItem;
  cover: string;
  release: string;
  posted: LinkItem;
  title: string;
  actressList: ActressItem[];
  downloadList: DownloadItem[];
  tagList: LinkItem[];
}

/**
 * 크롤링 페이지 설정 상수
 */
const CONFIG = {
  DOMAIN: 'https://www.nanojav.com',
  PREFETCH_THRESHOLD: 10, // 10개 남으면 크롤링
  ITEMS_PER_PAGE: 15,
  CACHE_SIZE_LIMIT: 1000,
  ANIMATION_DURATION: 500,
  SELECTORS: {
    CONTENT: '#content > div > div > div:nth-child(2) > div > div',
    COVER_IMG: 'img.cover',
    OPUS_LINK: '.card-content h3.title a',
    POST_LINK: '.card-content p.subtitle a',
    TAGS: '.tags a',
    TAG_ELEMENT: '.tag',
    ACTRESS_LINKS: '.card-content > div.mb-2.buttons.are-small > a',
    DOWNLOAD_LINKS: '.card-content > div.is-uppercase.has-text-weight-bold.buttons > a',
  },
} as const;

const LIST_URL = CONFIG.DOMAIN + '/jav/?order=new&type=jav&page=';
const SEARCH_URL = CONFIG.DOMAIN + '/jav/search/?opr=AND&sort=release_date&q='; // release_date | new
const domParser = new DOMParser();
const nanoStore = new NanoStore();

/**
 * DOM 요소 관리 및 유틸리티 클래스
 */
class DOMManager {
  private elementCache = new Map<string, HTMLElement>();

  /**
   * 요소를 캐시하여 반복적인 DOM 쿼리를 최적화
   */
  getElement<T extends HTMLElement>(selector: string): T | null {
    if (!this.elementCache.has(selector)) {
      const element = document.querySelector(selector) as T;
      if (element) {
        this.elementCache.set(selector, element);
      }
      return element;
    }
    return this.elementCache.get(selector) as T;
  }

  /**
   * 안전한 텍스트 추출
   */
  getText(element: HTMLElement | null): string {
    return element?.textContent?.trim() ?? '';
  }

  /**
   * 안전한 href 속성 추출
   */
  getHref(element: HTMLElement | null): string {
    return element?.getAttribute('href') ?? '';
  }

  /**
   * 요소 애니메이션
   */
  animate(element: HTMLElement | null, keyframes: Keyframe[], options: KeyframeAnimationOptions): void {
    element?.animate(keyframes, options);
  }

  /**
   * 클립보드 복사
   */
  async copyToClipboard(text: string, targetElement?: HTMLElement): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      if (targetElement) {
        this.animate(targetElement, [{ transform: 'scale(1.25)' }, { transform: 'none' }], { duration: CONFIG.ANIMATION_DURATION, iterations: 1 });
      }
    } catch (error) {
      console.error('클립보드 복사 실패:', error);
    }
  }
}

/**
 * 캐시 관리 클래스
 */
class CacheManager {
  private videoCache = new Map<string, VideoInfo>();
  private actressCache = new Map<string, ActressItem[]>();
  private recordCache = new Map<string, { date: number } | null>();

  /**
   * 비디오 캐시 관리
   */
  getVideo(opus: string): VideoInfo | null {
    return this.videoCache.get(opus) ?? null;
  }

  setVideo(opus: string, video: VideoInfo): void {
    this.videoCache.set(opus, video);
    this.#limitCacheSize(this.videoCache);
  }

  /**
   * 배우 캐시 관리
   */
  getActress(name: string): ActressItem[] {
    return this.actressCache.get(name) ?? [];
  }

  setActress(name: string, actress: ActressItem[]): void {
    this.actressCache.set(name, actress);
    this.#limitCacheSize(this.actressCache);
  }

  /**
   * 레코드 캐시 관리
   */
  getRecord(opus: string): { date: number } | null {
    return this.recordCache.get(opus) ?? null;
  }

  setRecord(opus: string, record: { date: number } | null): void {
    this.recordCache.set(opus, record);
    this.#limitCacheSize(this.recordCache);
  }

  /**
   * 캐시 크기 제한
   */
  #limitCacheSize<T>(cache: Map<string, T>): void {
    if (cache.size > CONFIG.CACHE_SIZE_LIMIT) {
      const firstKey = cache.keys().next().value;
      if (firstKey) {
        cache.delete(firstKey);
      }
    }
  }

  /**
   * 모든 캐시 정리
   */
  clearAll(): void {
    this.videoCache.clear();
    this.actressCache.clear();
    this.recordCache.clear();
  }
}

/**
 * 크롤링 페이지 메인 클래스
 * nanojav.com 사이트 크롤링 및 데이터 표시 기능을 제공
 */
class Page {
  #itemList: CrawlingItem[] = [];
  #startPageNo = 0;
  #paging = {
    srcPageNo: 0,
    itemIndex: 0,
    itemLength: 0,
    needCrawling: (): boolean => {
      // CONFIG.PREFETCH_THRESHOLD개 남으면 크롤링
      return this.#paging.itemLength - this.#paging.itemIndex === CONFIG.PREFETCH_THRESHOLD;
    },
  };
  #crawlingStartTime = 0; // 크롤링 시작 시간
  #isSearchMode = false; // 검색 모드 여부
  #searchQuery = ''; // 검색어

  // 의존성 주입을 통한 유틸리티 클래스 사용
  private domManager = new DOMManager();
  private cacheManager = new CacheManager();

  article: HTMLElement;
  retryBtn: HTMLButtonElement;
  itemRepository: HTMLElement;

  constructor() {
    console.log(`🚀 [Init] 크롤링 페이지 초기화 시작`);

    // URL 파라미터 확인
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('q');

    if (searchQuery) {
      console.log(`🔍 [Init] 검색 모드로 초기화 - 검색어: "${searchQuery}"`);
    } else {
      console.log(`📄 [Init] 일반 모드로 초기화`);
    }

    document.querySelector('#startBtn')!.addEventListener('click', () => {
      console.log(`▶️ [Start] 수동 크롤링 시작 버튼 클릭`);
      this.#startPageNo = parseInt((document.querySelector('#srcPageNo') as HTMLInputElement).value);
      this.#paging.srcPageNo = this.#startPageNo;
      console.log(`📄 [Start] 시작 페이지: ${this.#startPageNo}`);
      this.#callCrawling();
      document.querySelector('#starter')!.classList.add('hide');
    });

    console.log(`🎛️ [Init] 이벤트 리스너 등록 중...`);
    this.article = document.querySelector('body > main > article')!;
    // Use passive event listeners for performance
    this.article.addEventListener('wheel', this.#handleWheel.bind(this), { passive: true });
    window.addEventListener('keyup', this.#handleKeyUp.bind(this));

    this.retryBtn = document.querySelector('body > main > footer > #retryBtn')!;
    this.retryBtn.addEventListener('click', () => {
      console.log(`🔄 [Retry] 재시도 버튼 클릭`);
      this.#callCrawling();
    });

    this.itemRepository = document.querySelector('#itemRepository')!;

    // Delegate event listeners for better performance
    this.article.addEventListener('click', this.#handleRepositoryClick.bind(this));

    console.log(`✅ [Init] 페이지 초기화 완료`);

    // q 파라미터가 있으면 자동으로 검색 크롤링 시작
    if (searchQuery) {
      console.log(`🚀 [Auto] 자동 검색 크롤링 시작`);
      this.#startSearchCrawling(searchQuery);
    }
  }

  // Throttled wheel event handler
  #handleWheel(e: WheelEvent) {
    if (e.deltaY > 0) {
      this.#next();
    } else {
      this.#prev();
    }
  }

  // Handle keyboard events
  #handleKeyUp(e: KeyboardEvent) {
    switch (e.code) {
      case 'ArrowRight':
        this.#next();
        break;
      case 'ArrowLeft':
        this.#prev();
        break;
    }
  }

  // Event delegation for all item repository clicks
  #handleRepositoryClick(e: Event) {
    const target = e.target as HTMLElement;

    // Handle different click targets
    if (target.closest('.opus label, .title label')) {
      this.#copyToClipboard(target);
    } else if (target.closest('.download-list label')) {
      const label = target.closest('.download-list label') as HTMLElement;
      this.#download(label, CONFIG.DOMAIN + label.dataset.href);
    } else if (target.closest('.actress-list label span')) {
      popupActress(target.textContent!);
    } else if (target.closest('.video label')) {
      const div = target.closest('div[data-opus]') as HTMLElement;
      if (div?.dataset.opus) popupFlay(div.dataset.opus);
    } else if (target.closest('.posted label')) {
      const div = target.closest('div[data-opus]') as HTMLElement;
      if (div?.dataset.opus) FlaySearch.torrent.Nonojav(div.dataset.opus);
    }
  }

  #next() {
    console.group(`🔄 [Next] 다음 아이템으로 이동: ${this.#paging.itemIndex} → ${this.#paging.itemIndex + 1}`);
    ++this.#paging.itemIndex;

    this.#showItem();
    console.groupEnd();

    // 추가 크롤링이 필요한 경우
    if (this.#paging.needCrawling()) {
      console.log(`🚀 [Crawling] 추가 크롤링 필요 - 남은 아이템: ${this.#paging.itemLength - this.#paging.itemIndex}개`);
      if (this.#isSearchMode) {
        // 검색 모드에서는 페이지 번호를 포함한 검색 URL로 크롤링
        ++this.#paging.srcPageNo;
        console.log(`🔍 [Search] 검색 모드 - 다음 페이지: ${this.#paging.srcPageNo}`);
      } else {
        // 일반 모드에서는 페이지 번호만 증가
        ++this.#paging.srcPageNo;
        console.log(`📄 [Page] 일반 모드 - 다음 페이지: ${this.#paging.srcPageNo}`);
      }
      this.#callCrawling();
    }
  }

  #prev() {
    console.group(`⬅️ [Prev] 이전 아이템으로 이동: ${this.#paging.itemIndex} → ${this.#paging.itemIndex - 1}`);
    --this.#paging.itemIndex;

    if (this.#paging.itemIndex < 0) {
      console.log(`🚫 [Prev] 첫 번째 아이템입니다 - 인덱스를 0으로 리셋`);
      this.#paging.itemIndex = 0;
      return;
    }
    this.#showItem();
    console.groupEnd();
  }

  #showItem() {
    const data = this.#itemList[this.#paging.itemIndex];
    if (!data) {
      console.warn(`⚠️ [ShowItem] 데이터가 없습니다 - 인덱스: ${this.#paging.itemIndex}`);
      this.#notice('데이터가 없습니다.', false, true);
      return;
    }

    console.log(`📺 [ShowItem] 아이템 표시: ${data.opus.text} (${this.#paging.itemIndex + 1}/${this.#paging.itemLength})`);

    // Move previous item to repository using DocumentFragment for better performance
    const prevDiv = this.article.querySelector('div');
    if (prevDiv) {
      const prevOpus = prevDiv.getAttribute('data-opus');
      console.log(`🗂️ [Repository] 이전 아이템을 저장소로 이동: ${prevOpus}`);
      this.itemRepository.appendChild(prevDiv);
    }

    // Get the new item
    const currentDiv = this.itemRepository.querySelector(`div[data-opus="${data.opus.text}"]`);
    if (currentDiv) {
      console.log(`✅ [Display] 현재 아이템을 화면에 표시: ${data.opus.text}`);
      this.article.appendChild(currentDiv);
    } else {
      console.error(`❌ [Display] 아이템을 찾을 수 없습니다: ${data.opus.text}`);
    }

    // Update store in background, don't wait for it
    nanoStore.update(data.opus.text, Date.now()).catch((err) => console.error('❌ [Store] 저장소 업데이트 실패:', err));

    this.#updateFootMessage();
  }

  /**
   * 성능 최적화를 위한 데이터 프리페치
   */
  async #prefetchData(itemList: CrawlingItem[]): Promise<void> {
    const opusList = itemList.map((data: CrawlingItem) => data.opus.text);
    const japNameList = itemList.flatMap((data: CrawlingItem) =>
      data.actressList.map((actress: LinkItem) => {
        let jap = '';
        const name = actress.text;
        if (name.includes('(')) {
          const parts = name
            .substring(0, name.length - 1)
            .split('(')
            .map((s: string) => s.trim());
          jap = parts[1] ?? '';
        } else {
          jap = name;
        }
        return jap;
      })
    );

    // 배치 비디오 데이터 가져오기
    const videoPromises = opusList.map(async (opus: string) => {
      if (!this.cacheManager.getVideo(opus)) {
        try {
          const video = await FlayFetch.getVideo(opus);
          const videoInfo: VideoInfo = video
            ? {
                rank: video.rank,
                play: video.play,
                lastModified: video.lastModified,
                error: false,
              }
            : { error: true };
          this.cacheManager.setVideo(opus, videoInfo);
        } catch (err) {
          this.cacheManager.setVideo(opus, { error: true });
        }
      }
    });

    // 배치 배우 데이터 가져오기
    const actressPromises = japNameList.map(async (jap: string) => {
      if (jap && !this.cacheManager.getActress(jap).length) {
        try {
          const actressList = await FlayFetch.getActressListByLocalname(jap);
          // Actress 타입을 ActressItem 타입으로 변환
          const convertedList = (actressList ?? []).map((actress) => ({
            text: actress.name ?? '',
            href: '',
            eng: actress.name ?? '',
            jap: actress.localName ?? '',
            fav: actress.favorite ? '💛' : '',
          }));
          this.cacheManager.setActress(jap, convertedList);
        } catch (err) {
          this.cacheManager.setActress(jap, []);
        }
      }
    });

    // 배치 레코드 가져오기
    const recordPromises = opusList.map(async (opus: string) => {
      if (!this.cacheManager.getRecord(opus)) {
        try {
          const record = await nanoStore.select(opus);
          this.cacheManager.setRecord(opus, record as { date: number } | null);
        } catch (err) {
          this.cacheManager.setRecord(opus, null);
        }
      }
    });

    // 모든 Promise를 병렬로 실행
    await Promise.all([Promise.all(videoPromises), Promise.all(actressPromises), Promise.all(recordPromises)]);
  }

  /**
   * 아이템 리스트 렌더링
   */
  async #renderItemList(itemList: CrawlingItem[]): Promise<void> {
    // 모든 데이터를 병렬로 프리페치한 후 렌더링
    await this.#prefetchData(itemList);

    // 배치 DOM 연산을 위한 DocumentFragment 생성
    const fragment = document.createDocumentFragment();

    let count = 0;
    for (const data of itemList) {
      // 캐시된 데이터 사용
      const video = this.cacheManager.getVideo(data.opus.text) ?? { error: true };

      // 캐시를 사용하여 배우 데이터 처리
      for (const actress of data.actressList) {
        let eng = '';
        let jap = '';

        const name = actress.text;
        if (name.includes('(')) {
          const parts = name
            .substring(0, name.length - 1)
            .split('(')
            .map((s: string) => s.trim());
          eng = parts[0] ? parts[0].split(' ').reverse().join(' ') : '';
          jap = parts[1] ?? '';
        } else {
          jap = name;
        }

        // 캐시된 배우 데이터 사용
        const actressList = this.cacheManager.getActress(jap);
        const latestActress = actressList[actressList.length - 1];

        actress['eng'] = latestActress?.eng ?? eng ?? ' ';
        actress['jap'] = jap;
        actress['fav'] = latestActress?.fav ?? '';
      }

      const div = document.createElement('div');
      div.dataset.opus = data.opus.text;
      div.dataset.itemIndex = String(this.#paging.itemIndex + count++);
      div.classList.toggle('has-video', !video.error);

      // 템플릿을 사용한 HTML 생성
      div.innerHTML = this.#generateItemHTML(data, video);

      // 캐시된 레코드 데이터 사용
      const record = this.cacheManager.getRecord(data.opus.text);
      if (record) {
        const viewDate = DateUtils.format(record.date, 'yyyy-MM-dd HH:mm');
        div.querySelector('.posted')!.appendChild(document.createElement('label')).innerHTML = `${viewDate}<sub> view</sub>`;

        if (data.posted.text < viewDate) {
          div.classList.add('record-viewed');
        } else {
          div.classList.add('record-updated');
        }
      }

      fragment.appendChild(div);
    }

    // 모든 아이템을 한 번에 추가
    this.itemRepository.appendChild(fragment);
  }

  /**
   * HTML 템플릿 생성 메서드
   * @param data - 크롤링된 아이템 데이터
   * @param video - 비디오 정보 (null이면 비디오 없음)
   * @returns 생성된 HTML 문자열
   */
  #generateItemHTML(data: CrawlingItem, video: VideoInfo): string {
    return `
      <div class="cover">
        <img src="${data.cover}">
      </div>
      <div class="opus" title="opus">
        <label data-href="${data.opus.href}">${data.opus.text}</label>
      </div>
      <div class="video" title="video info">
        ${
          !video || video.error
            ? ''
            : ` <label>${video.rank}<sub>rank</sub></label>
                <label>${video.play}<sub>play</sub></label>
                <label>${DateUtils.format(video.lastModified ?? '', 'yyyy-MM-dd')}<sub>modi.</sub></label>`
        }
      </div>
      <div class="release" title="release">
        <label>${data.release}</label>
      </div>
      <div class="title" title="title">
        <label>${data.title}</label>
      </div>
      <div class="tags" title="tags">
        ${data.tagList.map((tag: LinkItem) => `<label data-href="${tag.href}">${tag.text}</label>`).join('')}
      </div>
      <div class="actress-list" title="actress">
        ${data.actressList.map((actress: ActressItem) => `<label data-href="${actress.href}" title="${actress.text}">${actress.fav}<span title="english name">${actress.eng}</span> <span title="japanese name">${actress.jap}</span></label>`).join('')}
      </div>
      <div class="download-list" title="download. click to copy">
        ${data.downloadList.map((download: DownloadItem) => `<label data-href="${download.href}">${download.type} ${download.text}</label>`).join('')}
      </div>
      <div class="posted" title="posted">
        <label data-href="${data.posted.href}">${data.posted.text} <sub>posted</sub></label>
      </div>
    `;
  }

  /**
   * 클립보드 복사 기능
   */
  #copyToClipboard(target: HTMLElement | null, text = ''): void {
    const textToCopy = text || this.domManager.getText(target);
    void this.domManager.copyToClipboard(textToCopy, target ?? undefined);
  }

  /**
   * 파일 다운로드 기능
   */
  #download(target: HTMLElement | null, text = ''): void {
    const url = text || this.domManager.getText(target);
    if (!url) return;

    const formData = new FormData();
    formData.append('url', url);
    void ApiClient.getResponse('/download', { method: 'post', body: formData })
      .then(async (res) => {
        // 헤더에서 파일명을 가져옴
        const filename = res.headers.get('Content-Disposition')!.split('filename=')[1]!.replace(/"/g, '');
        return res.blob().then((blob) => ({ blob, filename }));
      })
      .then(({ blob, filename }) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url); // 메모리 해제
      })
      .catch((error) => {
        console.error('파일 다운로드 실패:', error);
      });
  }

  /**
   * 파싱 완료 후 DOM 업데이트 및 상태 관리
   */
  async parseOfNanojav(data: { message?: string }): Promise<void> {
    console.log(`📥 [Parse] 크롤링 데이터 수신 시작`);

    // 크롤링 완료 시간 측정 및 소요시간 계산
    const crawlingEndTime = performance.now();
    const crawlingDuration = this.#crawlingStartTime > 0 ? crawlingEndTime - this.#crawlingStartTime : 0;

    if (crawlingDuration > 0) {
      console.log(`⏱️ [Performance] 크롤링 소요시간: ${crawlingDuration.toFixed(2)}ms (${(crawlingDuration / 1000).toFixed(2)}초)`);
    }

    if (!data.message) {
      console.warn(`⚠️ [Parse] 데이터 메시지가 없습니다`);
      return;
    }

    console.log(`🔍 [Parse] HTML 파싱 시작 - 데이터 크기: ${data.message.length}자`);
    const doc = domParser.parseFromString(data.message, 'text/html');

    const postList = Array.from(doc.querySelectorAll('#content > div > div > div:nth-child(2) > div > div'));
    console.log(`📊 [Parse] 파싱된 아이템 수: ${postList.length}개`);

    if (postList.length > 0) {
      console.log(`✅ [Parse] 아이템 파싱 성공 - ${postList.length}개 아이템 발견`);
      this.#notice(postList.length + '개 아이템 구함');
    } else {
      console.error(`❌ [Parse] 아이템을 찾을 수 없습니다`);
      this.#notice('데이터를 구하지 못함', true, true);
      this.retryBtn.disabled = false; // 수동으로 다시 요청하도록 버튼 노출
      return;
    }

    const itemList = postList.map((div) => {
      const elementOfImg = div.querySelector('img.cover') as HTMLImageElement;
      const elementOfOpus = div.querySelector('.card-content h3.title a') as HTMLAnchorElement;
      const elementOfPost = div.querySelector('.card-content p.subtitle a') as HTMLAnchorElement;
      const nodeListOfTags = div.querySelectorAll('.tags a');
      const existsTag = div.querySelector('.tag') !== null;
      const elementOfSubtitle = div.querySelector(`.card-content > p:nth-child(${existsTag ? 4 : 3})`) as HTMLAnchorElement;
      const elementOfRelease = div.querySelector(`.card-content > p:nth-child(${existsTag ? 5 : 4})`) as HTMLParagraphElement;
      const nodeListOfActress = div.querySelectorAll('.card-content > div.mb-2.buttons.are-small > a');
      const nodeListOfDownload = div.querySelectorAll('.card-content > div.is-uppercase.has-text-weight-bold.buttons > a');

      return {
        opus: { text: this.domManager.getText(elementOfOpus), href: this.domManager.getHref(elementOfOpus) },
        cover: elementOfImg?.src ?? '',
        release: DateUtils.format(this.domManager.getText(elementOfRelease)?.replace('Release date:', '') ?? '', 'yyyy.MM.dd'),
        posted: { text: DateUtils.format(this.domManager.getText(elementOfPost), 'yyyy-MM-dd'), href: this.domManager.getHref(elementOfPost) },
        title: this.domManager.getText(elementOfSubtitle),
        actressList: Array.from(nodeListOfActress).map((element) => {
          const a = element as HTMLAnchorElement;
          return { text: this.domManager.getText(a), href: this.domManager.getHref(a) };
        }),
        downloadList: Array.from(nodeListOfDownload).map((element) => {
          const a = element as HTMLAnchorElement;
          return {
            text: this.domManager.getText(a),
            href: this.domManager.getHref(a),
            type: Array.from(a.querySelectorAll('.tooltip'))
              ?.map((tip) => (tip as HTMLElement).dataset.tooltip)
              .join(','),
          };
        }),
        tagList: Array.from(nodeListOfTags).map((a: Element) => ({
          text: this.domManager.getText(a as HTMLElement),
          href: this.domManager.getHref(a as HTMLElement),
        })),
      };
    });

    console.log(`📝 [Data] 아이템 리스트에 추가: ${itemList.length}개`);
    this.#itemList.push(...itemList);
    this.#paging.itemLength += postList.length;

    console.log(`📊 [Status] 현재 상태 - 전체 아이템: ${this.#paging.itemLength}개, 현재 인덱스: ${this.#paging.itemIndex}`);

    console.log(`🎨 [Render] DOM 렌더링 시작`);
    await this.#renderItemList(itemList);

    console.log(`✅ [Complete] 크롤링 및 렌더링 완료`);
    this.#notice('', true); // Hide notice
    this.#updateFootMessage();

    if (this.#paging.itemIndex === 0) {
      console.log(`🏠 [Init] 첫 번째 아이템 표시`);
      this.#showItem();
    }
  }

  /**
   * 검색어로 크롤링 시작
   * @param query 검색어
   */
  #startSearchCrawling(query: string) {
    this.#startPageNo = 1;
    this.#paging.srcPageNo = 1;
    this.#isSearchMode = true;
    this.#searchQuery = query;
    this.#callCrawling();
    document.querySelector('#starter')!.classList.add('hide');

    // 검색 모드임을 표시
    this.#notice(`"${query}" 검색 중...`);
  }

  #callCrawling() {
    console.group(`🚀 [Crawling] 크롤링 시작 - 모드: ${this.#isSearchMode ? '검색' : '일반'}, 페이지: ${this.#paging.srcPageNo}`);
    this.#crawlingStartTime = performance.now();

    let url: string;
    if (this.#isSearchMode && this.#searchQuery) {
      // 검색 모드인 경우 - 페이지 번호 포함
      if (this.#paging.srcPageNo === 1) {
        url = SEARCH_URL + encodeURIComponent(this.#searchQuery);
        console.log(`🔍 [Search] 첫 검색 페이지: "${this.#searchQuery}"`);
      } else {
        url = SEARCH_URL + encodeURIComponent(this.#searchQuery) + `&page=${this.#paging.srcPageNo}`;
        console.log(`🔍 [Search] 추가 검색 페이지: "${this.#searchQuery}" - ${this.#paging.srcPageNo}페이지`);
      }
    } else {
      // 일반 페이지 크롤링
      url = LIST_URL + this.#paging.srcPageNo;
      console.log(`📄 [Page] 일반 페이지 크롤링: ${this.#paging.srcPageNo}페이지`);
    }

    console.log(`🌐 [URL] 크롤링 대상: ${url}`);

    /*
      /crawling/curl은 async로 동작함.
      크롤링 결과는 SSE를 통해 받아서 emitCurl로 전달됨.
     */
    void ApiClient.get(`/crawling/curl?url=${encodeURIComponent(url)}`).catch((err) => {
      console.error(`❌ [Crawling] 크롤링 실패:`, err);
      this.#notice('데이터를 구하지 못함', true, true);
      this.retryBtn.disabled = false; // 수동으로 다시 요청하도록 버튼 노출
    });

    if (this.#isSearchMode && this.#searchQuery) {
      if (this.#paging.srcPageNo === 1) {
        this.#notice(`"${this.#searchQuery}" 검색 중...`);
      } else {
        this.#notice(`"${this.#searchQuery}" 검색 중... (${this.#paging.srcPageNo}페이지)`);
      }
    } else {
      this.#notice(this.#paging.srcPageNo + '페이지 크롤링 중...');
    }

    (document.querySelector('#srcPageURL') as HTMLAnchorElement).href = url;

    console.groupEnd();
  }

  #notice(message: string, hide = false, isError = false) {
    const noticeEl = document.querySelector('#notice')!;
    noticeEl.querySelector('#noticeMessage')!.innerHTML = message;
    noticeEl.classList.toggle('hide', hide);
    noticeEl.classList.toggle('error', isError);
  }

  #updateFootMessage() {
    const currentPageNo = Math.ceil((this.#paging.itemIndex + 1) / 15) + this.#startPageNo - 1;
    const currentItemNo = this.#paging.itemIndex + 1;
    const totalItemNo = this.#paging.itemLength;

    console.log(`📊 [Footer] 상태 업데이트 - 현재: ${currentItemNo}/${totalItemNo} (페이지: ${currentPageNo}/${this.#paging.srcPageNo})`);

    document.querySelector('#currentPageNo')!.innerHTML = String(currentPageNo);
    document.querySelector('#loadedPageNo')!.innerHTML = String(this.#paging.srcPageNo);
    document.querySelector('#currentItemNo')!.innerHTML = String(currentItemNo);
    document.querySelector('#totalItemNo')!.innerHTML = String(totalItemNo);
  }
}

const page = new Page();

window.emitCurl = async (data) => {
  console.group(`📡 [SSE] 서버에서 크롤링 데이터 수신`);
  await page.parseOfNanojav(data);
  console.groupEnd();
};
