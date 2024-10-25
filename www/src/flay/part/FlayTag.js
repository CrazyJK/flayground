import FlayAction from '../../util/FlayAction';
import FlayHTMLElement, { defineCustomElements } from './FlayHTMLElement';
import './FlayTag.scss';

/**
 * Custom element of Tag
 */
export default class FlayTag extends FlayHTMLElement {
  flay;
  tagList = null;

  constructor() {
    super();

    this.classList.add('flay-tag');
    this.innerHTML = `<div class="tag-list" id="tagList"></div>`;
  }

  /**
   *
   * @param {Flay} flay
   * @param {boolean} reload
   */
  set(flay, reload) {
    this.flay = flay;
    this.setAttribute('data-opus', flay.opus);
    this.classList.toggle('archive', this.flay.archive);

    this.#displayTag(reload);
  }

  async #displayTag(reload) {
    const tagListWrap = this.querySelector('#tagList');

    if (this.tagList === null || reload) {
      this.tagList = await fetch('/info/tag').then((res) => res.json());

      tagListWrap.textContent = null;

      Array.from(this.tagList)
        .sort((t1, t2) => t1.name.localeCompare(t2.name))
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

          tagListWrap.append(input, label);
        });
    }

    tagListWrap.querySelectorAll('input').forEach((input) => {
      input.checked = Array.from(this.flay.video.tags).filter((tag) => tag.id === Number(input.value)).length > 0;
    });

    tagListWrap.querySelectorAll('label').forEach((label) => {
      const keywords = [label.textContent, ...label.title.split(',')].filter((keyword) => keyword !== '').map((keyword) => keyword.trim());
      let found = false;
      for (let keyword of keywords) {
        if ((this.flay.title + this.flay.video.comment).indexOf(keyword) > -1) {
          found = true;
          break;
        }
      }
      label.classList.toggle('candidate', found);
    });
  }
}

defineCustomElements('flay-tag', FlayTag);
