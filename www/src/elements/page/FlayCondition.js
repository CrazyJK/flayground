import FlayStorage from '../../util/flay.storage';
import SVG from '../svg.json';

export default class FlayCondition extends HTMLElement {
  condition = {
    search: '',
    withSubtitles: false,
    withFavorite: false,
    withNoFavorite: false,
    rank: ['0'],
    sort: 'RELEASE',
  };

  constructor() {
    super();
    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다

    const LINK = document.createElement('link');
    LINK.setAttribute('rel', 'stylesheet');
    LINK.setAttribute('href', './css/4.components.css');
    const STYLE = document.createElement('style');
    STYLE.innerHTML = CSS;
    const WRAPPER = document.createElement('div');
    WRAPPER.classList.add('condition');
    this.shadowRoot.append(LINK, STYLE, WRAPPER); // 생성된 요소들을 shadow DOM에 부착합니다

    this.render(WRAPPER);
  }

  render(wrapper) {
    // search
    const SEARCH_DIV = wrapper.appendChild(document.createElement('div'));
    this.INPUT_SEARCH = createInput(SEARCH_DIV, 1, 'search', '', 'Keyword', 'search');
    addEventListener(this, 'keyup', this.INPUT_SEARCH);

    // subtitles
    const SUBTITLES_DIV = wrapper.appendChild(document.createElement('div'));
    this.SUBTITLES_CHECKBOX = createCheckbox(SUBTITLES_DIV, 1, 'withSubtitles', 's', 'with Subtitles', SVG.subtitles);
    addEventListener(this, 'change', this.SUBTITLES_CHECKBOX);

    // favorite
    const FAVORITE_DIV = wrapper.appendChild(document.createElement('div'));
    this.FAVORITE_CHECKBOX = createCheckbox(FAVORITE_DIV, 1, 'withFavorite', 's', 'with Favorite', SVG.favorite);
    addEventListener(this, 'change', this.FAVORITE_CHECKBOX);
    this.NO_FAVORITE_CHECKBOX = createCheckbox(FAVORITE_DIV, 1, 'withNoFavorite', 'n', 'with No Favorite', SVG.noFavorite);
    addEventListener(this, 'change', this.NO_FAVORITE_CHECKBOX);

    // rank
    const RANK_DIV = wrapper.appendChild(document.createElement('div'));
    this.RANK_CHECKBOX_ARRAY = [];
    for (let i = 0; i <= 5; i++) {
      const RANK_CHECKBOX = createCheckbox(RANK_DIV, i, 'rank', i, 'Rank' + i, SVG.rank[i + 1]);
      addEventListener(this, 'change', RANK_CHECKBOX);
      this.RANK_CHECKBOX_ARRAY.push(RANK_CHECKBOX);
    }

    // sort
    const SORT_METHODS = ['STUDIO', 'OPUS', 'TITLE', 'ACTRESS', 'RELEASE', 'PLAY', 'RANK', 'LASTPLAY', 'LASTACCESS', 'LASTMODIFIED', 'SCORE', 'LENGTH'];
    const SORT_DIV = wrapper.appendChild(document.createElement('div'));
    this.SORT_SELECT = createSelect(SORT_DIV, 0, 'sort', SORT_METHODS, 'Sort method');
    addEventListener(this, 'change', this.SORT_SELECT);
  }

  connectedCallback() {
    this.condition = FlayStorage.local.getObject('FlayCondition.condition', JSON.stringify(this.condition));

    this.SUBTITLES_CHECKBOX.checked = this.condition.withSubtitles;
    this.FAVORITE_CHECKBOX.checked = this.condition.withFavorite;
    this.NO_FAVORITE_CHECKBOX.checked = this.condition.withNoFavorite;
    this.condition.rank.forEach((r) => (this.RANK_CHECKBOX_ARRAY[r].checked = true));
    this.SORT_SELECT.value = this.condition.sort;

    // fetch start
    this.fetch();
  }

  /**
   *
   * @returns 검색 조건 객체
   */
  getCondition() {
    this.condition = {
      search: this.INPUT_SEARCH.value,
      withSubtitles: this.SUBTITLES_CHECKBOX.checked,
      withFavorite: this.FAVORITE_CHECKBOX.checked,
      withNoFavorite: this.NO_FAVORITE_CHECKBOX.checked,
      rank: this.RANK_CHECKBOX_ARRAY.filter((rank) => rank.checked).map((rank) => rank.value),
      sort: this.SORT_SELECT.value,
    };
    FlayStorage.local.set('FlayCondition.condition', JSON.stringify(this.condition));
    return this.condition;
  }

  /**
   * 조건에 맞는 opus 목록
   */
  fetch() {
    fetch('/flay/list/opus', { method: 'post', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(this.getCondition()) })
      .then((res) => res.json())
      .then((list) => {
        this.dispatchEvent(
          new CustomEvent('change', {
            detail: { list: list },
          })
        );
      });
  }
}

// Define the new element
customElements.define('flay-condition', FlayCondition);

function createInput(parent, index, name, value, placeholder, type) {
  const input = parent.appendChild(document.createElement('input'));
  input.type = type;
  input.id = name + index;
  input.name = name;
  input.value = value;
  input.placeholder = placeholder;
  input.setAttribute('spellcheck', false);

  return input;
}

function createCheckbox(parent, index, name, value, title, html) {
  const checkbox = parent.appendChild(document.createElement('input'));
  checkbox.setAttribute('type', 'checkbox');
  checkbox.setAttribute('name', name);
  checkbox.setAttribute('value', value);
  checkbox.setAttribute('id', name + index);

  const label = parent.appendChild(document.createElement('label'));
  label.setAttribute('for', name + index);
  label.setAttribute('title', title);
  label.innerHTML = html;

  return checkbox;
}

function createSelect(parent, index, name, values, title) {
  const select = parent.appendChild(document.createElement('select'));
  select.id = name + index;
  select.name = name;
  select.title = title;
  values.forEach((value) => {
    const option = select.appendChild(document.createElement('option'));
    option.value = value;
    option.innerHTML = value.charAt(0) + value.slice(1).toLowerCase();
  });

  return select;
}

function addEventListener(THIS, type, element) {
  if (type === 'keyup') {
    element.addEventListener(type, (e) => {
      e.stopPropagation();
      if (e.code === 'Enter' || e.code === 'NumpadEnter') {
        e.target.value = e.target.value.trim();
        THIS.fetch();
      }
    });
  } else if (type === 'change') {
    element.addEventListener(type, (e) => {
      THIS.fetch();
    });
  } else {
    element.addEventListener(type, (e) => {
      console.error('unknown event', type);
    });
  }
}

const CSS = `
/* for FlayCondition */
div.condition {
  display: flex;
  gap: 1rem;
  justify-content: center;
  align-items: center;
  padding: 0.5rem;
  transition: 0.4s;
}
div.condition > div > label {
  margin: 0 0.25rem;
}
div.condition > div > select {
  font-size: var(--font-normal);
  outline: none;
}
div.condition > div > select > option {
  font-size: var(--font-small);
}
`;
