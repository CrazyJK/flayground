import PlayTimeDB from '@flay/idb/PlayTimeDB';
import { generate } from '../../ai/index-proxy';
import ApiClient from '../../lib/ApiClient';
import FlayFetch, { Flay, Tag, TagGroup } from '../../lib/FlayFetch';
import { popupFlay } from '../../lib/FlaySearch';
import basketSVG from '../../svg/basket';
import controlsSVG from '../../svg/controls';
import { FlayBasket } from './FlayBasket';
import './FlayFlix.scss';

/**
 * FlayFlix용 커버 커스텀 엘리먼트.
 * 이미지 + 호버 시 하단에 겹쳐 보이는 정보 패널 (title, opus, actress)
 */
class FlixCover extends HTMLElement {
  private img!: HTMLImageElement;

  constructor() {
    super();
    this.innerHTML = `
      <img decoding="async" draggable="false" />
      <div class="flix-cover-info">
        <div class="flix-cover-title"></div>
        <div class="flix-cover-desc"></div>
      </div>
    `;
    this.img = this.querySelector('img') as HTMLImageElement;
  }

  /**
   * Flay 데이터로 커버를 설정한다
   * @param flay Flay 객체
   */
  setFlay(flay: Flay) {
    this.dataset.opus = flay.opus;
    this.img.dataset.src = ApiClient.buildUrl(`/static/cover/${flay.opus}`);
    this.img.alt = flay.title;

    const titleEl = this.querySelector('.flix-cover-title') as HTMLElement;
    const descEl = this.querySelector('.flix-cover-desc') as HTMLElement;
    titleEl.textContent = flay.title;
    descEl.textContent = `${flay.opus}  ${flay.actressList.join(', ')}`;
  }

  /** lazy load용 img 요소 반환 */
  getImg(): HTMLImageElement {
    return this.img;
  }
}

customElements.define('flix-cover', FlixCover);

/** 재생 시간 저장 주기 (ms) */
const PLAY_TIME_SAVE_INTERVAL = 60_000;

/** 스켈레톤 행 수 */
const SKELETON_COUNT = 5;
/** 스켈레톤 커버 수 (한 행당) */
const SKELETON_COVER_COUNT = 8;

/**
 * 넷플릭스 스타일의 플레이어 패널
 * - 랜덤 opus로 즉시 비디오 재생
 * - 태그별 flay 목록을 순차 fade-in 렌더링 (IntersectionObserver lazy-load)
 * - AI 추천 행을 태그 맨 위에 비동기 삽입
 */
export class FlayFlix extends HTMLElement {
  private opusList: string[] = [];
  private tagGroups: TagGroup[] = [];
  private tags: Tag[] = [];
  private opus: string | null = null;
  /** 최근 재생된 태그와 그 횟수를 저장하는 맵 */
  private recentTags: Map<number, number> = new Map();
  private lazyObserver!: IntersectionObserver;
  /** 커버 이미지 lazy load 용 IntersectionObserver */
  private coverObserver!: IntersectionObserver;
  private playTimeDB = new PlayTimeDB();
  private playTimeTimer: ReturnType<typeof setInterval> | null = null;
  /** opus → Flay 캐시 */
  private flayCache = new Map<string, Flay>();

  private video!: HTMLVideoElement;
  private flayTitle!: HTMLDivElement;
  private flayOpus!: HTMLSpanElement;
  private flayActress!: HTMLDivElement;
  private flayRelease!: HTMLSpanElement;
  private flayTags!: HTMLSpanElement;
  private seekBar!: HTMLInputElement;
  private timeDisplay!: HTMLSpanElement;
  private volumeBar!: HTMLInputElement;
  private muteBtn!: HTMLButtonElement;
  private playPauseBtn!: HTMLButtonElement;
  private nextBtn!: HTMLButtonElement;
  private basketBtn!: HTMLButtonElement;

  constructor() {
    super();
    this.className = 'welcome-page';
    this.innerHTML = `
      <div class="video-container">
        <video autoplay muted loop class="background-video"></video>
        <div class="info">
          <div class="flay-title"></div>
          <div class="flay-desc">
            <span class="flay-opus"></span>
            <button type="button" class="basket-btn" title="바스켓에 추가">${basketSVG}</button>
            <span class="flay-actress"></span>
            <span class="flay-release"></span>
            <span class="flay-tags"></span>
          </div>
          <div class="flay-controls">
            <div class="seek-bar-wrapper"><input type="range" class="seek-bar" min="0" max="1000" value="0" step="1" /></div>
            <div class="controls-row">
              <button type="button" class="play-pause-btn" title="일시정지">${controlsSVG.pause}</button>
              <button type="button" class="next-btn" title="다음 랜덤 재생">${controlsSVG.nextTrack}</button>
              <div class="volume-control">
                <button type="button" class="mute-btn" title="음소거">${controlsSVG.volume}</button>
                <input type="range" class="volume-bar" min="0" max="100" value="0" step="1" />
              </div>
              <span class="time-display">0:00:00 / 0:00:00</span>
            </div>
          </div>
        </div>
      </div>
      <div class="tag-container"></div>
    `;

    this.video = this.querySelector('video') as HTMLVideoElement;
    this.flayTitle = this.querySelector('.flay-title') as HTMLDivElement;
    this.flayOpus = this.querySelector('.flay-opus') as HTMLSpanElement;
    this.flayActress = this.querySelector('.flay-actress') as HTMLDivElement;
    this.flayRelease = this.querySelector('.flay-release') as HTMLSpanElement;
    this.flayTags = this.querySelector('.flay-tags') as HTMLSpanElement;
    this.seekBar = this.querySelector('.seek-bar') as HTMLInputElement;
    this.timeDisplay = this.querySelector('.time-display') as HTMLSpanElement;
    this.volumeBar = this.querySelector('.volume-bar') as HTMLInputElement;
    this.muteBtn = this.querySelector('.mute-btn') as HTMLButtonElement;
    this.playPauseBtn = this.querySelector('.play-pause-btn') as HTMLButtonElement;
    this.nextBtn = this.querySelector('.next-btn') as HTMLButtonElement;
    this.basketBtn = this.querySelector('.basket-btn') as HTMLButtonElement;

    // 바스켓 추가 버튼
    this.basketBtn.addEventListener('click', () => {
      if (this.opus) {
        FlayBasket.add(this.opus);
        document.dispatchEvent(new CustomEvent(FlayBasket.EVENT_BASKET_ADD));
      }
    });

    // 바스켓 변경 감지 → Basket 행 실시간 업데이트
    document.addEventListener(FlayBasket.EVENT_BASKET_ADD, () => this.refreshBasketRow());
    window.addEventListener('storage', (e) => {
      if (e.key === 'flay-basket') this.refreshBasketRow();
    });

    this.flayTitle.style.cursor = 'pointer';
    this.flayTitle.addEventListener('click', () => {
      if (this.opus) {
        this.video.pause();
        this.stopPlayTimeTracking();
        popupFlay(this.opus);
      }
    });

    this.video.addEventListener('click', () => {
      this.togglePlayPause();
    });

    // 재생/일시정지 버튼
    this.playPauseBtn.addEventListener('click', () => {
      this.togglePlayPause();
    });

    // 다음 랜덤 opus 재생
    this.nextBtn.addEventListener('click', () => {
      this.playRandomOpus();
    });

    // 재생 시간 업데이트 (1초 주기 throttle)
    let lastTimeUpdate = 0;
    this.video.addEventListener('timeupdate', () => {
      const now = Date.now();
      if (now - lastTimeUpdate < 1000) return;
      lastTimeUpdate = now;
      if (!this.video.duration) return;
      const pos = (this.video.currentTime / this.video.duration) * 1000;
      this.seekBar.value = String(Math.floor(pos));
      this.timeDisplay.textContent = `${this.formatTime(this.video.currentTime)} / ${this.formatTime(this.video.duration)}`;
    });

    // seek bar 조작
    this.seekBar.addEventListener('input', () => {
      if (!this.video.duration) return;
      this.video.currentTime = (Number(this.seekBar.value) / 1000) * this.video.duration;
    });

    // 볼륨 조절
    this.volumeBar.addEventListener('input', () => {
      this.video.volume = Number(this.volumeBar.value) / 100;
      this.video.muted = false;
      this.muteBtn.innerHTML = this.video.volume === 0 ? controlsSVG.volumeMuted : controlsSVG.volume;
    });

    // 음소거 토글
    this.muteBtn.addEventListener('click', () => {
      this.video.muted = !this.video.muted;
      this.muteBtn.innerHTML = this.video.muted ? controlsSVG.volumeMuted : controlsSVG.volume;
    });

    // 뷰포트 진입 시 태그 행의 flay를 로드하는 IntersectionObserver
    this.lazyObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const tagEl = entry.target as HTMLElement;
          this.lazyObserver.unobserve(tagEl);
          this.loadTagFlays(tagEl);
        });
      },
      { root: this.querySelector('.tag-container'), rootMargin: '200px 0px' }
    );

    // 커버 이미지 lazy load IntersectionObserver
    this.coverObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const img = entry.target as HTMLImageElement;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            delete img.dataset.src;
          }
          this.coverObserver.unobserve(img);
        });
      },
      { root: this.querySelector('.tag-container'), rootMargin: '100px 300px' }
    );
  }

  async connectedCallback() {
    // 스켈레톤 즉시 표시
    this.showSkeleton();

    // 1단계: opus 목록 가져와서 랜덤 비디오 즉시 재생
    this.opusList = await FlayFetch.getOpusList({});
    this.opus = this.opusList[Math.floor(Math.random() * this.opusList.length)] || null;
    if (this.opus) this.playOpus();

    // 2단계: 나머지 데이터 로드 → 태그 렌더링 + AI 추천
    void this.fetchData();
  }

  // ── 데이터 로드 ──────────────────────────────────────────────

  /** 태그 그룹, 태그 목록, 최근 재생 이력을 로드하고 렌더링을 시작한다 */
  private async fetchData() {
    try {
      const [tagGroups, tags, histories] = await Promise.all([FlayFetch.getTagGroups(), FlayFetch.getTagListWithCount(), FlayFetch.getHistoryListByAction('PLAY', 30)]);
      this.tagGroups = tagGroups;
      this.tags = tags.filter((tag) => (tag.count || 0) > 0);
      this.recentTags = new Map<number, number>();

      // 최근 재생 이력에서 태그별 빈도 집계
      const playedOpusList = histories.map((h) => h.opus).filter((opus) => this.opusList.includes(opus));
      if (playedOpusList.length > 0) {
        const playedFlays = await this.cachedGetFlayList(...playedOpusList);
        playedFlays.forEach((flay) => {
          flay.video.tags.forEach((tag) => {
            this.recentTags.set(tag.id, (this.recentTags.get(tag.id) || 0) + 1);
          });
        });
      }

      // 스켈레톤 제거 후 태그 순차 렌더링
      this.renderTags();
      void this.renderBasketRow();
      void this.renderAIRecommendations();
    } catch (error) {
      console.error('데이터 로드 오류:', error);
      this.innerHTML = `<h1>Welcome to Flay</h1><p>데이터 로드 실패</p>`;
    }
  }

  /**
   * 캐시를 활용하여 Flay 목록을 가져온다. 캐시에 없는 opus만 서버에서 조회
   * @param opusList 조회할 opus 목록
   * @returns Flay 배열
   */
  private async cachedGetFlayList(...opusList: string[]): Promise<Flay[]> {
    const uncached = opusList.filter((opus) => !this.flayCache.has(opus));
    if (uncached.length > 0) {
      const fetched = await FlayFetch.getFlayList(...uncached);
      fetched.forEach((flay) => this.flayCache.set(flay.opus, flay));
    }
    return opusList.map((opus) => this.flayCache.get(opus)).filter((flay): flay is Flay => flay != null);
  }

  // ── 비디오 재생 ──────────────────────────────────────────────

  /** 현재 선택된 opus의 비디오를 재생하고 정보를 표시한다 */
  private playOpus() {
    this.stopPlayTimeTracking();

    const opus = this.opus!;
    this.video.poster = ApiClient.buildUrl(`/static/cover/${opus}`);
    this.video.src = ApiClient.buildUrl(`/flays/${opus}/stream/movie/0`);

    // 저장된 재생 위치가 있으면 이어재생
    this.playTimeDB.select(opus).then((record) => {
      console.log('저장된 재생 위치', opus, record);
      if (record && record.time > 0 && record.duration > 0 && record.time < record.duration - 5) {
        this.video.currentTime = record.time;
      }
    });

    this.startPlayTimeTracking(opus);

    // 캐시에서 먼저 찾고, 없으면 서버에서 조회
    const cached = this.flayCache.get(opus);
    const flayPromise = cached ? Promise.resolve(cached) : FlayFetch.getFlay(opus);
    flayPromise.then((flay) => {
      if (!flay) return;
      this.flayTitle.textContent = flay.title;
      this.flayActress.textContent = flay.actressList.join(', ');
      this.flayOpus.textContent = flay.opus;
      this.flayRelease.textContent = flay.release;
      this.flayTags.textContent = flay.video.tags.map((tag) => tag.name).join(', ');
    });
  }

  /** 랜덤 opus를 선택하여 재생한다 */
  private playRandomOpus() {
    if (this.opusList.length === 0) return;
    this.opus = this.opusList[Math.floor(Math.random() * this.opusList.length)] || null;
    if (this.opus) {
      this.playOpus();
      this.playPauseBtn.innerHTML = controlsSVG.pause;
    }
  }

  /** 재생/일시정지를 토글한다 */
  private togglePlayPause() {
    if (this.video.paused) {
      this.video.play();
      this.playPauseBtn.innerHTML = controlsSVG.pause;
    } else {
      this.video.pause();
      this.playPauseBtn.innerHTML = controlsSVG.play;
    }
  }

  /** 1분 주기로 PlayTimeDB에 재생 위치를 저장한다 */
  private startPlayTimeTracking(opus: string) {
    this.playTimeTimer = setInterval(() => {
      if (this.video.paused || this.video.ended) return;
      void this.playTimeDB.update(opus, this.video.currentTime, this.video.duration);
    }, PLAY_TIME_SAVE_INTERVAL);
  }

  /** 재생 시간 추적 타이머를 정리하고 마지막 위치를 저장한다 */
  private stopPlayTimeTracking() {
    if (this.playTimeTimer) {
      clearInterval(this.playTimeTimer);
      this.playTimeTimer = null;
    }
    if (this.opus && this.video.currentTime > 0) {
      void this.playTimeDB.update(this.opus, this.video.currentTime, this.video.duration);
    }
  }

  /**
   * 초를 h:mm:ss 형식으로 변환한다
   * @param seconds 변환할 초
   * @returns h:mm:ss 형식 문자열
   */
  private formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  // ── 태그 렌더링 ──────────────────────────────────────────────

  /** 로딩 중 스켈레톤 UI를 태그 컨테이너에 표시한다 */
  private showSkeleton() {
    const tagContainer = this.querySelector('.tag-container') as HTMLElement;
    for (let i = 0; i < SKELETON_COUNT; i++) {
      const skeleton = document.createElement('div');
      skeleton.className = 'tag skeleton';
      skeleton.innerHTML = `
        <span class="skeleton-text"></span>
        <div class="flays">${'<div class="flay-cover skeleton-cover"></div>'.repeat(SKELETON_COVER_COUNT)}</div>`;
      tagContainer.appendChild(skeleton);
    }
  }

  /** 태그를 최근 재생 빈도순으로 정렬하여 순차 fade-in 렌더링한다 */
  private renderTags() {
    const tagContainer = this.querySelector('.tag-container') as HTMLElement;
    tagContainer.innerHTML = '';

    const groupNameMap = new Map(this.tagGroups.map((g) => [g.id, g.name]));
    const sortedTags = [...this.tags].sort((a, b) => (this.recentTags.get(b.id) || 0) - (this.recentTags.get(a.id) || 0));

    sortedTags.forEach((tag, index) => {
      const groupName = groupNameMap.get(tag.group) || '';
      const tagElement = document.createElement('div');
      tagElement.id = `tag-${tag.id}`;
      tagElement.className = 'tag fade-in';
      tagElement.style.animationDelay = `${index * 80}ms`;
      tagElement.dataset.tagId = String(tag.id);
      tagElement.innerHTML = `
        <span>${tag.name}
          <small class="tag-group-label">${groupName}</small>
          <small class="tag-count">(${tag.count})</small>
        </span>
        <div class="flays-wrapper">
          <button type="button" class="scroll-btn scroll-left" title="처음으로">&#x276E;</button>
          <div class="flays">
            ${'<div class="flay-cover skeleton-cover"></div>'.repeat(SKELETON_COVER_COUNT)}
          </div>
          <button type="button" class="scroll-btn scroll-right" title="끝으로">&#x276F;</button>
        </div>`;

      tagContainer.appendChild(tagElement);
      this.lazyObserver.observe(tagElement);
    });
  }

  /**
   * 태그 행 하나를 생성하여 tagContainer에 삽입한다
   * @param label 행 제목
   * @param flays 표시할 flay 목록
   * @param prepend true면 맨 앞에 삽입
   * @param groupLabel 태그 그룹명
   * @param count 태그 카운트
   */
  private renderTagRow(label: string, flays: Flay[], prepend = false, groupLabel?: string, count?: number) {
    const tagContainer = this.querySelector('.tag-container') as HTMLElement;
    const row = document.createElement('div');
    row.className = `tag fade-in${prepend ? ' tag-ai' : ''}`;
    const groupHtml = groupLabel ? `<small class="tag-group-label">${groupLabel}</small>` : '';
    const countHtml = count != null ? `<small class="tag-count">(${count})</small>` : `<small class="tag-count">(${flays.length})</small>`;
    row.innerHTML = `<span>${label} ${groupHtml} ${countHtml}</span><div class="flays-wrapper"><button type="button" class="scroll-btn scroll-left" title="처음으로">&#x276E;</button><div class="flays"></div><button type="button" class="scroll-btn scroll-right" title="끝으로">&#x276F;</button></div>`;

    const flaysContainer = row.querySelector('.flays') as HTMLElement;
    flays.forEach((flay, i) => {
      const cover = this.createCoverElement(flay);
      if (prepend) {
        cover.style.animationDelay = `${i * 60}ms`;
        cover.classList.add('cover-fade-in');
      }
      flaysContainer.appendChild(cover);
    });
    this.enableDragScroll(flaysContainer);

    // 좌우 끝 이동 버튼
    const scrollLeft = row.querySelector('.scroll-left') as HTMLButtonElement;
    const scrollRight = row.querySelector('.scroll-right') as HTMLButtonElement;
    scrollLeft.addEventListener('click', () => flaysContainer.scrollTo({ left: 0, behavior: 'smooth' }));
    scrollRight.addEventListener('click', () => flaysContainer.scrollTo({ left: flaysContainer.scrollWidth, behavior: 'smooth' }));

    if (prepend) {
      tagContainer.prepend(row);
    } else {
      tagContainer.appendChild(row);
    }
  }

  /** 태그 행이 뷰포트에 진입하면 서버에서 flay 목록을 로드하여 가중 셔플 후 커버로 교체한다 */
  private async loadTagFlays(tagElement: HTMLElement) {
    const tagId = Number(tagElement.dataset.tagId);
    const flaysContainer = tagElement.querySelector('.flays') as HTMLElement;

    // 좌우 끝 이동 버튼 연결
    const scrollLeftBtn = tagElement.querySelector('.scroll-left') as HTMLButtonElement;
    const scrollRightBtn = tagElement.querySelector('.scroll-right') as HTMLButtonElement;
    scrollLeftBtn?.addEventListener('click', () => flaysContainer.scrollTo({ left: 0, behavior: 'smooth' }));
    scrollRightBtn?.addEventListener('click', () => flaysContainer.scrollTo({ left: flaysContainer.scrollWidth, behavior: 'smooth' }));

    const flayList = await FlayFetch.getFlayListByTagId(tagId);

    // 가중 랜덤 셔플: 현재 태그 제외, recentTags 합산을 가중치로 사용
    const weighted = flayList.map((flay) => {
      const score = flay.video.tags.reduce((sum, t) => sum + (t.id !== tagId ? this.recentTags.get(t.id) || 0 : 0), 0);
      return { flay, weight: score + 1 };
    });
    for (let i = weighted.length - 1; i > 0; i--) {
      const totalWeight = weighted.slice(0, i + 1).reduce((s, w) => s + w.weight, 0);
      let rand = Math.random() * totalWeight;
      let j = 0;
      while (j < i && rand > weighted[j]!.weight) {
        rand -= weighted[j]!.weight;
        j++;
      }
      [weighted[i], weighted[j]] = [weighted[j]!, weighted[i]!];
    }

    // 스켈레톤 제거 후 실제 커버로 교체
    flaysContainer.innerHTML = '';
    weighted.forEach(({ flay }) => flaysContainer.appendChild(this.createCoverElement(flay)));
    this.enableDragScroll(flaysContainer);
  }

  /**
   * FlixCover 엘리먼트를 생성한다. 클릭 핸들러와 이미지 lazy load를 등록
   * @param flay Flay 데이터
   * @returns FlixCover 엘리먼트
   */
  private createCoverElement(flay: Flay): FlixCover {
    const cover = new FlixCover();
    cover.setFlay(flay);
    cover.addEventListener('click', () => {
      this.opus = flay.opus;
      this.playOpus();
    });
    this.coverObserver.observe(cover.getImg());
    return cover;
  }

  // ── 특수 행 (Basket / AI 추천) ────────────────────────────────

  /** 바스켓에 담긴 flay 목록을 태그 컨테이너 맨 위에 행으로 삽입한다 */
  private async renderBasketRow() {
    const basket = FlayBasket.getAll();
    if (basket.size === 0) return;
    const shuffledBasket = Array.from(basket).sort(() => Math.random() - 0.5);

    const flays = await this.cachedGetFlayList(...shuffledBasket);
    if (flays.length === 0) return;

    this.renderTagRow('Basket', flays, true);
    const tagContainer = this.querySelector('.tag-container') as HTMLElement;
    const basketRow = tagContainer.firstElementChild as HTMLElement | null;
    if (basketRow) basketRow.classList.add('tag-basket');
  }

  /** 바스켓 변경 시 Basket 행을 실시간으로 갱신한다. 기존 행이 있으면 커버만 업데이트 */
  private async refreshBasketRow() {
    const tagContainer = this.querySelector('.tag-container') as HTMLElement;
    if (!tagContainer) return;

    const basket = FlayBasket.getAll();
    const existingRow = tagContainer.querySelector('.tag-basket') as HTMLElement | null;

    if (basket.size === 0) {
      existingRow?.remove();
      return;
    }

    const basketArray = Array.from(basket);
    const flays = await this.cachedGetFlayList(...basketArray);
    if (flays.length === 0) {
      existingRow?.remove();
      return;
    }

    if (existingRow) {
      const flaysContainer = existingRow.querySelector('.flays') as HTMLElement;
      const existingOpusSet = new Set(Array.from(flaysContainer.querySelectorAll<FlixCover>('flix-cover')).map((el) => el.dataset.opus));

      for (const flay of flays) {
        if (existingOpusSet.has(flay.opus)) continue;
        const cover = this.createCoverElement(flay);
        cover.classList.add('cover-fade-in');
        flaysContainer.prepend(cover);
      }

      const countEl = existingRow.querySelector('.tag-count');
      if (countEl) countEl.textContent = `(${flays.length})`;
    } else {
      this.renderTagRow('Basket', flays, true);
      const basketRow = tagContainer.firstElementChild as HTMLElement | null;
      if (basketRow) basketRow.classList.add('tag-basket');
    }
  }

  /** AI에게 추천받아 태그 컨테이너 맨 위에 삽입한다. 랜덤 샘플링으로 매번 다른 결과를 생성 */
  private async renderAIRecommendations() {
    const styles = getComputedStyle(this);
    const remPx = parseFloat(styles.fontSize) || 16;
    const coverWidth = parseFloat(styles.getPropertyValue('--flix-cover-width')) * remPx;
    const coverGap = parseFloat(styles.getPropertyValue('--flix-cover-gap')) * remPx;
    const availableWidth = this.clientWidth - 5 * remPx;
    const lineCount = Math.max(3, Math.floor(availableWidth / (coverWidth + coverGap)));
    const requestCount = Math.ceil((lineCount * 2) / 10) * 10;

    const systemPrompt = `다음 목록에서 ${requestCount}개를 추천하세요. opus 코드만 쉼표로 구분하여 답하세요.\n`;
    const MODEL_TOKEN_LIMIT = 8000;
    const COMPLETION_TOKENS = 300;
    const PROMPT_OVERHEAD = 500;
    const availableTokens = MODEL_TOKEN_LIMIT - COMPLETION_TOKENS - PROMPT_OVERHEAD;

    /** 랜덤 셔플 후 토큰 예산 내에서 프롬프트를 생성한다 */
    const buildPrompt = async () => {
      const shuffled = [...this.opusList].sort(() => Math.random() - 0.5);
      const prefetchCount = Math.min(shuffled.length, 500);
      await this.cachedGetFlayList(...shuffled.slice(0, prefetchCount));

      const items: string[] = [];
      let estimatedTokens = 0;
      for (const opus of shuffled) {
        const flay = this.flayCache.get(opus);
        const item = flay ? `${opus}|${flay.video.tags.map((t) => t.name).join(',')}` : opus;
        const tokenEstimate = Math.ceil(item.replace(/[가-힣]/g, '..').length / 2) + 1;
        if (estimatedTokens + tokenEstimate > availableTokens) break;
        estimatedTokens += tokenEstimate;
        items.push(item);
      }
      console.log('AI 추천 프롬프트:', `${items.length}건, ~${estimatedTokens}토큰`);
      return `${systemPrompt}${items.join('\n')}`;
    };

    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const prompt = await buildPrompt();
        const response = await generate(prompt, { maxTokens: 300, temperature: 1.0 });
        const recommended = response.text
          .replace(/[^a-zA-Z0-9\-,\s]/g, '')
          .trim()
          .split(/[,\s]+/)
          .filter((opus) => this.opusList.includes(opus));
        console.log('AI 추천 원본:', response.text);
        const unique = [...new Set(recommended)];
        console.log('AI 추천 최종:', unique);
        if (unique.length === 0) return;

        const flays = await this.cachedGetFlayList(...unique);
        this.renderTagRow('AI 추천', flays, true);
        return;
      } catch (error) {
        console.error(`AI 추천 오류 (${attempt}/${maxRetries}):`, error);
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, 1000 * attempt));
        }
      }
    }
  }

  // ── UI 유틸리티 ──────────────────────────────────────────────

  /** 컨테이너에 마우스 드래그 좌우 스크롤을 활성화한다 */
  private enableDragScroll(container: HTMLElement) {
    let isDown = false;
    let isDragging = false;
    let startX = 0;
    let scrollLeft = 0;

    container.addEventListener('mousedown', (e) => {
      isDown = true;
      isDragging = false;
      startX = e.pageX - container.offsetLeft;
      scrollLeft = container.scrollLeft;
      e.preventDefault();
    });

    container.addEventListener('mouseleave', () => {
      isDown = false;
      isDragging = false;
      container.classList.remove('dragging');
    });

    container.addEventListener('mouseup', () => {
      isDown = false;
      container.classList.remove('dragging');
    });

    // 드래그 중 클릭 방지: 실제 드래그 후 click 이벤트를 한 번 무시
    container.addEventListener(
      'click',
      (e) => {
        if (isDragging) {
          e.stopPropagation();
          isDragging = false;
        }
      },
      true
    );

    container.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      const x = e.pageX - container.offsetLeft;
      const diff = Math.abs(x - startX);
      if (diff > 5) {
        isDragging = true;
        container.classList.add('dragging');
        e.preventDefault();
        const walk = (x - startX) * 1.5;
        container.scrollLeft = scrollLeft - walk;
      }
    });
  }
}

customElements.define('flay-flix', FlayFlix);
