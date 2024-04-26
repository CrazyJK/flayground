import FlayAction from '../../util/FlayAction';
import FlayHTMLElement from './FlayHTMLElement';
import './FlayTag.scss';

/**
 * Custom element of Tag
 */
export default class FlayTag extends FlayHTMLElement {
  flay;
  tagList = null;

  constructor() {
    super();

    this.init();
  }

  init() {
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
