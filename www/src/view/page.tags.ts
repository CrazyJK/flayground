import * as DragDrop from '@lib/Drag&Drop';
import FlayAction from '@lib/FlayAction';
import FlayFetch, { Tag } from '@lib/FlayFetch';
import { popupTag } from '@lib/FlaySearch';
import { addResizeListener } from '@lib/windowAddEventListener';
import tagSVG from '@svg/tag';
import './inc/Page';
import './page.tags.scss';

class FlayTagInfo extends HTMLElement {
  tag!: Tag;

  constructor(tag: Tag) {
    super();
    this.tag = tag;

    this.draggable = true;
    this.dataset.id = String(this.tag.id);
    this.dataset.flayCount = String(this.tag['count']);
    this.classList.add('flay-tag-info');
    this.innerHTML = `
      <dt>
        <label class="icon" title="${this.tag.id}">${tagSVG}</label>
        <label class="name">${this.tag.name}</label>
        <label class="count ${this.tag['count'] === 0 ? 'zero' : ''}">${this.tag['count']}</label>
      </dt>
      <dd>
        <label class="desc">${this.tag.description}</label>
      </dd>
    `;

    this.addEventListener('click', () => ([TAG_ID.value, TAG_GROUP.value, TAG_NAME.value, TAG_DESC.value] = [String(this.tag.id), this.tag.group, this.tag.name, this.tag.description]));
    this.querySelector('.name')!.addEventListener('click', () => popupTag(this.tag.id));
  }
}

customElements.define('flay-tag-info', FlayTagInfo);

// header
const TAG_ID = document.querySelector('#tagId') as HTMLInputElement;
const TAG_GROUP = document.querySelector('#tagGroup') as HTMLInputElement;
const TAG_NAME = document.querySelector('#tagName') as HTMLInputElement;
const TAG_DESC = document.querySelector('#tagDesc') as HTMLInputElement;
const TAG_APPLY = document.querySelector('#applyBtn') as HTMLButtonElement;
const TAG_DEL = document.querySelector('#deleteBtn') as HTMLButtonElement;

let [tagId, tagGroup, tagName, tagDesc] = ['', '', '', ''];

TAG_ID.addEventListener('click', () => ([TAG_ID.value, TAG_NAME.value, TAG_DESC.value] = ['', '', '']));
TAG_APPLY.addEventListener('click', () => {
  [tagId, tagGroup, tagName, tagDesc] = [TAG_ID.value, TAG_GROUP.value, TAG_NAME.value, TAG_DESC.value];
  if (tagName !== '') void FlayAction.putTag(tagId === '' ? -1 : parseInt(tagId), tagGroup, tagName, tagDesc, renderTagList);
});
TAG_DEL.addEventListener('click', () => {
  [tagId, tagName, tagDesc] = [TAG_ID.value, TAG_NAME.value, TAG_DESC.value];
  if (tagId !== '') if (confirm('A U sure?')) void FlayAction.deleteTag(parseInt(tagId), tagName, tagDesc, renderTagList);
});

void renderTagList();

async function renderTagList() {
  document.querySelector('body > main')!.textContent = null;

  const tagGroupList = await FlayFetch.getTagGroups();
  Array.from(tagGroupList).forEach(({ id, name, desc }) => {
    const groupDiv = document.querySelector('body > main')!.appendChild(document.createElement('fieldset'));
    groupDiv.innerHTML = `<legend>${id}: ${name} ${desc}</legend><div id="${id}"></div>`;

    const dropzone = groupDiv.querySelector('div')!;
    dropzone.classList.add('dropzone');
    DragDrop.setDropzone(dropzone);

    if (id === 'etc') {
      const pin = document.createElement('span');
      pin.innerHTML = `📌`;
      pin.className = 'pin';
      pin.addEventListener('click', () => groupDiv.classList.toggle('fixed'));

      groupDiv.insertAdjacentElement('afterbegin', pin);
    }
  });

  void FlayFetch.getTagListWithCount().then((tagList: Tag[]) => {
    Array.from(tagList)
      .sort((t1, t2) => t1.name.localeCompare(t2.name))
      .forEach((tag) => {
        const flayTagInfo = new FlayTagInfo(tag);
        flayTagInfo.addEventListener('drop', async (e) => {
          const dropzone = (e.target as HTMLElement).closest('.dropzone')!;
          const newGroup = dropzone.id;
          if (tag.group !== newGroup) {
            tag.group = newGroup;
            await FlayAction.updateTag(tag);
          }
          // 해당 드롭존에 태그 다시 정렬
          const sorted = Array.from(dropzone.querySelectorAll('.flay-tag-info')).sort((t1, t2) => (t1 as FlayTagInfo).tag.name.localeCompare((t2 as FlayTagInfo).tag.name));
          for (const flayTagInfo of sorted) {
            dropzone.insertBefore(flayTagInfo, null);
          }
        });

        document.querySelector('#etc')!.append(flayTagInfo);
        if (tag.group) document.querySelector('#' + tag.group)?.append(flayTagInfo);

        DragDrop.setMoveable(flayTagInfo);
      });
  });
}

addResizeListener(() => {
  // FHD 해상도 면적 이상이면, flay 갯수에 비례하여 폰트 크기 설정
  const isHugeScreen = window.innerWidth * window.innerHeight > 1080 * 1920;
  document.querySelectorAll('.flay-tag-info').forEach((element) => {
    const flayTagInfo = element as FlayTagInfo;
    (flayTagInfo.querySelector('.name') as HTMLElement).style.fontSize = isHugeScreen ? `calc(var(--size-normal) + ${Math.floor(Number(flayTagInfo.dataset.flayCount) / 5)}px)` : '';
  });
}, true);

window.dispatchEvent(new Event('resize')); // 초기화 시점에 resize 이벤트 발생
