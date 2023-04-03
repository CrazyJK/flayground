import FlayStorage from '../util/flay.storage';
import SVG from './svg.json';

/**
 *
 */
export default class FlayCondition extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다

    const wrapper = document.createElement('div');
    wrapper.classList.add('condition');

    const style = document.createElement('link');
    style.setAttribute('rel', 'stylesheet');
    style.setAttribute('href', './css/components.css');

    this.shadowRoot.append(style, wrapper); // 생성된 요소들을 shadow DOM에 부착합니다

    // search
    const searchDiv = wrapper.appendChild(document.createElement('div'));
    this.inputSearch = createInput(searchDiv, 1, 'search', '', 'Keyword', 'search');
    addEventListener(this, 'keyup', this.inputSearch);

    // subtitles
    const subtitlesDiv = wrapper.appendChild(document.createElement('div'));
    this.subtitlesCheckbox = createCheckbox(subtitlesDiv, 1, 'withSubtitles', 's', 'with Subtitles', SVG.subtitles);
    addEventListener(this, 'change', this.subtitlesCheckbox);

    // favorite
    const favoriteDiv = wrapper.appendChild(document.createElement('div'));
    this.favoriteCheckbox = createCheckbox(favoriteDiv, 1, 'withFavorite', 's', 'with Favorite', SVG.favorite);
    addEventListener(this, 'change', this.favoriteCheckbox);
    this.noFavoriteCheckbox = createCheckbox(favoriteDiv, 1, 'withNoFavorite', 'n', 'with No Favorite', SVG.noFavorite);
    addEventListener(this, 'change', this.noFavoriteCheckbox);

    // rank
    const rankDiv = wrapper.appendChild(document.createElement('div'));
    this.rankArray = [];
    for (let i = 0; i <= 5; i++) {
      const rankCheckbox = createCheckbox(rankDiv, i, 'rank', i, 'Rank' + i, SVG.rank[i + 1]);
      addEventListener(this, 'change', rankCheckbox);
      this.rankArray.push(rankCheckbox);
    }

    // sort
    const SORT_METHODS = ['STUDIO', 'OPUS', 'TITLE', 'ACTRESS', 'RELEASE', 'PLAY', 'RANK', 'LASTACCESS', 'LASTMODIFIED', 'SCORE', 'LENGTH'];
    const sortDiv = wrapper.appendChild(document.createElement('div'));
    this.sortSelect = createSelect(sortDiv, 0, 'sort', SORT_METHODS, 'Sort method');
    addEventListener(this, 'change', this.sortSelect);

    // initial value
    this.condition = {
      search: '',
      withSubtitles: false,
      withFavorite: false,
      withNoFavorite: false,
      rank: ['0'],
      sort: 'RELEASE',
    };

    this.condition = FlayStorage.local.getObject('FlayCondition.condition', JSON.stringify(this.condition));

    this.subtitlesCheckbox.checked = this.condition.withSubtitles;
    this.favoriteCheckbox.checked = this.condition.withFavorite;
    this.noFavoriteCheckbox.checked = this.condition.withNoFavorite;
    this.condition.rank.forEach((r) => (this.rankArray[r].checked = true));
    this.sortSelect.value = this.condition.sort;
  }

  get() {
    this.condition.search = this.inputSearch.value;
    this.condition.withSubtitles = this.subtitlesCheckbox.checked;
    this.condition.withFavorite = this.favoriteCheckbox.checked;
    this.condition.withNoFavorite = this.noFavoriteCheckbox.checked;
    this.condition.rank = this.rankArray.filter((rank) => rank.checked).map((rank) => rank.value);
    this.condition.sort = this.sortSelect.value;

    FlayStorage.local.set('FlayCondition.condition', JSON.stringify(this.condition));

    return this.condition;
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
    option.innerHTML = value;
  });

  return select;
}

function dispatchEvent(THIS) {
  THIS.dispatchEvent(new CustomEvent('change', { detail: THIS.get(), cancelable: true, composed: false, bubbles: false }));
}

function addEventListener(THIS, type, element) {
  if (type === 'keyup') {
    element.addEventListener(type, (e) => {
      e.stopPropagation();
      if (e.code === 'Enter' || e.code === 'NumpadEnter') {
        dispatchEvent(THIS);
      }
    });
  } else if (type === 'change') {
    element.addEventListener(type, (e) => {
      dispatchEvent(THIS);
    });
  } else {
    element.addEventListener(type, (e) => {
      console.error('unknown event', type);
    });
  }
}
