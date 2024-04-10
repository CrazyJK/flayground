import './init/Page';
import './page.tags.scss';

import SVG from './svg/svg';
import FlayAction from './util/FlayAction';
import { addResizeLazyEventListener } from './util/resizeListener';

// header
const TAG_ID = document.querySelector('#tagId');
const TAG_NAME = document.querySelector('#tagName');
const TAG_DESC = document.querySelector('#tagDesc');
const TAG_APPLY = document.querySelector('#applyBtn');
const TAG_DEL = document.querySelector('#deleteBtn');

TAG_ID.addEventListener('click', (e) => {
  TAG_ID.value = '';
  TAG_NAME.value = '';
  TAG_DESC.value = '';
});
TAG_APPLY.addEventListener('click', () => {
  let tagId = TAG_ID.value;
  let tagName = TAG_NAME.value;
  let tagDesc = TAG_DESC.value;
  console.log('tag apply click', tagId, tagName, tagDesc);
  if (tagName !== '') {
    if (tagId === '') {
      tagId = '-1';
    }
    FlayAction.putTag(tagId, tagName, tagDesc, renderTagList);
  }
});
TAG_DEL.addEventListener('click', () => {
  let tagId = TAG_ID.value;
  let tagName = TAG_NAME.value;
  let tagDesc = TAG_DESC.value;
  if (tagId !== '') {
    if (confirm('A U sure?')) {
      FlayAction.deleteTag(tagId, tagName, tagDesc, renderTagList);
    }
  }
});

// list
const LIST_WRAPPER = document.querySelector('ol');

renderTagList();

function renderTagList() {
  LIST_WRAPPER.textContent = null;

  fetch('/info/tag/withCount')
    .then((res) => res.json())
    .then((tagList) => {
      Array.from(tagList)
        .sort((t1, t2) => {
          return t1.name.localeCompare(t2.name);
        })
        .forEach((tag) => {
          const li = LIST_WRAPPER.appendChild(document.createElement('li'));
          li.innerHTML = `
            <dl>
              <dt>
                <label class="edit">${SVG.edit}</label>
                <label class="name">${tag.name}</label>
                <label class="count ${tag.count === 0 ? 'zero' : ''}">${tag.count}</label>
              </dt>
              <dd>
                <label class="desc">${tag.description}</label>
              </dd>
            </dl>
          `;

          li.querySelector('.name').addEventListener('click', () => {
            window.open('popup.tag.html?id=' + tag.id, 'tag' + tag.id, 'width=960px,height=1200px');
          });
          li.querySelector('.edit').addEventListener('click', () => {
            TAG_ID.value = tag.id;
            TAG_NAME.value = tag.name;
            TAG_DESC.value = tag.description;
          });
          // resize event
          addResizeLazyEventListener(() => {
            if (window.innerWidth >= 1920) {
              // FHD 해상도 이상이면, flay 갯수에 비례하여 폰트 크기 설정
              const count = parseInt(li.querySelector('.count').textContent);
              const countStep = Math.floor(count / 5);

              li.querySelectorAll('dt label').forEach((label) => (label.style.fontSize = `calc(var(--size-normal) + ${countStep}px)`));
            } else {
              li.querySelectorAll('dt label').forEach((label) => (label.style.fontSize = ''));
            }
          });
        });
    });
}
