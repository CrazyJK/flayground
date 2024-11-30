import FlayAction from '../../util/FlayAction';
import FlayHTMLElement, { defineCustomElements } from './FlayHTMLElement';
import './FlayTag.scss';

/**
 * Custom element of Tag
 */
export default class FlayTag extends FlayHTMLElement {
  tagList = null;

  constructor() {
    super();
  }

  connectedCallback() {
    this.classList.add('flay-tag');
  }

  /**
   *
   * @param {Flay} flay
   * @param {boolean} reload
   */
  set(flay, reload) {
    this.setFlay(flay);

    this.#displayTag(reload);
  }

  async #displayTag(reload) {
    if (this.tagList === null || reload) {
      const tagGroupList = await fetch('/info/tagGroup').then((res) => res.json());

      this.innerHTML = Array.from(tagGroupList)
        .map(({ id, name, desc }) => `<div class="tag-list" id="${id}" title="${name} ${desc}"></div>`)
        .join('');

      this.tagList = await fetch('/info/tag').then((res) => res.json());
      this.tagList
        .sort((t1, t2) => t1.name.localeCompare(t2.name))
        .forEach((tag) => {
          const input = document.createElement('input');
          input.type = 'checkbox';
          input.id = 'tag' + tag.id;
          input.value = tag.id;
          input.addEventListener('change', (e) => FlayAction.toggleTag(this.flay.opus, e.target.value, e.target.checked));

          const label = document.createElement('label');
          label.setAttribute('for', 'tag' + tag.id);
          label.title = tag.description;
          label.innerHTML = tag.name;

          this.querySelector(`#etc`).append(input, label);
          if (tag.group) document.querySelector('#' + tag.group)?.append(input, label);
        });
    }

    this.querySelectorAll('input').forEach((input) => (input.checked = Array.from(this.flay.video.tags).some((tag) => tag.id === Number(input.value))));

    this.querySelectorAll('label').forEach((label) =>
      label.classList.toggle(
        'candidate',
        [label.textContent, ...label.title.split(',')]
          .filter((keyword) => keyword !== '')
          .map((keyword) => keyword.trim())
          .some((keyword) => (this.flay.title + this.flay.video.comment).includes(keyword))
      )
    );
  }
}

defineCustomElements('flay-tag', FlayTag);
