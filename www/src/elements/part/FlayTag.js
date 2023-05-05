import FlayAction from '../../util/flay.action';

/**
 *
 */
export default class FlayTag extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다
    const LINK = document.createElement('link');
    LINK.setAttribute('rel', 'stylesheet');
    LINK.setAttribute('href', './css/4.components.css');
    const STYLE = document.createElement('style');
    STYLE.innerHTML = CSS;
    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('tag');
    this.shadowRoot.append(LINK, STYLE, this.wrapper); // 생성된 요소들을 shadow DOM에 부착합니다

    this.flay = null;
    this.tagInputElementArray = [];

    this.tagListElement = this.wrapper.appendChild(document.createElement('div'));
    this.tagListElement.classList.add('tag-list');

    this.tagNewElement = this.wrapper.appendChild(document.createElement('div'));
    this.tagNewElement.classList.add('tag-new');

    this.tagNewInput = this.tagNewElement.appendChild(document.createElement('input'));
    this.tagNewInput.type = 'search';
    this.tagNewInput.placeholder = 'new Tag';
    this.tagNewInput.addEventListener('keyup', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.code !== 'Enter' && e.code !== 'NumpadEnter') {
        return;
      }
      console.log('tagNewInputKeyup', this.flay.opus, '[' + e.target.value + ']');
      FlayAction.newTag(e.target.value, (tag) => {
        fetchTag(this.flay, this.tagInputElementArray, this.tagListElement, this.tagNewElement).then(() => {
          FlayAction.toggleTag(this.flay.opus, tag.id, true, () => {
            this.tagNewElement.classList.remove('show');
          });
        });
      });
    });
  }

  /**
   *
   * @param {Flay} flay
   */
  set(flay) {
    this.flay = flay;
    this.wrapper.setAttribute('data-opus', flay.opus);
    this.wrapper.classList.toggle('archive', this.flay.archive);
    this.wrapper.classList.toggle('small', this.parentElement.classList.contains('small') || this.classList.contains('small'));

    fetchTag(this.flay, this.tagInputElementArray, this.tagListElement, this.tagNewElement, this.tagNewInput)
      .then(() => {
        this.tagInputElementArray.forEach((input) => {
          let id = input.getAttribute('value');
          let foundTags = Array.from(flay.video.tags).filter((tag) => tag.id === Number(id));
          if (foundTags.length > 0) {
            input.checked = true;
          } else {
            input.checked = false;
          }
        });
      })
      .then(() => {
        this.tagListElement.childNodes.forEach((child) => {
          if (child.tagName === 'LABEL') {
            let keywords = [child.textContent, ...child.title.split(',')].filter((keyword) => keyword !== '').map((keyword) => keyword.trim());
            let found = false;
            for (let keyword of keywords) {
              if ((flay.title + flay.video.comment).indexOf(keyword) > -1) {
                found = true;
                break;
              }
            }
            child.classList.toggle('candidate', found);
          }
        });
      });
  }
}

// Define the new element
customElements.define('flay-tag', FlayTag);

async function fetchTag(flay, tagInputElementArray, tagListElement, tagNewElement, tagNewInput) {
  return fetch('/info/tag/list')
    .then((res) => res.json())
    .then((tagList) => {
      tagListElement.textContent = null;
      Array.from(tagList)
        .sort((t1, t2) => {
          return t1.name.localeCompare(t2.name);
        })
        .forEach((tag) => {
          const tagInputElement = tagListElement.appendChild(document.createElement('input'));
          tagInputElement.setAttribute('type', 'checkbox');
          tagInputElement.setAttribute('name', 'tag');
          tagInputElement.setAttribute('id', 'tag' + tag.id);
          tagInputElement.setAttribute('value', tag.id);
          tagInputElement.addEventListener('change', (e) => {
            console.log('tagChange', flay.opus, e.target.value, e.target.checked);
            FlayAction.toggleTag(flay.opus, e.target.value, e.target.checked);
          });

          const label = tagListElement.appendChild(document.createElement('label'));
          label.setAttribute('title', tag.description);
          label.setAttribute('for', 'tag' + tag.id);
          label.textContent = tag.name;

          tagInputElementArray.push(tagInputElement);
        });

      const tagNewBtn = tagListElement.appendChild(document.createElement('button'));
      tagNewBtn.classList.add('tag-new-btn');
      tagNewBtn.textContent = 'NEW';
      tagNewBtn.addEventListener('click', () => {
        tagNewElement.classList.toggle('show');
        if (tagNewElement.classList.contains('show')) {
          tagNewInput.focus();
        }
      });
    });
}

const CSS = `
/* for FlayTag */
div.tag {
  padding-bottom: 1rem;
}
div.tag .tag-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: baseline;
  gap: 0.25rem 0.5rem;
}
div.tag .tag-list label {
  font-size: var(--font-normal);
  padding: 0.25rem;
  transition: 0.2s;
}
div.tag .tag-list label:hover {
  box-shadow: var(--box-shadow-small);
  border-radius: var(--border-radius);
}
div.tag .tag-list .tag-new-btn {
  font-size: var(--font-normal);
}
div.tag .tag-new {
  display: none;
}
div.tag .tag-new.show {
  display: block;
}
div.tag .tag-new input {
  background-color: transparent;
  color: var(--color-text);
  margin: 0.25rem;
  border: 0;
  padding: 0.25rem;
  font-size: var(--font-large);
  text-align: center;
}
div.tag.small input:not(:checked) + label {
  display: none;
}
div.tag.small .tag-new-btn {
  display: none;
}
.candidate {
  color: #f00b;
}
`;
