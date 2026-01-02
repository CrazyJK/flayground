import FlayMarker from '@flay/domain/FlayMarker';
import FlayFetch, { Flay } from '@lib/FlayFetch';
import GridControl from '@ui/GridControl';
import './inc/Page';
import './page.flay-tag.scss';

/**
 * Flay 태그 필터링 페이지 관리 클래스
 */
class FlayTagPage {
  private static readonly EXCLUDE_TAG_GROUPS = ['grade', 'screen', 'etc'] as const;
  private static readonly DRAG_HIGHLIGHT_COLOR = 'var(--color-bg-transparent)';

  private readonly tagContainer: HTMLDivElement;
  private readonly markerContainer: HTMLDivElement;
  private readonly flayCountElement: HTMLSpanElement;
  private readonly andTagZone: HTMLDivElement;
  private readonly orTagZone: HTMLDivElement;

  constructor() {
    this.tagContainer = document.querySelector('body > header.sticky > div') as HTMLDivElement;
    this.markerContainer = document.querySelector('body > main') as HTMLDivElement;
    this.flayCountElement = document.querySelector('#flayCount') as HTMLSpanElement;

    this.andTagZone = document.querySelector('div.andTag') as HTMLDivElement;
    this.andTagZone.dataset.type = 'and';

    this.orTagZone = document.querySelector('div.orTag') as HTMLDivElement;
    this.orTagZone.dataset.type = 'or';

    this.initializeGridControl();
    this.setupDropZones();
    this.loadTagsAndGroups();
  }

  /**
   * Grid Control 초기화
   */
  private initializeGridControl(): void {
    const gridContainer = document.querySelector('body > footer')!;
    gridContainer.appendChild(new GridControl('body > main'));
  }

  /**
   * 태그 ID 목록 추출
   */
  private getTagIds(zone: HTMLElement): number[] {
    return Array.from(zone.querySelectorAll('label'))
      .map((label) => label.dataset.id)
      .filter((id): id is string => id !== undefined)
      .map((id) => parseInt(id, 10));
  }

  /**
   * Flay 목록을 필터링하여 표시
   */
  private updateFlayList(): void {
    const andTags = this.getTagIds(this.andTagZone);
    const orTags = this.getTagIds(this.orTagZone);

    if (andTags.length === 0 && orTags.length === 0) {
      this.markerContainer.innerHTML = '';
      this.flayCountElement.innerHTML = '0';
      return;
    }

    const allTagIds = [...andTags, ...orTags];
    Promise.all(allTagIds.map((tagId) => FlayFetch.getFlayListByTagId(tagId)))
      .then((results) => {
        const flaysMap = new Map<string, Flay>();
        results.forEach((flays) => {
          flays.forEach((flay) => {
            if (!flaysMap.has(flay.opus)) {
              flaysMap.set(flay.opus, flay);
            }
          });
        });

        let filteredFlays = Array.from(flaysMap.values());

        // AND 조건: 모든 andTags를 포함하는 flay만 필터링
        if (andTags.length > 0) {
          filteredFlays = filteredFlays.filter((flay) => andTags.every((tagId) => flay.video.tags.some((tag) => tag.id === tagId)));
        }

        // OR 조건: orTags 중 하나 이상을 포함하는 flay만 필터링
        if (orTags.length > 0) {
          filteredFlays = filteredFlays.filter((flay) => orTags.some((tagId) => flay.video.tags.some((tag) => tag.id === tagId)));
        }

        this.flayCountElement.innerHTML = filteredFlays.length.toString();

        this.markerContainer.innerHTML = '';
        this.markerContainer.append(...filteredFlays.map((flay) => new FlayMarker(flay, { cover: true })));
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
      <line x1="5" y1="5" x2="11" y2="11" stroke="white" stroke-width="2" stroke-linecap="round" />
      <line x1="11" y1="5" x2="5" y2="11" stroke="white" stroke-width="2" stroke-linecap="round" />
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
    clonedLabel.className = 'dropped-tag';

    const removeBtn = this.createRemoveButton(() => {
      clonedLabel.remove();
      originalLabel.draggable = true;
      originalLabel.classList.remove('selected-tag');
      this.updateFlayList();
    });

    clonedLabel.appendChild(removeBtn);
    return clonedLabel;
  }

  /**
   * 드롭 영역 이벤트 설정
   */
  private setupDropZones(): void {
    [this.andTagZone, this.orTagZone].forEach((zone) => {
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

        // 이미 드롭된 태그인지 확인 (다른 영역에 있을 수 있음)
        const existingInAnd = this.andTagZone.querySelector(`label[data-id="${tagId}"]`);
        const existingInOr = this.orTagZone.querySelector(`label[data-id="${tagId}"]`);

        // 다른 영역에 있으면 제거
        if (existingInAnd && zone !== this.andTagZone) existingInAnd.remove();
        if (existingInOr && zone !== this.orTagZone) existingInOr.remove();

        // 같은 영역에 이미 있으면 무시
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        if ((zone === this.andTagZone && existingInAnd) || (zone === this.orTagZone && existingInOr)) {
          return;
        }

        // 태그 복사본 생성
        const clonedLabel = this.createDroppedTagLabel(originalLabel);

        // 원본 태그 비활성화
        originalLabel.draggable = false;
        originalLabel.classList.add('selected-tag');

        zone.appendChild(clonedLabel);
        this.updateFlayList();
      });
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
      tagLabel.classList.add('dragging-tag');
    });

    tagLabel.addEventListener('dragend', () => {
      tagLabel.classList.remove('dragging-tag');
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
            tagGroup.className = 'tag-group';
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
      })
      .catch(console.error);
  }
}

// 페이지 초기화
new FlayTagPage();
