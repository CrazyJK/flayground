import { componentCss } from '../../util/componentCssLoader';
import FlayAction from '../../util/FlayAction';

/**
 * Custom element of Tag
 */
export default class FlayTag extends HTMLElement {
  flay;
  tagList = null;

  constructor() {
    super();

    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다

    const STYLE = document.createElement('style');
    STYLE.innerHTML = CSS;

    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('tag');
    this.wrapper.innerHTML = `
      <div class="tag-list" id="tagList">
        <button class="tag-new-btn" id="tagNewBtn">NEW</button>
      </div>
      <div class="tag-new" id="tagNewWrap">
        <input type="search" id="tagNewInput" placeholder="new Tag">
      </div>
    `;

    const tagNewBtn = this.wrapper.querySelector('#tagNewBtn');
    const tagNewWrap = this.wrapper.querySelector('#tagNewWrap');
    const tagNewInput = this.wrapper.querySelector('#tagNewInput');

    tagNewBtn.addEventListener('click', (e) => {
      if (tagNewWrap.classList.toggle('show')) {
        tagNewInput.focus();
      }
    });

    tagNewInput.addEventListener('keyup', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.code !== 'Enter' && e.code !== 'NumpadEnter') {
        return;
      }
      if (e.target.value.trim() === '') {
        return;
      }
      console.log('tagNewInputKeyup', this.flay.opus, '[' + e.target.value + ']');
      FlayAction.newTagOnOpus(e.target.value, this.flay.opus, (tag) => {
        // this.#fetchTag(true).then(() => {
        //   FlayAction.toggleTag(this.flay.opus, tag.id, true, () => {
        tagNewWrap.classList.remove('show');
        //   });
        // });
      });
    });

    this.shadowRoot.append(STYLE, this.wrapper); // 생성된 요소들을 shadow DOM에 부착합니다
  }

  connectedCallback() {
    // this.#fetchTag();
  }

  resize(domRect) {
    this.domRect = domRect;
    this.isCard = this.classList.contains('card');
    this.wrapper.classList.toggle('card', this.isCard);
    this.wrapper.classList.toggle('small', domRect.width < 400);
  }

  /**
   *
   * @param {Flay} flay
   * @param {boolean} reload
   */
  set(flay, reload) {
    this.flay = flay;
    this.wrapper.setAttribute('data-opus', flay.opus);
    this.wrapper.classList.toggle('archive', this.flay.archive);

    this.#fetchTag(reload)
      .then((tagListWrap) => {
        tagListWrap.querySelectorAll('input').forEach((input) => {
          let id = input.getAttribute('value');
          let foundTags = Array.from(flay.video.tags).filter((tag) => tag.id === Number(id));
          if (foundTags.length > 0) {
            input.checked = true;
          } else {
            input.checked = false;
          }
        });
        return tagListWrap;
      })
      .then((tagListWrap) => {
        tagListWrap.querySelectorAll('label').forEach((label) => {
          const keywords = [label.textContent, ...label.title.split(',')].filter((keyword) => keyword !== '').map((keyword) => keyword.trim());
          let found = false;
          for (let keyword of keywords) {
            if ((flay.title + flay.video.comment).indexOf(keyword) > -1) {
              found = true;
              break;
            }
          }
          label.classList.toggle('candidate', found);
        });
      });
  }

  async #fetchTag(reload) {
    const tagListWrap = this.wrapper.querySelector('#tagList');

    if (window.tagList && window.tagList.length > 0) {
      this.tagList = window.tagList;
    }

    if (this.tagList === null || reload) {
      this.tagList = await fetch('/info/tag').then((res) => res.json());
      if (window.tagList) {
        window.tagList = this.tagList;
      }
    }

    tagListWrap.querySelectorAll('input, label').forEach((element) => {
      element.remove();
    });

    Array.from(this.tagList)
      .sort((t1, t2) => {
        return t2.name.localeCompare(t1.name);
      })
      .forEach((tag) => {
        const input = document.createElement('input');
        input.setAttribute('type', 'checkbox');
        input.setAttribute('name', 'tag');
        input.setAttribute('id', 'tag' + tag.id);
        input.setAttribute('value', tag.id);
        input.addEventListener('change', (e) => {
          console.log('tagChange', this.flay.opus, e.target.value, e.target.checked);
          FlayAction.toggleTag(this.flay.opus, e.target.value, e.target.checked);
        });

        const label = document.createElement('label');
        label.setAttribute('title', tag.description);
        label.setAttribute('for', 'tag' + tag.id);
        label.textContent = tag.name;

        tagListWrap.prepend(label);
        tagListWrap.prepend(input);
      });

    return tagListWrap;
  }
}

// Define the new element
customElements.define('flay-tag', FlayTag);

const CSS = `
${componentCss}
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
  font-size: var(--size-normal);
  padding: 0.25rem;
  transition: box-shadow 0.4s 0.2s;
}
div.tag .tag-list label:hover {
  box-shadow: var(--box-shadow-small);
  border-radius: var(--border-radius);
}
div.tag .tag-list .tag-new-btn {
  font-size: var(--size-normal);
}
div.tag .tag-new {
  display: none;
  text-align: center;
}
div.tag .tag-new.show {
  display: block;
}
div.tag .tag-new input {
  margin: 0.25rem;
  border: 0;
  padding: 0.25rem;
}
div.tag.card {
  padding: 0;
}
div.tag.card .tag-list label {
  padding: 0.125rem;
}
div.tag.card input:not(:checked) + label {
  display: none;
}
div.tag.card .tag-new-btn {
  display: none;
}
.candidate {
  color: #f00b;
}
`;
