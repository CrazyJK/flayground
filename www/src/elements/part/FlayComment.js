import FlayAction from '../../util/flay.action';
import Search from '../../util/Search';

const COMMENT = 'Comment';

/**
 *
 */
export default class FlayComment extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다
    const LINK = document.createElement('link');
    LINK.setAttribute('rel', 'stylesheet');
    LINK.setAttribute('href', './css/4.components.css');
    const STYLE = document.createElement('style');
    STYLE.innerHTML = CSS;
    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('comment');
    this.shadowRoot.append(LINK, STYLE, this.wrapper); // 생성된 요소들을 shadow DOM에 부착합니다

    this.flay = null;

    this.div = this.wrapper.appendChild(document.createElement('div'));

    this.japanese = this.div.appendChild(document.createElement('a'));
    this.japanese.title = '번역보기';
    this.japanese.innerHTML = '原語';
    this.japanese.style.marginRight = '8px';
    this.japanese.addEventListener('click', () => {
      console.log('原語Click', this.flay.video.title, this.flay.video.desc);
      if (this.flay.video.title == null || this.flay.video.title === '') {
        return;
      }
      Search.translateByPapago(this.flay.video.title + ' ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ ' + this.flay.video.desc);
    });

    this.comment = this.div.appendChild(document.createElement('a'));
    this.comment.innerHTML = COMMENT;
    this.comment.addEventListener('click', () => {
      console.log('commentLabelClick', this.flay.opus);
      this.div.style.display = 'none';
      this.input.style.display = 'block';
      this.input.focus();
    });

    this.input = this.wrapper.appendChild(document.createElement('input'));
    this.input.setAttribute('type', 'text');
    this.input.style.display = 'none';
    this.input.addEventListener('keyup', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.code !== 'Enter' && e.code !== 'NumpadEnter') {
        return;
      }
      console.log('commentInputKeyup', this.flay.opus, '[' + e.target.value + ']');
      FlayAction.setComment(this.flay.opus, e.target.value, () => {
        this.comment.innerHTML = this.input.value;
        this.div.style.display = 'block';
        this.input.style.display = 'none';
      });
    });
  }

  /**
   *
   * @param {Flay} flay
   */
  set(flay) {
    this.flay = flay;
    this.wrapper.classList.toggle('archive', this.flay.archive);
    this.wrapper.setAttribute('data-opus', flay.opus);
    this.wrapper.classList.toggle('small', this.parentElement.classList.contains('small'));

    let comment = flay.video.comment === null ? '' : flay.video.comment.trim();
    let blank = comment === '';
    this.comment.title = blank ? COMMENT : comment;
    this.comment.innerHTML = blank ? COMMENT : comment;
    this.comment.classList.toggle('placeholder', blank);
    this.input.value = comment;
    this.japanese.classList.toggle('disable', flay.video.title == null);
  }
}

// Define the new element
customElements.define('flay-comment', FlayComment);

const CSS = `
/* for FlayComment */
div.comment input {
  position: relative;
  display: block;
  background-color: transparent;
  color: var(--color-text);
  margin: 0;
  border: 0;
  padding: 0.25rem 0;
  width: 100%;
  font-size: var(--font-large);
  text-align: center;
}
div.comment .placeholder {
  color: var(--color-text-placeholder);
}
`;
