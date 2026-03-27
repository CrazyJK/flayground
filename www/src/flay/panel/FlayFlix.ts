import PlayTimeDB from '@flay/idb/PlayTimeDB';
import { generate } from '../../ai/index-proxy';
import ApiClient from '../../lib/ApiClient';
import FlayFetch, { Flay, Tag, TagGroup } from '../../lib/FlayFetch';
import { popupFlay } from '../../lib/FlaySearch';
import { FlayBasket } from './FlayBasket';
import './FlayFlix.scss';

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

  constructor() {
    super();
    this.className = 'welcome-page';
    this.innerHTML = `
      <div class="video-container">
        <video autoplay muted loop class="background-video" style="width: 100%; height: 100%; object-fit: cover;"></video>
        <div class="info">
          <div class="flay-title"></div>
          <div class="flay-desc">
            <span class="flay-opus"></span>
            <span class="flay-actress"></span>
            <span class="flay-release"></span>
            <span class="flay-tags"></span>
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

    this.flayTitle.style.cursor = 'pointer';
    this.flayTitle.addEventListener('click', () => {
      if (this.opus) {
        this.video.pause();
        this.stopPlayTimeTracking();
        popupFlay(this.opus);
      }
    });

    this.video.addEventListener('click', () => {
      if (this.video.paused) this.video.play();
      else this.video.pause();
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

  /** 로딩 중 스켈레톤 표시 */
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

  private async fetchData() {
    try {
      const [tagGroups, tags, histories] = await Promise.all([FlayFetch.getTagGroups(), FlayFetch.getTagListWithCount(), FlayFetch.getHistoryListByAction('PLAY', 30)]);
      this.tagGroups = tagGroups;
      this.tags = tags.filter((tag) => (tag.count || 0) > 0);
      this.recentTags = new Map<number, number>();

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

      // 바스켓 행을 태그 맨 위에 삽입
      void this.renderBasketRow();

      // AI 추천 행을 비동기로 태그 맨 위에 삽입
      void this.renderAIRecommendations();
    } catch (error) {
      console.error('데이터 로드 오류:', error);
      this.innerHTML = `<h1>Welcome to Flay</h1><p>데이터 로드 실패</p>`;
    }
  }

  /**
   * 바스켓에 담긴 flay 목록을 태그 컨테이너 맨 위에 행으로 삽입
   */
  private async renderBasketRow() {
    const basket = FlayBasket.getAll();
    if (basket.size === 0) return;

    const flays = await this.cachedGetFlayList(...basket);
    if (flays.length === 0) return;

    this.renderTagRow('Basket', flays, true);
  }

  /**
   * AI에게 추천받아 태그 컨테이너 맨 위에 삽입.
   * 매번 다른 결과를 위해 랜덤 샘플링, opus+title+tags 정보를 토큰 제한에 맞게 전송
   */
  private async renderAIRecommendations() {
    const remPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const coverWidth = 11 * remPx + 0.375 * remPx;
    const availableWidth = this.clientWidth - 5 * remPx;
    const lineCount = Math.max(3, Math.floor(availableWidth / coverWidth));
    const requestCount = Math.ceil(lineCount * 2);

    // 프롬프트 고정 부분 (약 80토큰 여유)
    const systemPrompt = `다음 목록에서 ${requestCount}개를 추천하세요. opus 코드만 쉼표로 구분하여 답하세요.\n`;
    const MODEL_TOKEN_LIMIT = 8000; // 모델 컨텍스트 한계 (고정)
    const COMPLETION_TOKENS = 300; // 응답용 토큰
    const PROMPT_OVERHEAD = 500; // 시스템 프롬프트 + 프록시 메시지 래핑 토큰
    const availableTokens = MODEL_TOKEN_LIMIT - COMPLETION_TOKENS - PROMPT_OVERHEAD;

    // 전체 목록 랜덤 셔플
    const shuffled = [...this.opusList].sort(() => Math.random() - 0.5);

    // 캐시 사전 로드: 토큰 예산을 채울 수 있을 만큼만 미리 조회
    const prefetchCount = Math.min(shuffled.length, 500);
    await this.cachedGetFlayList(...shuffled.slice(0, prefetchCount));

    // opus별 정보 문자열 생성 + 토큰 예산 내에서 최대한 채우기
    const items: string[] = [];
    let estimatedTokens = 0;

    for (const opus of shuffled) {
      const flay = this.flayCache.get(opus);
      let item: string;
      if (flay) {
        const tags = flay.video.tags.map((t) => t.name).join(',');
        item = `${opus}|${tags}`;
      } else {
        item = opus;
      }
      // 토큰 추정: 한글 1자 ≈ 2토큰, 영문/숫자/특수문자 2자 ≈ 1토큰, +1 (줄바꿈)
      const tokenEstimate = Math.ceil(item.replace(/[가-힣]/g, '..').length / 2) + 1;
      if (estimatedTokens + tokenEstimate > availableTokens) break;
      estimatedTokens += tokenEstimate;
      items.push(item);
    }

    const prompt = `${systemPrompt}${items.join('\n')}`;
    console.log('AI 추천 프롬프트:', `${items.length}건, ~${estimatedTokens}토큰`);
    try {
      const response = await generate(prompt, { maxTokens: 300, temperature: 1.0 });
      const recommended = response.text
        .replace(/[^a-zA-Z0-9\-,\s]/g, '')
        .trim()
        .split(/[,\s]+/)
        .filter((opus) => this.opusList.includes(opus));
      console.log('AI 추천 원본:', response.text);
      // 중복 제거 후 lineCount + 여유분으로 제한
      const unique = [...new Set(recommended)];
      console.log('AI 추천 최종:', unique);
      if (unique.length === 0) return;

      const flays = await this.cachedGetFlayList(...unique);
      this.renderTagRow('AI 추천', flays, true);
    } catch (error) {
      console.error('AI 추천 오류:', error);
    }
  }

  /**
   * 태그 행 하나를 생성하여 tagContainer에 삽입
   * @param label 행 제목
   * @param flays 표시할 flay 목록
   * @param prepend true면 맨 앞에 삽입
   * @param groupLabel 태그 그룹명 (선택)
   * @param count 태그 카운트 (선택)
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

  /**
   * 캐시를 활용하여 Flay 목록을 가져옴. 캐시에 없는 opus만 서버에서 조회
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

  /** flay-cover 이미지 요소 생성 (공통, IntersectionObserver lazy load) */
  private createCoverElement(flay: Flay): HTMLImageElement {
    const cover = document.createElement('img');
    cover.className = 'flay-cover';
    cover.dataset.src = ApiClient.buildUrl(`/static/cover/${flay.opus}`);
    cover.alt = flay.title;
    cover.decoding = 'async';
    cover.draggable = false;
    cover.addEventListener('click', () => {
      this.opus = flay.opus;
      this.playOpus();
    });

    // 뷰포트 진입 시 실제 src 설정
    this.coverObserver.observe(cover);
    return cover;
  }

  private playOpus() {
    // 이전 타이머 정리
    this.stopPlayTimeTracking();

    const opus = this.opus!;
    this.video.poster = ApiClient.buildUrl(`/static/cover/${opus}`);
    this.video.src = ApiClient.buildUrl(`/stream/flay/movie/${opus}/0`);

    // 저장된 재생 위치가 있으면 이어재생
    this.playTimeDB.select(opus).then((record) => {
      console.log('저장된 재생 위치', opus, record);
      if (record && record.time > 0 && record.duration > 0 && record.time < record.duration - 5) {
        this.video.currentTime = record.time;
      }
    });

    // 1분 주기 재생 시간 저장 시작
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

  /** 1분 주기로 PlayTimeDB에 재생 위치 저장 */
  private startPlayTimeTracking(opus: string) {
    this.playTimeTimer = setInterval(() => {
      if (this.video.paused || this.video.ended) return;
      void this.playTimeDB.update(opus, this.video.currentTime, this.video.duration);
    }, PLAY_TIME_SAVE_INTERVAL);
  }

  /** 재생 시간 추적 타이머 정리 및 최종 저장 */
  private stopPlayTimeTracking() {
    if (this.playTimeTimer) {
      clearInterval(this.playTimeTimer);
      this.playTimeTimer = null;
    }
    // 이전 opus의 마지막 재생 위치 저장
    if (this.opus && this.video.currentTime > 0) {
      void this.playTimeDB.update(this.opus, this.video.currentTime, this.video.duration);
    }
  }

  /** 태그를 순차적으로 fade-in하며 렌더링. flay 로드는 IntersectionObserver로 지연 */
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
      // 뷰포트 진입 시에만 flay 로드
      this.lazyObserver.observe(tagElement);
    });
  }

  /** IntersectionObserver 콜백: 태그 행이 뷰포트에 진입하면 flay를 로드 */
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

  /** 마우스 드래그로 좌우 스크롤 가능하게 하는 이벤트 바인딩 */
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
      // 5px 이상 움직여야 드래그로 판정
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
