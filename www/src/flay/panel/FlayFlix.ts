import PlayTimeDB from '@flay/idb/PlayTimeDB';
import { generate } from '../../ai/index-proxy';
import ApiClient from '../../lib/ApiClient';
import FlayFetch, { Flay, Tag, TagGroup } from '../../lib/FlayFetch';
import { popupFlay } from '../../lib/FlaySearch';
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
  private playTimeDB = new PlayTimeDB();
  private playTimeTimer: ReturnType<typeof setInterval> | null = null;

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
      if (this.opus) popupFlay(this.opus);
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
        const playedFlays = await FlayFetch.getFlayList(...playedOpusList);
        playedFlays.forEach((flay) => {
          flay.video.tags.forEach((tag) => {
            this.recentTags.set(tag.id, (this.recentTags.get(tag.id) || 0) + 1);
          });
        });
      }

      // 스켈레톤 제거 후 태그 순차 렌더링
      this.renderTags();

      // AI 추천 행을 비동기로 태그 맨 위에 삽입
      void this.renderAIRecommendations();
    } catch (error) {
      console.error('데이터 로드 오류:', error);
      this.innerHTML = `<h1>Welcome to Flay</h1><p>데이터 로드 실패</p>`;
    }
  }

  /**
   * AI에게 한 줄보다 약간 많은 opus를 추천받아 태그 컨테이너 맨 위에 삽입
   */
  private async renderAIRecommendations() {
    const remPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const coverWidth = 11 * remPx + 0.375 * remPx;
    const availableWidth = this.clientWidth - 5 * remPx;
    const lineCount = Math.max(3, Math.floor(availableWidth / coverWidth));
    // 한 줄보다 50% 더 요청 (AI가 유효하지 않은 opus를 줄 수 있으므로 여유분)
    const requestCount = Math.ceil(lineCount * 1.5);

    const prompt = `다음 목록에서 ${requestCount}개를 추천하세요. opus 코드만 쉼표로 구분하여 답하세요.\n${this.opusList.join(',')}`;
    try {
      const response = await generate(prompt, { maxTokens: 300, temperature: 0.7 });
      const recommended = response.text
        .trim()
        .split(/[,\s]+/)
        .filter((opus) => this.opusList.includes(opus));
      // 중복 제거 후 lineCount + 여유분으로 제한
      const unique = [...new Set(recommended)].slice(0, lineCount + 2);
      if (unique.length === 0) return;

      const flays = await FlayFetch.getFlayList(...unique);
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
    row.innerHTML = `<span>${label} ${groupHtml} ${countHtml}</span><div class="flays"></div>`;

    const flaysContainer = row.querySelector('.flays') as HTMLElement;
    flays.forEach((flay) => flaysContainer.appendChild(this.createCoverElement(flay)));
    this.enableDragScroll(flaysContainer);

    if (prepend) {
      tagContainer.prepend(row);
    } else {
      tagContainer.appendChild(row);
    }
  }

  /** flay-cover 이미지 요소 생성 (공통) */
  private createCoverElement(flay: Flay): HTMLImageElement {
    const cover = document.createElement('img');
    cover.className = 'flay-cover';
    cover.src = ApiClient.buildUrl(`/static/cover/${flay.opus}`);
    cover.alt = flay.title;
    cover.loading = 'lazy';
    cover.decoding = 'async';
    cover.addEventListener('click', () => {
      this.opus = flay.opus;
      this.playOpus();
    });
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

    FlayFetch.getFlay(opus).then((flay) => {
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
        <div class="flays">
          ${'<div class="flay-cover skeleton-cover"></div>'.repeat(SKELETON_COVER_COUNT)}
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
    let startX = 0;
    let scrollLeft = 0;

    container.addEventListener('mousedown', (e) => {
      isDown = true;
      container.classList.add('dragging');
      startX = e.pageX - container.offsetLeft;
      scrollLeft = container.scrollLeft;
    });

    container.addEventListener('mouseleave', () => {
      isDown = false;
      container.classList.remove('dragging');
    });

    container.addEventListener('mouseup', () => {
      isDown = false;
      container.classList.remove('dragging');
    });

    container.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      const walk = (x - startX) * 1.5;
      container.scrollLeft = scrollLeft - walk;
    });
  }
}

customElements.define('flay-flix', FlayFlix);
