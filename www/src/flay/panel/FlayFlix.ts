import { generate } from '../../ai/index-proxy';
import ApiClient from '../../lib/ApiClient';
import FlayFetch, { Tag, TagGroup } from '../../lib/FlayFetch';
import './FlayFlix.scss';

/**
 * 넷플릭스 스타일의 플레이어 패널
 * - 영상 재생
 * - 태그 그룹 및 태그 표시
 * - 태그 클릭 시 해당 태그에 속한 플레이 목록 표시
 * - AI 추천 기능: opus 목록에서 하나를 추천하여 자동 재생 (실패 시 재시도)
 * - 영상 커버 클릭 시 해당 opus 재생
 * - tags > flays > .cover 구조로 렌더링
 */
export class FlayFlix extends HTMLElement {
  private opusList: string[] = [];
  private tagGroups: TagGroup[] = [];
  private tags: Tag[] = [];
  private opus: string | null = null;
  /** 최근 재생된 태그와 그 횟수를 저장하는 맵 */
  private recentTags: Map<number, number> = new Map();

  private video: HTMLVideoElement;
  private flayTitle: HTMLDivElement;
  private flayOpus: HTMLSpanElement;
  private flayActress: HTMLDivElement;
  private flayRelease: HTMLSpanElement;
  private flayTags: HTMLSpanElement;

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
      <div class="tag-container">
      </div>
    `;

    this.video = this.querySelector('video') as HTMLVideoElement;
    this.flayTitle = this.querySelector('.flay-title') as HTMLDivElement;
    this.flayOpus = this.querySelector('.flay-opus') as HTMLSpanElement;
    this.flayActress = this.querySelector('.flay-actress') as HTMLDivElement;
    this.flayRelease = this.querySelector('.flay-release') as HTMLSpanElement;
    this.flayTags = this.querySelector('.flay-tags') as HTMLSpanElement;
  }

  async connectedCallback() {
    // 1단계: 랜덤 opus로 즉시 비디오 재생
    FlayFetch.getOpusList({}).then((opusList) => {
      this.opusList = opusList;
      this.opus = opusList[Math.floor(Math.random() * opusList.length)] || null;
      if (this.opus) this.playOpus();
    });

    // 2단계: 데이터 로드 후 태그 순차 렌더링 + AI 추천
    void this.fetchData();
  }

  private async fetchData() {
    try {
      const [opusList, tagGroups, tags, histories] = await Promise.all([FlayFetch.getOpusList({}), FlayFetch.getTagGroups(), FlayFetch.getTagListWithCount(), FlayFetch.getHistoryListByAction('PLAY', 30)]);
      this.opusList = opusList;
      this.tagGroups = tagGroups;
      this.tags = tags.filter((tag) => (tag.count || 0) > 0);
      this.recentTags = new Map<number, number>();

      const playedOpusList = histories.map((history) => history.opus).filter((opus) => this.opusList.includes(opus));
      const playedFlays = await FlayFetch.getFlayList(...playedOpusList);
      playedFlays.forEach((flay) => {
        flay.video.tags.forEach((tag) => {
          this.recentTags.set(tag.id, (this.recentTags.get(tag.id) || 0) + 1);
        });
      });

      // 태그 순차 렌더링 시작 (AI 추천과 병렬)
      this.renderTags();

      // AI 추천 행을 비동기로 태그 맨 위에 삽입
      this.renderAIRecommendations();
    } catch (error) {
      console.error('데이터 로드 오류:', error);
      this.innerHTML = `<h1>Welcome to Flay</h1><p>데이터 로드 실패</p>`;
    }
  }

  /**
   * AI에게 화면 한 줄에 찰 만큼의 opus를 추천받아 태그 컨테이너 맨 위에 삽입
   */
  private async renderAIRecommendations() {
    // 커버 너비(11rem) + gap(0.375rem) + padding(2.5rem*2) 기준으로 한 줄 갯수 계산
    const remPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const coverWidth = 11 * remPx + 0.375 * remPx;
    const availableWidth = this.clientWidth - 5 * remPx; // padding 양쪽 2.5rem
    const count = Math.max(3, Math.floor(availableWidth / coverWidth));

    const prompt = `다음 목록에서 ${count}개를 추천하세요. opus 코드만 쉼표로 구분하여 답하세요.\n${this.opusList.join(',')}`;
    try {
      const response = await generate(prompt, { maxTokens: 200, temperature: 0.7 });
      const recommended = response.text
        .trim()
        .split(/[,\s]+/)
        .filter((opus) => this.opusList.includes(opus))
        .slice(0, count);
      if (recommended.length === 0) return;

      const flays = await FlayFetch.getFlayList(...recommended);
      const tagContainer = this.querySelector('.tag-container') as HTMLElement;

      const aiRow = document.createElement('div');
      aiRow.className = 'tag tag-ai fade-in';
      aiRow.innerHTML = `
        <span>AI 추천
          <small class="tag-count">(${flays.length})</small>
        </span>
        <div class="flays"></div>`;

      const flaysContainer = aiRow.querySelector('.flays') as HTMLElement;
      flays.forEach((flay) => {
        const cover = document.createElement('img');
        cover.className = 'flay-cover';
        cover.src = ApiClient.buildUrl(`/static/cover/${flay.opus}`);
        cover.alt = flay.title;
        cover.loading = 'lazy';
        cover.addEventListener('click', () => {
          this.opus = flay.opus;
          this.playOpus();
        });
        flaysContainer.appendChild(cover);
      });
      this.enableDragScroll(flaysContainer);

      // 태그 컨테이너 맨 앞에 삽입
      tagContainer.prepend(aiRow);
    } catch (error) {
      console.error('AI 추천 오류:', error);
    }
  }

  private async getFlaysByTag(tagId: number) {
    return await FlayFetch.getFlayListByTagId(tagId);
  }

  private playOpus() {
    this.video.src = ApiClient.buildUrl(`/stream/flay/movie/${this.opus}/0`);
    FlayFetch.getFlay(this.opus!).then((flay) => {
      if (!flay) {
        console.warn('Flay 정보를 가져올 수 없습니다:', this.opus);
        return;
      }
      this.flayTitle.textContent = flay.title;
      this.flayActress.textContent = flay.actressList.join(', ');
      this.flayOpus.textContent = flay.opus;
      this.flayRelease.textContent = flay.release;
      this.flayTags.textContent = flay.video.tags.map((tag) => tag.name).join(', ');
    });
  }

  /**
   * 태그를 순차적으로 fade-in하며 렌더링
   */
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
      tagElement.innerHTML = `
        <span>${tag.name}
          <small class="tag-group-label">${groupName}</small>
          <small class="tag-count">(${tag.count})</small>
        </span>
        <div class="flays"></div>`;

      const flaysContainer = tagElement.querySelector('.flays') as HTMLElement;
      this.getFlaysByTag(tag.id).then((flayList) => {
        // 현재 태그 제외 점수 + 가중 랜덤 셔플: 현재 행의 태그를 제외한 recentTags 합산을 가중치로 사용
        const weighted = flayList.map((flay) => {
          const score = flay.video.tags.reduce((sum, t) => sum + (t.id !== tag.id ? this.recentTags.get(t.id) || 0 : 0), 0);
          return { flay, weight: score + 1 }; // +1로 점수 0인 flay도 노출 기회 부여
        });
        // 가중 랜덤 셔플: weight가 높을수록 앞에 올 확률이 높음
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

        weighted.forEach(({ flay }) => {
          const cover = document.createElement('img');
          cover.className = 'flay-cover';
          cover.src = ApiClient.buildUrl(`/static/cover/${flay.opus}`);
          cover.alt = flay.title;
          cover.loading = 'lazy';
          cover.addEventListener('click', () => {
            this.opus = flay.opus;
            this.playOpus();
          });

          flaysContainer.appendChild(cover);
        });

        // 마우스 드래그 수평 스크롤 바인딩
        this.enableDragScroll(flaysContainer);
      });

      tagContainer.appendChild(tagElement);
    });
  }

  /**
   * 마우스 드래그로 좌우 스크롤 가능하게 하는 이벤트 바인딩
   * @param container 드래그 스크롤을 적용할 요소
   */
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
