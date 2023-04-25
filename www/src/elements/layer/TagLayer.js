export default class TagLayer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다
    const wrapper = document.createElement('div');
    wrapper.classList.add('tag-layer');
    const style = document.createElement('style');
    style.innerHTML = CSS;
    const link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', './css/components.css');
    this.shadowRoot.append(style, link, wrapper); // 생성된 요소들을 shadow DOM에 부착합니다

    const HEADER_DIV = wrapper.appendChild(document.createElement('div'));
    const MAIN_DIV = wrapper.appendChild(document.createElement('div'));

    // header
    const TAG_NAME = HEADER_DIV.appendChild(document.createElement('input'));
    TAG_NAME.type = 'text';
    TAG_NAME.placeholder = 'Tag name';
    const TAG_DESC = HEADER_DIV.appendChild(document.createElement('input'));
    TAG_DESC.type = 'text';
    TAG_DESC.placeholder = 'Description...';
    const TAG_BUTTON = HEADER_DIV.appendChild(document.createElement('button'));
    TAG_BUTTON.textContent = 'Apply';

    // list
    const LIST_DIV = MAIN_DIV.appendChild(document.createElement('ol'));
    fetch('/info/tag/list')
      .then((res) => res.json())
      .then((tagList) => {
        Array.from(tagList).forEach((tag) => {
          let tagLi = LIST_DIV.appendChild(document.createElement('li'));
          tagLi.dataset.id = tag.id;
          let tagName = tagLi.appendChild(document.createElement('label'));
          tagName.innerHTML = tag.name;
          let tagDesc = tagLi.appendChild(document.createElement('label'));
          tagDesc.innerHTML = tag.description;
        });
      });
  }
}

// Define the new element
customElements.define('tag-layer', TagLayer);
