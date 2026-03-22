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
  private flayActress: HTMLDivElement;

  constructor() {
    super();
    this.className = 'welcome-page';
    this.innerHTML = `
      <div class="video-container">
        <video autoplay muted loop class="background-video" style="width: 100%; height: 100%; object-fit: cover;"></video>
        <div class="info">
          <div class="flay-title"></div>
          <div class="flay-actress"></div>
        </div>
      </div>
      <div class="tag-container">
      </div>
    `;

    this.video = this.querySelector('video') as HTMLVideoElement;
    this.flayTitle = this.querySelector('.flay-title') as HTMLDivElement;
    this.flayActress = this.querySelector('.flay-actress') as HTMLDivElement;
  }

  async connectedCallback() {
    void this.fetchData();
  }

  private async fetchData() {
    Promise.all([FlayFetch.getOpusList({}), FlayFetch.getTagGroups(), FlayFetch.getTagListWithCount(), FlayFetch.getHistoryListByAction('PLAY', 30)])
      .then(async ([opusList, tagGroups, tags, histories]) => {
        this.opusList = opusList;
        this.tagGroups = tagGroups;
        this.tags = tags.filter((tag) => (tag.count || 0) > 0);
        this.recentTags = new Map<number, number>();

        const playedOpusList = histories.map((history) => history.opus).filter((opus) => this.opusList.includes(opus));
        const playedFlays = await FlayFetch.getFlayList(...playedOpusList);
        // playedFlays에서 태그 추출. 노출 누적 갯수 정보 포함하여 recentTags에 저장
        playedFlays.forEach((flay) => {
          flay.video.tags.forEach((tag) => {
            this.recentTags.set(tag.id, (this.recentTags.get(tag.id) || 0) + 1);
          });
        });

        console.log('Opus List:', this.opusList);
        console.log('Tag Groups:', this.tagGroups);
        console.log('Tags:', this.tags);
        console.log('Recent Tags:', this.recentTags);

        this.opus = await this.suggestOpusByAI();
        // this.opus가 null이면 3번 이내에 다시 시도
        let attempts = 0;
        while (!this.opus && attempts < 3) {
          console.warn('AI가 유효한 opus를 추천하지 않았습니다. 다시 시도합니다...');
          this.opus = await this.suggestOpusByAI();
          attempts++;
        }
        this.render();
      })
      .catch((error) => {
        console.error('데이터 로드 오류:', error);
        this.innerHTML = `<h1>Welcome to Flay</h1><p>데이터 로드 실패</p>`;
      });
  }

  private async suggestOpusByAI() {
    const prompt = `다음 목록에서 하나를 선택하세요. opus 코드만 답하세요. ${this.opusList.join(',')}`;
    try {
      const response = await generate(prompt, { maxTokens: 20, temperature: 0.7 });
      const selectedOpus = response.text.trim();
      console.log(`AI 추천 opus: ${selectedOpus}`);
      if (!this.opusList.includes(selectedOpus)) {
        console.warn('AI가 선택한 opus가 목록에 없습니다:', selectedOpus);
        return null;
      }
      return selectedOpus;
    } catch (error) {
      console.error('AI opus 추천 오류:', error);
      return null;
    }
  }

  private getTagsByGroup(groupId: string) {
    return this.tags.filter((tag) => tag.group === groupId);
  }

  private async getFlaysByTag(tagId: number) {
    return await FlayFetch.getFlayListByTagId(tagId);
  }

  /**
   * 태그 그룹과 태그를 렌더링하는 로직
   * - 각 태그 그룹마다 제목과 설명을 표시
   * - 각 태그마다 이름과 개수를 표시
   */
  private render() {
    if (this.opus) {
      this.video.src = ApiClient.buildUrl(`/stream/flay/movie/${this.opus}/0`);
      FlayFetch.getFlay(this.opus).then((flay) => {
        if (!flay) {
          console.warn('Flay 정보를 가져올 수 없습니다:', this.opus);
          return;
        }
        this.flayTitle.textContent = flay.title;
        this.flayActress.textContent = flay.actressList.join(', ');
      });
    }

    const fragment = document.createDocumentFragment();

    // 태그 그룹과 태그를 렌더링하는 로직을 여기에 추가
    const tagContainer = this.querySelector('.tag-container') as HTMLElement;
    tagContainer.innerHTML = '';

    this.tagGroups.forEach((group) => {
      const groupElement = document.createElement('div');
      groupElement.id = `tag-group-${group.id}`;
      groupElement.className = 'tag-group';
      groupElement.innerHTML = `<h2>${group.name}: ${group.desc}</h2><div class="tags"></div>`;

      const tags = this.getTagsByGroup(group.id);
      const tagsContainer = groupElement.querySelector('.tags') as HTMLElement;
      tags.forEach((tag) => {
        const tagElement = document.createElement('div');
        tagElement.id = `tag-${tag.id}`;
        tagElement.className = 'tag';
        tagElement.innerHTML = `<span>${tag.name} (${tag.count})</span><div class="flays"></div>`;

        const flays = this.getFlaysByTag(tag.id);
        const flaysContainer = tagElement.querySelector('.flays') as HTMLElement;
        flays.then((flayList) => {
          flayList.forEach((flay) => {
            const cover = document.createElement('img');
            cover.className = 'flay-cover';
            cover.src = ApiClient.buildUrl(`/static/cover/${flay.opus}`);
            cover.alt = flay.title;
            cover.loading = 'lazy';
            cover.addEventListener('click', () => {
              this.opus = flay.opus;
              this.video.src = ApiClient.buildUrl(`/stream/flay/movie/${flay.opus}/0`);
              this.flayTitle.textContent = flay.title;
              this.flayActress.textContent = flay.actressList.join(', ');
            });

            flaysContainer.appendChild(cover);
          });

          // 마우스 드래그 수평 스크롤 바인딩
          this.enableDragScroll(flaysContainer);
        });

        tagsContainer.appendChild(tagElement);
      });

      fragment.appendChild(groupElement);
    });

    tagContainer.appendChild(fragment);
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
