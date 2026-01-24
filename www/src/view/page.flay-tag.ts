import FlayFetch, { Flay } from '@lib/FlayFetch';
import FlayStorage from '@lib/FlayStorage';
import GridControl from '@ui/GridControl';
import FlayMarker from '../flay/domain/FlayMarker';
import './inc/Page';
import './page.flay-tag.scss';

/**
 * Flay 태그 필터링 페이지 관리 클래스
 */
class FlayTagPage {
  private static readonly EXCLUDE_TAG_GROUPS = ['grade', 'screen', 'etc'] as const;
  private static readonly DRAG_HIGHLIGHT_COLOR = 'var(--color-bg-transparent)';
  private static readonly STORAGE_KEY = 'flay-tag-zones';
  private static readonly MIN_ITEMS_TO_SHOW = 2;

  // CSS 클래스명
  private static readonly CLASS_NAMES = {
    STATS_ITEM: 'stats-item',
    ACTIVE: 'active',
    DROPPED_TAG: 'dropped-tag',
    SELECTED_TAG: 'selected-tag',
    DRAGGING_TAG: 'dragging-tag',
  } as const;

  // DOM 셀렉터
  private static readonly SELECTORS = {
    TAG_CONTAINER: 'body > header.sticky > div.tags',
    FLAY_CONTAINER: 'body > main',
    FLAY_COUNT: '#flayCount',
    ZONE_CONTAINER: 'div.zone-container',
    STATS_CONTAINER: '.stats-container',
    RANK_STATS: '.rank-stats',
    ACTRESS_STATS: '.actress-stats',
    FOOTER: 'body > footer',
  } as const;

  private readonly tagContainer: HTMLDivElement;
  private readonly flayContainer: HTMLDivElement;
  private readonly flayCountElement: HTMLSpanElement;
  private readonly zoneContainer: HTMLDivElement;
  private readonly statsContainer: HTMLDivElement;
  private readonly rankStatsContainer: HTMLDivElement;
  private readonly actressStatsContainer: HTMLDivElement;
  private readonly andTypeZones: HTMLDivElement[] = [];
  private readonly orTypeZones: HTMLDivElement[] = [];
  private filteredFlays: Flay[] = [];
  private selectedRank: number = 0;
  private selectedActress: string | null = null;

  constructor() {
    this.tagContainer = document.querySelector(FlayTagPage.SELECTORS.TAG_CONTAINER) as HTMLDivElement;
    this.flayContainer = document.querySelector(FlayTagPage.SELECTORS.FLAY_CONTAINER) as HTMLDivElement;
    this.flayCountElement = document.querySelector(FlayTagPage.SELECTORS.FLAY_COUNT) as HTMLSpanElement;
    this.zoneContainer = document.querySelector(FlayTagPage.SELECTORS.ZONE_CONTAINER) as HTMLDivElement;
    this.statsContainer = document.querySelector(FlayTagPage.SELECTORS.STATS_CONTAINER) as HTMLDivElement;
    this.rankStatsContainer = document.querySelector(FlayTagPage.SELECTORS.RANK_STATS) as HTMLDivElement;
    this.actressStatsContainer = document.querySelector(FlayTagPage.SELECTORS.ACTRESS_STATS) as HTMLDivElement;

    this.initializeGridControl();
    this.setupInitialZones();
    this.setupAddButtons();
    this.loadTagsAndGroups();
  }

  /**
   * Grid Control 초기화
   */
  private initializeGridControl(): void {
    const gridContainer = document.querySelector(FlayTagPage.SELECTORS.FOOTER)!;
    gridContainer.appendChild(new GridControl(FlayTagPage.SELECTORS.FLAY_CONTAINER));
  }

  /**
   * 초기 태그 존 설정
   */
  private setupInitialZones(): void {
    // 저장된 데이터 복원 시도
    const savedZones = FlayStorage.local.getObject<{ type: 'and' | 'or'; tags: number[] }[]>(FlayTagPage.STORAGE_KEY, []);

    if (savedZones.length > 0) {
      // 저장된 데이터가 있으면 복원
      this.restoreZones(savedZones);
    } else {
      // 저장된 데이터가 없으면 기본 존 1개 생성
      const existingZone = document.querySelector('div.zone') as HTMLDivElement;

      if (existingZone) {
        this.andTypeZones.push(existingZone);
        this.setupDropZone(existingZone, 'and');
      } else {
        this.addTagZone('and');
      }
    }
  }

  /**
   * 태그 존 추가 버튼 설정
   */
  private setupAddButtons(): void {
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'add-zone-buttons';

    ['and', 'or'].forEach((type) => {
      const addZoneButton = document.createElement('button');
      addZoneButton.textContent = type.toUpperCase();
      addZoneButton.className = 'add-zone-btn';
      addZoneButton.addEventListener('click', () => this.addTagZone(type as 'and' | 'or'));
      buttonContainer.appendChild(addZoneButton);
    });

    this.zoneContainer.appendChild(buttonContainer);
  }

  /**
   * 새로운 태그 존 추가
   */
  private addTagZone(type: 'and' | 'or'): HTMLDivElement {
    const zone = document.createElement('div');
    zone.className = 'zone head-row';
    zone.dataset.type = type;

    // 제거 버튼 추가
    const removeZoneBtn = document.createElement('button');
    removeZoneBtn.textContent = '✕';
    removeZoneBtn.className = 'remove-zone-btn';
    removeZoneBtn.addEventListener('click', () => this.removeTagZone(zone, type));

    zone.insertBefore(removeZoneBtn, zone.firstChild);

    this.setupDropZone(zone, type);

    if (type === 'and') {
      this.andTypeZones.push(zone);
    } else {
      this.orTypeZones.push(zone);
    }

    // 버튼 컨테이너 바로 앞에 삽입
    const buttonContainer = this.zoneContainer.querySelector('.add-zone-buttons');
    this.zoneContainer.insertBefore(zone, buttonContainer);

    return zone;
  }

  /**
   * 태그 존 제거
   */
  private removeTagZone(zone: HTMLDivElement, type: 'and' | 'or'): void {
    // 존 내의 모든 태그 원본으로 복구
    const labels = zone.querySelectorAll('label[data-id]');
    labels.forEach((label) => {
      const tagId = label.getAttribute('data-id');
      const originalLabel = this.tagContainer.querySelector(`label[data-id="${tagId}"]`) as HTMLLabelElement;
      if (originalLabel) {
        originalLabel.draggable = true;
        originalLabel.classList.remove('selected-tag');
      }
    });

    // 존 제거
    zone.remove();

    // 배열에서 제거
    if (type === 'and') {
      const index = this.andTypeZones.indexOf(zone);
      if (index > -1) this.andTypeZones.splice(index, 1);
    } else {
      const index = this.orTypeZones.indexOf(zone);
      if (index > -1) this.orTypeZones.splice(index, 1);
    }

    this.updateFlayList();
    this.saveZones();
  }

  /**
   * 태그 ID 목록 추출
   */
  private getTagIds(zone: HTMLElement): number[] {
    return Array.from(zone.querySelectorAll('label[data-id]'))
      .map((label) => label.getAttribute('data-id'))
      .filter((id): id is string => id !== null)
      .map((id) => parseInt(id, 10));
  }

  /**
   * Flay 목록을 필터링하여 표시
   */
  private updateFlayList(): void {
    // 모든 존이 비어있으면 초기화
    const hasAnyTags = this.andTypeZones.some((zone) => this.getTagIds(zone).length > 0) || this.orTypeZones.some((zone) => this.getTagIds(zone).length > 0);

    if (!hasAnyTags) {
      this.flayContainer.innerHTML = '';
      this.flayCountElement.innerHTML = '0';
      this.statsContainer.style.display = 'none';
      return;
    }

    // 모든 태그 ID 수집 (캐시된 데이터 활용)
    const allTagIds = new Set<number>();
    this.andTypeZones.forEach((zone) => this.getTagIds(zone).forEach((id) => allTagIds.add(id)));
    this.orTypeZones.forEach((zone) => this.getTagIds(zone).forEach((id) => allTagIds.add(id)));

    Promise.all(Array.from(allTagIds).map((tagId) => FlayFetch.getFlayListByTagId(tagId)))
      .then((results) => {
        console.log('=== Flay 필터링 시작 ===');
        console.log('로드된 태그 ID:', Array.from(allTagIds));

        const flaysMap = new Map<string, Flay>();
        results.forEach((flays) => {
          flays.forEach((flay) => {
            if (!flaysMap.has(flay.opus)) {
              flaysMap.set(flay.opus, flay);
            }
          });
        });

        let filteredFlays = Array.from(flaysMap.values());
        console.log(`초기 Flay 개수: ${filteredFlays.length}개`);

        // 각 AND 존별로 필터링 (존 내부의 모든 태그를 포함해야 함)
        this.andTypeZones.forEach((zone, index) => {
          const zoneTags = this.getTagIds(zone);
          if (zoneTags.length > 0) {
            const beforeCount = filteredFlays.length;
            filteredFlays = filteredFlays.filter((flay) => zoneTags.every((tagId) => flay.video.tags.some((tag) => tag.id === tagId)));
            console.log(`AND 존 ${index + 1} [태그 ID: ${zoneTags.join(', ')}] 필터링: ${beforeCount}개 → ${filteredFlays.length}개 (${beforeCount - filteredFlays.length}개 제거)`);
          }
        });

        // 각 OR 존별로 필터링 (존 내부의 최소 1개 태그를 포함해야 함)
        this.orTypeZones.forEach((zone, index) => {
          const zoneTags = this.getTagIds(zone);
          if (zoneTags.length > 0) {
            const beforeCount = filteredFlays.length;
            filteredFlays = filteredFlays.filter((flay) => zoneTags.some((tagId) => flay.video.tags.some((tag) => tag.id === tagId)));
            console.log(`OR 존 ${index + 1} [태그 ID: ${zoneTags.join(', ')}] 필터링: ${beforeCount}개 → ${filteredFlays.length}개 (${beforeCount - filteredFlays.length}개 제거)`);
          }
        });

        // 정렬
        filteredFlays.sort((a, b) => b.release.localeCompare(a.release));

        console.log(`최종 필터링 결과: ${filteredFlays.length}개`);
        console.log('필터링된 Flay opus:', filteredFlays.map((f) => f.opus).join(', '));
        console.log('=== Flay 필터링 완료 ===\n');

        this.filteredFlays = filteredFlays;
        this.selectedRank = 0;
        this.selectedActress = null;
        this.updateStatsDisplay();
        this.displayFlays();
      })
      .catch((error) => {
        console.error(error);
      });
  }

  /**
   * 제거 버튼 SVG 생성
   */
  private createRemoveButton(onRemove: () => void): SVGElement {
    const removeBtn = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    removeBtn.setAttribute('class', 'remove-btn');
    removeBtn.setAttribute('viewBox', '0 0 16 16');
    removeBtn.setAttribute('width', '16');
    removeBtn.setAttribute('height', '16');
    removeBtn.innerHTML = `
      <line x1="5" y1="5" x2="11" y2="11" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      <line x1="11" y1="5" x2="5" y2="11" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
    `;

    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      onRemove();
    });

    return removeBtn;
  }

  /**
   * 드롭된 태그 레이블 생성
   */
  private createDroppedTagLabel(originalLabel: HTMLLabelElement): HTMLLabelElement {
    const clonedLabel = originalLabel.cloneNode(true) as HTMLLabelElement;
    clonedLabel.draggable = false;
    clonedLabel.className = FlayTagPage.CLASS_NAMES.DROPPED_TAG;

    const removeBtn = this.createRemoveButton(() => {
      clonedLabel.remove();
      originalLabel.draggable = true;
      originalLabel.classList.remove(FlayTagPage.CLASS_NAMES.SELECTED_TAG);
      this.updateFlayList();
      this.saveZones();
    });

    clonedLabel.appendChild(removeBtn);
    return clonedLabel;
  }

  /**
   * 드롭 영역 이벤트 설정
   */
  private setupDropZone(zone: HTMLDivElement, _type: 'and' | 'or'): void {
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.style.backgroundColor = FlayTagPage.DRAG_HIGHLIGHT_COLOR;
    });

    zone.addEventListener('dragleave', () => {
      zone.style.backgroundColor = '';
    });

    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.style.backgroundColor = '';

      const tagId = e.dataTransfer?.getData('text/plain');
      if (!tagId) return;

      // 원본 label 찾기
      const originalLabel = this.tagContainer.querySelector(`label[data-id="${tagId}"]`) as HTMLLabelElement;
      if (!originalLabel) return;

      // 이미 드롭된 태그인지 확인 (모든 존에서)
      const allZones = [...this.andTypeZones, ...this.orTypeZones];
      const existingInZones = allZones.map((z) => ({ zone: z, label: z.querySelector(`label[data-id="${tagId}"]`) })).filter((item) => item.label !== null);

      // 다른 존에 있으면 제거
      existingInZones.forEach((item) => {
        if (item.zone !== zone) {
          item.label!.remove();
        }
      });

      // 같은 존에 이미 있으면 무시
      if (existingInZones.some((item) => item.zone === zone)) {
        return;
      }

      // 태그 복사본 생성
      const clonedLabel = this.createDroppedTagLabel(originalLabel);

      // 원본 태그 비활성화
      originalLabel.draggable = false;
      originalLabel.classList.add(FlayTagPage.CLASS_NAMES.SELECTED_TAG);

      zone.appendChild(clonedLabel);
      this.updateFlayList();
      this.saveZones();
    });
  }

  /**
   * 태그 레이블 생성 및 이벤트 등록
   */
  private createTagLabel(tag: { id: number; name: string; description: string; group: string }): HTMLLabelElement {
    const tagLabel = document.createElement('label');
    tagLabel.dataset.id = tag.id.toString();
    tagLabel.dataset.group = tag.group;
    tagLabel.title = tag.description;
    tagLabel.textContent = tag.name;
    tagLabel.draggable = true;

    // 드래그 시작 이벤트
    tagLabel.addEventListener('dragstart', (e) => {
      e.dataTransfer!.effectAllowed = 'copy';
      e.dataTransfer!.setData('text/plain', tag.id.toString());
      tagLabel.classList.add(FlayTagPage.CLASS_NAMES.DRAGGING_TAG);
    });

    tagLabel.addEventListener('dragend', () => {
      tagLabel.classList.remove(FlayTagPage.CLASS_NAMES.DRAGGING_TAG);
    });

    return tagLabel;
  }

  /**
   * 태그 그룹과 태그 로드
   */
  private loadTagsAndGroups(): void {
    Promise.all([FlayFetch.getTags(), FlayFetch.getTagGroups()])
      .then(([tags, groups]) => {
        groups
          .filter((group) => !FlayTagPage.EXCLUDE_TAG_GROUPS.includes(group.id as (typeof FlayTagPage.EXCLUDE_TAG_GROUPS)[number]))
          .forEach((group) => {
            const tagGroup = document.createElement('div');
            tagGroup.title = group.name;
            tagGroup.className = 'tag-group head-row';
            tagGroup.id = `tag-group-${group.id}`;
            this.tagContainer.appendChild(tagGroup);
          });

        tags
          .filter((tag) => tag.group && !FlayTagPage.EXCLUDE_TAG_GROUPS.includes(tag.group as (typeof FlayTagPage.EXCLUDE_TAG_GROUPS)[number]))
          .sort((t1, t2) => t1.name.localeCompare(t2.name))
          .forEach((tag) => {
            const tagLabel = this.createTagLabel(tag);
            const tagGroup = this.tagContainer.querySelector(`#tag-group-${tag.group}`) as HTMLElement;
            if (tagGroup) {
              tagGroup.appendChild(tagLabel);
            }
          });

        // 태그 로드 후 저장된 존에 태그 복원
        this.restoreTagsToZones();
      })
      .catch(console.error);
  }

  /**
   * 현재 태그 존 상태를 저장
   */
  private saveZones(): void {
    const allZones = [...this.andTypeZones, ...this.orTypeZones];
    const zonesData = allZones.map((zone) => ({
      type: zone.dataset.type as 'and' | 'or',
      tags: this.getTagIds(zone),
    }));
    FlayStorage.local.setObject(FlayTagPage.STORAGE_KEY, zonesData);
  }

  /**
   * 저장된 데이터로 태그 존 복원
   */
  private restoreZones(savedZones: { type: 'and' | 'or'; tags: number[] }[]): void {
    savedZones.forEach((zoneData) => {
      const zone = this.addTagZone(zoneData.type);
      // 태그는 loadTagsAndGroups 이후에 복원
      zone.dataset.savedTags = JSON.stringify(zoneData.tags);
    });
  }

  /**
   * 존에 태그 복원 (태그 로드 후 호출)
   */
  private restoreTagsToZones(): void {
    const allZones = [...this.andTypeZones, ...this.orTypeZones];

    allZones.forEach((zone) => {
      const savedTagsStr = zone.dataset.savedTags;
      if (savedTagsStr) {
        const savedTags: number[] = JSON.parse(savedTagsStr);
        delete zone.dataset.savedTags;

        savedTags.forEach((tagId) => {
          const originalLabel = this.tagContainer.querySelector(`label[data-id="${tagId}"]`) as HTMLLabelElement;
          if (originalLabel) {
            const clonedLabel = this.createDroppedTagLabel(originalLabel);
            originalLabel.draggable = false;
            originalLabel.classList.add('selected-tag');
            zone.appendChild(clonedLabel);
          }
        });
      }
    });

    // 복원 후 필터링 실행
    this.updateFlayList();
  }

  /**
   * 랭크와 배우 통계 표시
   */
  private updateStatsDisplay(): void {
    const rankMap = this.buildRankMap();
    const actressMap = this.buildActressMap();

    const sortedRanks = Array.from(rankMap.entries()).sort((a, b) => a[0] - b[0]);
    const sortedActresses = Array.from(actressMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));

    this.renderRankStats(sortedRanks);
    this.renderActressStats(sortedActresses);
    this.updateStatsContainerVisibility(sortedRanks.length, sortedActresses.length);
  }

  /**
   * 랭크 맵 생성
   */
  private buildRankMap(): Map<number, number> {
    const rankMap = new Map<number, number>();
    this.filteredFlays.forEach((flay) => {
      const rank = flay.video.rank || 0;
      rankMap.set(rank, (rankMap.get(rank) ?? 0) + 1);
    });
    return rankMap;
  }

  /**
   * 배우 맵 생성
   */
  private buildActressMap(): Map<string, number> {
    const actressMap = new Map<string, number>();
    this.filteredFlays.forEach((flay) => {
      flay.actressList.forEach((actress) => {
        actressMap.set(actress, (actressMap.get(actress) ?? 0) + 1);
      });
    });
    return actressMap;
  }

  /**
   * 랭크 통계 렌더링
   */
  private renderRankStats(sortedRanks: [number, number][]): void {
    const shouldHide = sortedRanks.length < FlayTagPage.MIN_ITEMS_TO_SHOW;
    this.rankStatsContainer.innerHTML = '';
    this.rankStatsContainer.classList.toggle('hide', shouldHide);
    if (shouldHide) {
      return;
    }
    sortedRanks.forEach(([rank, count]) => {
      const button = this.createStatsButton(`Rank ${rank}`, count, String(rank), this.selectedRank === rank, () => this.handleRankClick(rank));
      this.rankStatsContainer.appendChild(button);
    });
  }

  /**
   * 배우 통계 렌더링
   */
  private renderActressStats(sortedActresses: [string, number][]): void {
    const shouldHide = sortedActresses.length < FlayTagPage.MIN_ITEMS_TO_SHOW;
    this.actressStatsContainer.innerHTML = '';
    this.actressStatsContainer.classList.toggle('hide', shouldHide);
    if (shouldHide) {
      return;
    }
    sortedActresses.forEach(([actress, count]) => {
      const button = this.createStatsButton(actress, count, actress, this.selectedActress === actress, () => this.handleActressClick(actress));
      this.actressStatsContainer.appendChild(button);
    });
  }

  /**
   * 통계 버튼 생성 (공통 로직)
   */
  private createStatsButton(label: string, count: number, value: string, isActive: boolean, onClick: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = FlayTagPage.CLASS_NAMES.STATS_ITEM;
    button.dataset.value = value;
    button.innerHTML = `${label} <span class="count">${count}</span>`;

    if (isActive) {
      button.classList.add(FlayTagPage.CLASS_NAMES.ACTIVE);
    }

    button.addEventListener('click', onClick);
    return button;
  }

  /**
   * 랭크 클릭 핸들러
   */
  private handleRankClick(rank: number): void {
    if (this.selectedRank === rank) {
      this.selectedRank = 0;
    } else {
      this.selectedRank = rank;
    }
    this.renderRankStats(Array.from(this.buildRankMap().entries()).sort((a, b) => a[0] - b[0]));
    this.displayFlays();
  }

  /**
   * 배우 클릭 핸들러
   */
  private handleActressClick(actress: string): void {
    if (this.selectedActress === actress) {
      this.selectedActress = null;
    } else {
      this.selectedActress = actress;
    }
    this.renderActressStats(Array.from(this.buildActressMap().entries()).sort((a, b) => a[0].localeCompare(b[0])));
    this.displayFlays();
  }

  /**
   * 통계 컨테이너 표시/숨김 업데이트
   */
  private updateStatsContainerVisibility(rankCount: number, actressCount: number): void {
    const shouldHide = rankCount < FlayTagPage.MIN_ITEMS_TO_SHOW && actressCount < FlayTagPage.MIN_ITEMS_TO_SHOW;
    this.statsContainer.classList.toggle('hide', shouldHide);
  }

  /**
   * 선택된 랭크/배우에 따라 Flay 표시
   */
  private displayFlays(): void {
    let displayFlays = this.filteredFlays;

    // 랭크 필터링
    if (this.selectedRank) {
      displayFlays = displayFlays.filter((flay) => (flay.video.rank || 0) === this.selectedRank);
    }

    // 배우 필터링
    if (this.selectedActress) {
      displayFlays = displayFlays.filter((flay) => flay.actressList.some((actress) => actress === this.selectedActress));
    }

    this.flayCountElement.innerHTML = displayFlays.length.toString();
    this.flayContainer.innerHTML = '';
    this.flayContainer.append(...displayFlays.map((flay) => new FlayMarker(flay, { cover: true })));
  }
}

// 페이지 초기화
new FlayTagPage();
