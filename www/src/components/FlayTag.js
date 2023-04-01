import FlayAction from '../util/flay.action';

/**
 *
 */
export default class FlayTag extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다

    this.flay = null;
    this.tagInputElementArray = [];
    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('tag');

    const tagListElement = this.wrapper.appendChild(document.createElement('div'));
    tagListElement.classList.add('tag-list');

    fetch('/info/tag/list')
      .then((res) => res.json())
      .then((tagList) => {
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
              console.log('tagChange', this.flay.opus, e.target.value, e.target.checked);
              FlayAction.toggleTag(this.flay.opus, e.target.value, e.target.checked);
            });

            const label = tagListElement.appendChild(document.createElement('label'));
            label.setAttribute('title', tag.name + '\n' + tag.description);
            label.setAttribute('for', 'tag' + tag.id);
            label.textContent = tag.name;

            this.tagInputElementArray.push(tagInputElement);
          });

        const tagNewBtn = tagListElement.appendChild(document.createElement('button'));
        tagNewBtn.classList.add('tag-new-btn');
        tagNewBtn.textContent = 'NEW';
        tagNewBtn.addEventListener('click', () => {
          tagNewElement.classList.toggle('show');
        });
      });

    const tagNewElement = this.wrapper.appendChild(document.createElement('div'));
    tagNewElement.classList.add('tag-new');

    const tagNewInput = tagNewElement.appendChild(document.createElement('input'));
    tagNewInput.type = 'search';
    tagNewInput.placeholder = 'new Tag';
    tagNewInput.addEventListener('keyup', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.code !== 'Enter' && e.code !== 'NumpadEnter') {
        return;
      }
      console.log('tagNewInputKeyup', this.flay.opus, '[' + e.target.value + ']');
      FlayAction.newTag(e.target.value, (tag) => {
        FlayAction.toggleTag(this.flay.opus, tag.id, true, () => {
          tagNewElement.style.display = 'none';
        });
      });
    });

    const style = document.createElement('link');
    style.setAttribute('rel', 'stylesheet');
    style.setAttribute('href', './css/components.css');

    this.shadowRoot.append(style, this.wrapper); // 생성된 요소들을 shadow DOM에 부착합니다
  }

  /**
   *
   * @param {Flay} flay
   */
  set(flay) {
    this.flay = flay;
    this.wrapper.classList.toggle('archive', this.flay.archive);
    this.wrapper.setAttribute('data-opus', flay.opus);

    this.tagInputElementArray.forEach((input) => {
      let id = input.getAttribute('value');
      let foundTags = Array.from(flay.video.tags).filter((tag) => tag.id === Number(id));
      if (foundTags.length > 0) {
        input.checked = true;
      } else {
        input.checked = false;
      }
    });
  }
}

// Define the new element
customElements.define('flay-tag', FlayTag);
