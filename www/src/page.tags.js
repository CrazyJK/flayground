import './init/Page';
import './page.tags.scss';

import SVG from './svg/svg.json';
import FlayAction from './util/FlayAction';

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
          let li = LIST_WRAPPER.appendChild(document.createElement('li'));
          let dl = li.appendChild(document.createElement('dl'));
          let dt = dl.appendChild(document.createElement('dt'));
          let dd = dl.appendChild(document.createElement('dd'));

          let editLabel = dt.appendChild(document.createElement('label'));
          let nameLabel = dt.appendChild(document.createElement('label'));
          let contLabel = dt.appendChild(document.createElement('label'));
          let descLabel = dd.appendChild(document.createElement('label'));

          editLabel.innerHTML = SVG.edit;
          nameLabel.innerHTML = tag.name;
          contLabel.innerHTML = tag.count;
          descLabel.innerHTML = tag.description;

          if (tag.count === 0) {
            contLabel.classList.add('zero');
          }

          nameLabel.addEventListener('click', (e) => {
            window.open('popup.tag.html?id=' + tag.id, 'tag' + tag.id, 'width=960px,height=1200px');
          });
          editLabel.addEventListener('click', (e) => {
            TAG_ID.value = tag.id;
            TAG_NAME.value = tag.name;
            TAG_DESC.value = tag.description;
          });
        });
    });
}
