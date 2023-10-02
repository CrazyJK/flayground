import SVG from '../../resources/svg/svg.json';
import FlayAction from '../util/FlayAction';

export default class TagLayer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다
    const LINK = document.createElement('link');
    LINK.setAttribute('rel', 'stylesheet');
    LINK.setAttribute('href', './css/4.components.css');
    const STYLE = document.createElement('style');
    STYLE.innerHTML = CSS;
    const wrapper = document.createElement('div');
    wrapper.classList.add('tag-layer');
    this.shadowRoot.append(STYLE, LINK, wrapper); // 생성된 요소들을 shadow DOM에 부착합니다

    const HEADER_DIV = wrapper.appendChild(document.createElement('div'));
    HEADER_DIV.classList.add('tag-header');
    const MAIN_DIV = wrapper.appendChild(document.createElement('div'));
    MAIN_DIV.classList.add('tag-main');

    // header
    const TAG_ID = HEADER_DIV.appendChild(document.createElement('input'));
    TAG_ID.id = 'tagId';
    TAG_ID.type = 'text';
    TAG_ID.placeholder = 'ID';
    TAG_ID.readOnly = true;
    TAG_ID.addEventListener('click', (e) => {
      TAG_ID.value = '';
      TAG_NAME.value = '';
      TAG_DESC.value = '';
    });

    const TAG_NAME = HEADER_DIV.appendChild(document.createElement('input'));
    TAG_NAME.id = 'tagName';
    TAG_NAME.type = 'text';
    TAG_NAME.placeholder = 'Tag name';

    const TAG_DESC = HEADER_DIV.appendChild(document.createElement('input'));
    TAG_DESC.id = 'tagDesc';
    TAG_DESC.type = 'text';
    TAG_DESC.placeholder = 'Description...';

    const TAG_APPLY = HEADER_DIV.appendChild(document.createElement('button'));
    TAG_APPLY.textContent = 'Apply';
    TAG_APPLY.addEventListener('click', () => {
      let tagId = TAG_ID.value;
      let tagName = TAG_NAME.value;
      let tagDesc = TAG_DESC.value;
      console.log('tag apply click', tagId, tagName, tagDesc);
      if (tagName !== '') {
        if (tagId === '') {
          tagId = '-1';
        }
        FlayAction.putTag(tagId, tagName, tagDesc);
      }
    });

    const TAG_DEL = HEADER_DIV.appendChild(document.createElement('button'));
    TAG_DEL.textContent = 'Del';
    TAG_DEL.addEventListener('click', () => {
      let tagId = TAG_ID.value;
      let tagName = TAG_NAME.value;
      let tagDesc = TAG_DESC.value;
      if (tagId !== '') {
        if (confirm('A U sure?')) {
          FlayAction.deleteTag(tagId, tagName, tagDesc);
        }
      }
    });

    // list
    const LIST_DIV = MAIN_DIV.appendChild(document.createElement('ol'));
    fetch('/info/tag')
      .then((res) => res.json())
      .then((tagList) => {
        Array.from(tagList)
          .sort((t1, t2) => {
            return t1.name.localeCompare(t2.name);
          })
          .forEach((tag) => {
            let tagLi = LIST_DIV.appendChild(document.createElement('li'));
            tagLi.dataset.id = tag.id;
            let nameLabel = tagLi.appendChild(document.createElement('label'));
            let flayCount = nameLabel.appendChild(document.createElement('i'));
            flayCount.classList.add('badge');
            let tagName = nameLabel.appendChild(document.createElement('a'));
            tagName.innerHTML = tag.name;
            tagName.addEventListener('click', (e) => {
              window.open('card.tag.html?id=' + tag.id, 'tag' + tag.id, 'width=960px,height=1200px');
            });
            let tagEdit = nameLabel.appendChild(document.createElement('a'));
            tagEdit.innerHTML = SVG.edit;
            tagEdit.addEventListener('click', (e) => {
              TAG_ID.value = tag.id;
              TAG_NAME.value = tag.name;
              TAG_DESC.value = tag.description;
            });
            let descLabel = tagLi.appendChild(document.createElement('label'));
            descLabel.innerHTML = tag.description;

            fetch('/flay/count/tag/' + tag.id)
              .then((res) => res.json())
              .then((count) => {
                flayCount.innerHTML = count;
                if (count === 0) {
                  flayCount.classList.add('zero');
                }
              });
          });
        return tagList;
      });
  }
}

// Define the new element
customElements.define('tag-layer', TagLayer);

const CSS = `
.tag-layer {
  display: grid;
  grid-template-rows: 4rem 1fr;
}
.tag-layer div {
  margin: 1rem;
}
.tag-layer div.tag-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}
.tag-layer div.tag-header input,
.tag-layer div.tag-header button {
  border: 1px dashed chocolate;
}

.tag-layer div.tag-header input#tagId {
  max-width: 3rem;
}
.tag-layer div.tag-header input#tagDesc {
  flex: 1 1 auto;
}
.tag-layer div.tag-header button {
  padding: 0 1rem;
}

.tag-layer .tag-main {
  margin: 0;
  padding: 1rem;
  overflow: auto;
}
.tag-layer .tag-main ol {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-evenly;
  align-items: flex-start;
  gap: 0.5rem 0.25rem;
  list-style: none;
  margin: 0;
}
.tag-layer .tag-main ol li {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border);
  padding: 0.25rem;
  /* max-width: 220px; */
  min-width: 5rem;
  transition: 0.4s;
}
.tag-layer .tag-main ol li:hover {
  box-shadow: var(--box-shadow);
}
.tag-layer .tag-main ol li label:nth-child(1) {
  display: flex;
  justify-content: space-between;
  gap: 0.25rem;
}
.tag-layer .tag-main ol li label:nth-child(2) {
  font-size: var(--font-small);
  font-weight: 400;
  text-align: center;
}
.tag-layer .tag-main ol li span {
  flex: 1 1 auto;
}
.badge.zero {
  color: var(--color-red);
}
`;
