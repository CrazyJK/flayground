/**
 *
 */
export default class FlayTag extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다

    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('tag');

    this.tagInputElementArray = [];
    this.opus = null;

    fetch('/info/tag/list')
      .then((res) => res.json())
      .then((tagList) => {
        Array.from(tagList)
          .sort((t1, t2) => {
            return t1.name.localeCompare(t2.name);
          })
          .forEach((tag) => {
            const tagInputElement = this.wrapper.appendChild(document.createElement('input'));
            tagInputElement.setAttribute('type', 'checkbox');
            tagInputElement.setAttribute('name', 'tag');
            tagInputElement.setAttribute('id', 'tag' + tag.id);
            tagInputElement.setAttribute('value', tag.id);
            tagInputElement.addEventListener('change', (e) => {
              console.log('tagChange', this.opus, e.target.value, e.target.checked);
            });

            const label = this.wrapper.appendChild(document.createElement('label'));
            label.setAttribute('title', tag.name + '\n' + tag.description);
            label.setAttribute('for', 'tag' + tag.id);
            label.textContent = tag.name;

            this.tagInputElementArray.push(tagInputElement);
          });
      });

    const style = document.createElement('link');
    style.setAttribute('rel', 'stylesheet');
    style.setAttribute('href', './css/components.css');

    this.shadowRoot.append(style, this.wrapper); // 생성된 요소들을 shadow DOM에 부착합니다
  }

  /**
   *
   * @param {Flay} flay
   */
  set(flay) {
    this.opus = flay.opus;
    this.wrapper.setAttribute('data-opus', flay.opus);

    this.tagInputElementArray.forEach((input) => {
      let id = input.getAttribute('value');
      let foundTags = Array.from(flay.video.tags).filter((tag) => tag.id === Number(id));
      if (foundTags.length > 0) {
        input.checked = true;
      } else {
        input.checked = false;
      }
    });
  }
}

// Define the new element
customElements.define('flay-tag', FlayTag);
