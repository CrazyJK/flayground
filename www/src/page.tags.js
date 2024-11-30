import './init/Page';
import './page.tags.scss';
import tagSVG from './svg/tag.svg';

import * as DragDrop from './lib/Drag&Drop';
import FlayAction from './util/FlayAction';
import { popupTag } from './util/FlaySearch';
import { addResizeListener } from './util/windowAddEventListener';

class FlayTagInfo extends HTMLDListElement {
  constructor(tag) {
    super();
    this.tag = tag;

    this.draggable = true;
    this.dataset.id = this.tag.id;
    this.dataset.flayCount = this.tag.count;
    this.classList.add('flay-tag-info');
    this.innerHTML = `
      <dt>
        <label class="icon" title="${this.tag.id}">${tagSVG}</label>
        <label class="name">${this.tag.name}</label>
        <label class="count ${this.tag.count === 0 ? 'zero' : ''}">${this.tag.count}</label>
      </dt>
      <dd>
        <label class="desc">${this.tag.description}</label>
      </dd>
    `;

    this.addEventListener('click', () => ([TAG_ID.value, TAG_NAME.value, TAG_DESC.value] = [this.tag.id, this.tag.name, this.tag.description]));
    this.querySelector('.name').addEventListener('click', () => popupTag(this.tag.id));
  }
}

customElements.define('flay-tag-info', FlayTagInfo, { extends: 'dl' });

// header
const TAG_ID = document.querySelector('#tagId');
const TAG_NAME = document.querySelector('#tagName');
const TAG_DESC = document.querySelector('#tagDesc');
const TAG_APPLY = document.querySelector('#applyBtn');
const TAG_DEL = document.querySelector('#deleteBtn');

let [tagId, tagName, tagDesc] = ['', '', ''];

TAG_ID.addEventListener('click', () => ([TAG_ID.value, TAG_NAME.value, TAG_DESC.value] = ['', '', '']));
TAG_APPLY.addEventListener('click', () => {
  [tagId, tagName, tagDesc] = [TAG_ID.value, TAG_NAME.value, TAG_DESC.value];
  if (tagName !== '') FlayAction.putTag(tagId === '' ? '-1' : tagId, tagName, tagDesc, renderTagList);
});
TAG_DEL.addEventListener('click', () => {
  [tagId, tagName, tagDesc] = [TAG_ID.value, TAG_NAME.value, TAG_DESC.value];
  if (tagId !== '') if (confirm('A U sure?')) FlayAction.deleteTag(tagId, tagName, tagDesc, renderTagList);
});

renderTagList();

async function renderTagList() {
  const tagGroupList = await fetch('/info/tagGroup').then((res) => res.json());

  Array.from(tagGroupList).forEach(({ id, name, desc }) => {
    const groupDiv = document.querySelector('body > main').appendChild(document.createElement('fieldset'));
    groupDiv.innerHTML = `<legend>${id}: ${name} ${desc}</legend><div id="${id}"></div>`;

    const dropzone = groupDiv.querySelector('div');
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

  fetch('/info/tag/withCount')
    .then((res) => res.json())
    .then((tagList) => {
      Array.from(tagList)
        .sort((t1, t2) => t1.name.localeCompare(t2.name))
        .forEach((tag) => {
          const flayTagInfo = new FlayTagInfo(tag);
          flayTagInfo.addEventListener('drop', async (e) => {
            tag.group = e.target.parentElement.id;
            await FlayAction.updateTag(tag);
          });

          document.querySelector('#etc').append(flayTagInfo);
          if (tag.group) document.querySelector('#' + tag.group)?.append(flayTagInfo);

          DragDrop.setMoveable(flayTagInfo);
        });
    });
}

addResizeListener(() => {
  // FHD 해상도 면적 이상이면, flay 갯수에 비례하여 폰트 크기 설정
  const isHugeScreen = window.innerWidth * window.innerHeight > 1080 * 1920;
  document.querySelectorAll('.flay-tag-info').forEach((flayTagInfo) => {
    flayTagInfo.querySelector('.name').style.fontSize = isHugeScreen ? `calc(var(--size-normal) + ${Math.floor(Number(flayTagInfo.dataset.flayCount) / 5)}px)` : '';
  });
});
