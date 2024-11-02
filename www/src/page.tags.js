import './init/Page';
import './page.tags.scss';
import tagSVG from './svg/tag.svg';

import { tagGroup } from './flay/part/FlayTag';
import FlayAction from './util/FlayAction';
import { popupTag } from './util/FlaySearch';
import { addResizeListener } from './util/windowAddEventListener';

class FlayTagInfo extends HTMLDListElement {
  constructor(tag) {
    super();
    this.tag = tag;

    this.dataset.id = this.tag.id;
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

    addResizeListener(() => {
      const [area, fhd] = [window.innerWidth * window.innerHeight, 1987200];
      if (area > fhd) {
        // FHD 해상도 면적 이상이면, flay 갯수에 비례하여 폰트 크기 설정
        this.querySelector('.name').style.fontSize = `calc(var(--size-normal) + ${Math.floor(this.tag.count / 5)}px)`;
      } else {
        this.querySelector('.name').style.fontSize = '';
      }
    });
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

function renderTagList() {
  document.querySelector('body > main').innerHTML = Object.entries(tagGroup)
    .map(([key, info]) => `<fieldset><legend>${key}: ${info.name} ${info.desc}</legend><div id="${key}"></div></fieldset>`)
    .join('');

  fetch('/info/tag/withCount')
    .then((res) => res.json())
    .then((tagList) => {
      Array.from(tagList)
        .sort((t1, t2) => t1.name.localeCompare(t2.name))
        .forEach((tag) => {
          const flayTagInfo = new FlayTagInfo(tag);

          document.querySelector('#etc').append(flayTagInfo);
          Object.entries(tagGroup).forEach(([key, info]) => {
            if (info.ids.includes(tag.id)) {
              document.querySelector('#' + key).append(flayTagInfo);
              return;
            }
          });
        });
    });
}
