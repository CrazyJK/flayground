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
      this.innerHTML = Object.entries(tagGroup)
        .map(([key, info]) => `<div class="tag-list" id="${key}" title="${info.name} ${info.desc}"></div>`)
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
          Object.entries(tagGroup).forEach(([key, info]) => {
            if (info.ids.includes(tag.id)) {
              this.querySelector('#' + key).append(input, label);
              return;
            }
          });
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

export const tagGroup = {
  grade: {
    name: '예비 랭크',
    desc: '',
    ids: [50, 63, 64, 65, 66],
  },
  screen: {
    name: '영상정보',
    desc: '',
    ids: [104, 161, 101, 18, 72],
  },
  actress: {
    name: '여배우',
    desc: '역활',
    ids: [23, 45, 5, 32, 95, 83, 105, 78, 155, 92, 74, 127, 147, 11, 17, 53, 105, 8, 145],
  },
  costume: {
    name: '여배우 복장',
    desc: '',
    ids: [39, 59, 21, 24, 22, 114],
  },
  impressive: {
    name: '인상적인 장면',
    desc: '',
    ids: [112, 156, 159, 122, 139, 77, 118, 15, 110],
  },
  atmosphere: {
    name: '연기 분위기',
    desc: '어떤 분위기로 하는가',
    ids: [73, 141, 68, 36, 69, 99, 102, 57, 146],
  },
  situation: {
    name: '상황',
    desc: 'NTR',
    ids: [87, 103, 106, 107, 16, 100, 151, 27, 135, 58, 108, 7, 97, 123, 117, 80, 157, 152, 61, 44, 128, 144, 54, 46, 132, 47, 13, 55, 149, 25, 120, 134, 98, 165],
  },
  place: {
    name: '장소',
    desc: '어디서 하나',
    ids: [30, 75, 164, 1, 143, 162, 163, 85, 56, 115, 138, 12, 109, 19, 20, 96, 6, 71, 140, 35, 3, 79, 153],
  },
  actor: {
    name: '남배우',
    desc: '역활',
    ids: [154, 94, 142, 121, 130, 111, 116, 137, 148],
  },
  number: {
    name: '출연자 수',
    desc: '',
    ids: [86, 91, 89, 88, 136, 158, 31, 133],
  },
  etc: {
    name: '기타',
    desc: '',
    ids: [],
  },
};
