import FlayMarker from '@flay/domain/FlayMarker';
import FlayFetch, { Flay } from '@lib/FlayFetch';
import GridControl from '@ui/GridControl';
import './inc/Page';
import './page.flay-tag.scss';

// 상수 정의
const EXCLUDE_TAG_GROUPS = ['grade', 'screen', 'etc'] as const;
const DRAG_HIGHLIGHT_COLOR = 'var(--color-primary-transparent)';

// DOM 요소 캐싱
const tagContainer = document.querySelector('body > header.sticky > div')!;
const markerContainer = document.querySelector('body > main')!;
const gridContainer = document.querySelector('body > footer')!;
const flayCountElement = document.querySelector('#flayCount')!;

const andTagZone = document.querySelector('div.andTag') as HTMLDivElement;
andTagZone.dataset.type = 'and';

const orTagZone = document.querySelector('div.orTag') as HTMLDivElement;
orTagZone.dataset.type = 'or';

gridContainer.appendChild(new GridControl('body > main'));

/**
 * 태그 ID 목록 추출
 */
function getTagIds(zone: HTMLElement): number[] {
  return Array.from(zone.querySelectorAll('label'))
    .map((label) => label.dataset.id)
    .filter((id): id is string => id !== undefined)
    .map((id) => parseInt(id, 10));
}

/**
 * Flay 목록을 필터링하여 표시
 */
function updateFlayList() {
  const andTags = getTagIds(andTagZone);
  const orTags = getTagIds(orTagZone);

  if (andTags.length === 0 && orTags.length === 0) {
    markerContainer.innerHTML = '';
    flayCountElement.innerHTML = '0';
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

      flayCountElement.innerHTML = filteredFlays.length.toString();

      markerContainer.innerHTML = '';
      markerContainer.append(...filteredFlays.map((flay) => new FlayMarker(flay, { cover: true })));
    })
    .catch((error) => {
      console.error(error);
    });
}

/**
 * 제거 버튼 SVG 생성
 */
function createRemoveButton(onRemove: () => void): SVGElement {
  const removeBtn = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  removeBtn.setAttribute('class', 'remove-btn');
  removeBtn.setAttribute('viewBox', '0 0 16 16');
  removeBtn.setAttribute('width', '16');
  removeBtn.setAttribute('height', '16');

  const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line1.setAttribute('x1', '5');
  line1.setAttribute('y1', '5');
  line1.setAttribute('x2', '11');
  line1.setAttribute('y2', '11');
  line1.setAttribute('stroke', 'white');
  line1.setAttribute('stroke-width', '2');
  line1.setAttribute('stroke-linecap', 'round');

  const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line2.setAttribute('x1', '11');
  line2.setAttribute('y1', '5');
  line2.setAttribute('x2', '5');
  line2.setAttribute('y2', '11');
  line2.setAttribute('stroke', 'white');
  line2.setAttribute('stroke-width', '2');
  line2.setAttribute('stroke-linecap', 'round');

  removeBtn.appendChild(line1);
  removeBtn.appendChild(line2);

  removeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    onRemove();
  });

  return removeBtn;
}

/**
 * 드롭된 태그 레이블 생성
 */
function createDroppedTagLabel(originalLabel: HTMLLabelElement): HTMLLabelElement {
  const clonedLabel = originalLabel.cloneNode(true) as HTMLLabelElement;
  clonedLabel.draggable = false;
  clonedLabel.style.position = 'relative';
  clonedLabel.style.paddingRight = '24px';
  clonedLabel.style.cursor = 'default';

  const removeBtn = createRemoveButton(() => {
    clonedLabel.remove();
    originalLabel.style.display = '';
    updateFlayList();
  });

  clonedLabel.appendChild(removeBtn);
  return clonedLabel;
}

// 드롭 영역에 이벤트 리스너 추가
[andTagZone, orTagZone].forEach((zone) => {
  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.style.backgroundColor = DRAG_HIGHLIGHT_COLOR;
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
    const originalLabel = tagContainer.querySelector(`label[data-id="${tagId}"]`) as HTMLLabelElement;
    if (!originalLabel) return;

    // 이미 드롭된 태그인지 확인 (다른 영역에 있을 수 있음)
    const existingInAnd = andTagZone.querySelector(`label[data-id="${tagId}"]`);
    const existingInOr = orTagZone.querySelector(`label[data-id="${tagId}"]`);

    // 다른 영역에 있으면 제거
    if (existingInAnd && zone !== andTagZone) existingInAnd.remove();
    if (existingInOr && zone !== orTagZone) existingInOr.remove();

    // 같은 영역에 이미 있으면 무시
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    if ((zone === andTagZone && existingInAnd) || (zone === orTagZone && existingInOr)) {
      return;
    }

    // 태그 복사본 생성
    const clonedLabel = createDroppedTagLabel(originalLabel);

    // 원본 태그 숨기기
    originalLabel.style.display = 'none';

    zone.appendChild(clonedLabel);
    updateFlayList();
  });
});

/**
 * 태그 레이블 생성 및 이벤트 등록
 */
function createTagLabel(tag: { id: number; name: string; description: string; group: string }): HTMLLabelElement {
  const tagLabel = document.createElement('label');
  tagLabel.dataset.id = tag.id.toString();
  tagLabel.dataset.group = tag.group;
  tagLabel.title = tag.description;
  tagLabel.textContent = tag.name;
  tagLabel.draggable = true;
  tagLabel.style.cursor = 'grab';

  // 드래그 시작 이벤트
  tagLabel.addEventListener('dragstart', (e) => {
    e.dataTransfer!.effectAllowed = 'copy';
    e.dataTransfer!.setData('text/plain', tag.id.toString());
    tagLabel.style.cursor = 'grabbing';
  });

  tagLabel.addEventListener('dragend', () => {
    tagLabel.style.cursor = 'grab';
  });

  return tagLabel;
}

Promise.all([FlayFetch.getTags(), FlayFetch.getTagGroups()])
  .then(([tags, groups]) => {
    groups
      .filter((group) => !EXCLUDE_TAG_GROUPS.includes(group.id as (typeof EXCLUDE_TAG_GROUPS)[number]))
      .forEach((group) => {
        const tagGroup = document.createElement('div');
        tagGroup.title = group.name;
        tagGroup.className = 'tag-group';
        tagGroup.id = `tag-group-${group.id}`;
        tagContainer.appendChild(tagGroup);
      });

    tags
      .filter((tag) => tag.group && !EXCLUDE_TAG_GROUPS.includes(tag.group as (typeof EXCLUDE_TAG_GROUPS)[number]))
      .sort((t1, t2) => t1.name.localeCompare(t2.name))
      .forEach((tag) => {
        const tagLabel = createTagLabel(tag);
        const tagGroup = tagContainer.querySelector(`#tag-group-${tag.group}`) as HTMLElement;
        if (tagGroup) {
          tagGroup.appendChild(tagLabel);
        }
      });
  })
  .catch(console.error);
