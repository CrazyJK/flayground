import FlayAction from '@lib/FlayAction';
import FlayFetch, { Flay } from '@lib/FlayFetch';
import FlayHTMLElement, { defineCustomElements } from './FlayHTMLElement';
import './FlayTag.scss';

/**
 * Custom element of Tag
 */
export default class FlayTag extends FlayHTMLElement {
  #rendered = false;

  constructor() {
    super();
  }

  connectedCallback() {
    this.addEventListener('wheel', (e) => e.stopPropagation(), { passive: true });
  }

  /**
   *
   * @param flay
   * @param reload
   */
  set(flay: Flay, reload: boolean = false): void {
    this.setFlay(flay);

    this.#displayTag(reload);
  }

  async #renderTag(): Promise<void> {
    const tagGroupList = await FlayFetch.getTagGroups();
    this.innerHTML = tagGroupList.map(({ id, name, desc }) => `<div class="tag-list" id="${id}" title="${name} ${desc}"></div>`).join('');

    const tagList = await FlayFetch.getTags();
    tagList
      .sort((t1, t2) => t1.name.localeCompare(t2.name))
      .forEach((tag) => {
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = 'tag' + tag.id;
        input.value = String(tag.id);
        input.addEventListener('change', (e) => {
          const target = e.target as HTMLInputElement;
          FlayAction.toggleTag(this.flay.opus, parseInt(target.value), target.checked);
        });

        const label = document.createElement('label');
        label.setAttribute('for', 'tag' + tag.id);
        label.title = tag.description;
        label.innerHTML = tag.name;

        this.querySelector(`#etc`).append(input, label);
        if (tag.group) this.querySelector('#' + tag.group)?.append(input, label);
      });
  }

  async #displayTag(reload: boolean = false): Promise<void> {
    if (!this.#rendered || reload) {
      await this.#renderTag();
      this.#rendered = true;
    }

    this.querySelectorAll('input').forEach((input) => {
      input.checked = Array.from(this.flay.video.tags).some((tag) => tag.id === Number(input.value));
    });

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
