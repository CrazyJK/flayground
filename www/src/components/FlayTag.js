/**
 *
 */
export default class FlayTag extends HTMLElement {
  /**
   *
   * @param {Tag[]} tagList
   */
  constructor(tagList) {
    super();

    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다

    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('tag');

    this.tagInputElementArray = [];

    Array.from(tagList).forEach((tag) => {
      const tagInputElement = this.wrapper.appendChild(document.createElement('input'));
      tagInputElement.setAttribute('type', 'checkbox');
      tagInputElement.setAttribute('name', 'tag');
      tagInputElement.setAttribute('id', 'tag' + tag.id);

      const label = this.wrapper.appendChild(document.createElement('label'));
      label.setAttribute('title', tag.name + '\n' + tag.description);
      label.setAttribute('for', 'tag' + tag.id);
      label.textContent = tag.name;

      this.tagInputElementArray.push(tagInputElement);
    });

    const style = document.createElement('link');
    style.setAttribute('rel', 'stylesheet');
    style.setAttribute('href', './css/components.css');

    this.shadowRoot.append(style, this.wrapper); // 생성된 요소들을 shadow DOM에 부착합니다
  }

  /**
   *
   * @param {Tag[]} tags
   * @param {String} opus
   */
  set(tags, opus) {
    this.wrapper.setAttribute('data-opus', opus);

    this.tagInputElementArray.forEach((input) => {
      let id = input.getAttribute('id');
      let foundTags = Array.from(tags).filter((tag) => 'tag' + tag.id === id);
      if (foundTags.length > 0) {
        input.setAttribute('checked', true);
      } else {
        input.removeAttribute('checked');
      }
    });
  }
}

// Define the new element
customElements.define('flay-tag', FlayTag);
