import flayAction from '../../util/flay.action';
import SVG from '../svg.json';

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
    const TAG_ID = HEADER_DIV.appendChild(document.createElement('label'));
    TAG_ID.addEventListener('click', (e) => {
      TAG_ID.textContent = '';
      TAG_NAME.value = '';
      TAG_DESC.value = '';
    });

    const TAG_NAME = HEADER_DIV.appendChild(document.createElement('input'));
    TAG_NAME.type = 'text';
    TAG_NAME.placeholder = 'Tag name';

    const TAG_DESC = HEADER_DIV.appendChild(document.createElement('input'));
    TAG_DESC.type = 'text';
    TAG_DESC.placeholder = 'Description...';

    const TAG_APPLY = HEADER_DIV.appendChild(document.createElement('button'));
    TAG_APPLY.textContent = 'Apply';
    TAG_APPLY.addEventListener('click', () => {
      let tagId = TAG_ID.textContent;
      let tagName = TAG_NAME.value;
      let tagDesc = TAG_DESC.value;
      console.log('tag apply click', tagId, tagName, tagDesc);
      if (tagName !== '') {
        if (tagId === '') {
          tagId = '-1';
        }
        flayAction.putTag(tagId, tagName, tagDesc);
      }
    });

    const TAG_DEL = HEADER_DIV.appendChild(document.createElement('button'));
    TAG_DEL.textContent = 'Del';
    TAG_DEL.addEventListener('click', () => {
      let tagId = TAG_ID.textContent;
      let tagName = TAG_NAME.value;
      let tagDesc = TAG_DESC.value;
      if (tagId !== '') {
        if (confirm('A U sure?')) {
          flayAction.deleteTag(tagId, tagName, tagDesc);
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
              TAG_ID.innerHTML = tag.id;
              TAG_NAME.value = tag.name;
              TAG_DESC.value = tag.description;
            });
            let descLabel = tagLi.appendChild(document.createElement('label'));
            descLabel.innerHTML = tag.description;

            fetch('/flay/count/tag/' + tag.id)
              .then((res) => res.json())
              .then((count) => {
                flayCount.innerHTML = count;
              });
          });
        return tagList;
      });
  }
}

// Define the new element
customElements.define('tag-layer', TagLayer);

const CSS = `
/* for tag-layer */
.tag-layer {
  display: grid;
  grid-template-rows: 4rem 1fr;
}
.tag-layer div {
  margin: 1rem;
}
.tag-layer div.tag-header {
  display: flex;
  justify-content: center;
  gap: 1rem;
}
.tag-layer div.tag-header label {
  min-width: 2rem;
}
.tag-layer .tag-main {
  overflow: auto;
}
.tag-layer ol {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-evenly;
  align-items: flex-start;
  gap: 0.5rem 0.125rem;
  list-style: none;
  margin: 0;
  padding: 0;
}
.tag-layer ol li {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border);
  padding: 0.25rem;
  max-width: 220px;
  min-width: 100px;
  transition: 0.4s;
}
.tag-layer ol li:hover {
  box-shadow: var(--box-shadow);
}
.tag-layer ol li label {
  position: relative;
}
.tag-layer ol li label:nth-child(1) {
  display: flex;
  justify-content: space-between;
  gap: 0.25rem;
}
.tag-layer ol li label:nth-child(2) {
  font-size: var(--font-normal);
  font-weight: 400;
}
.tag-layer ol li span {
  flex: 1 1 auto;
}
`;
