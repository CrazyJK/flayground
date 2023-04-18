import FlayAction from '../../util/flay.action';

const COMMENT = 'Comment';

/**
 *
 */
export default class FlayComment extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다

    this.flay = null;
    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('comment');

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
      let url = 'https://papago.naver.com/?sk=auto&tk=ko&st=' + this.flay.video.title + ' ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ ' + this.flay.video.desc;
      window.open(url, 'translateByPapago', 'width=1000px,height=500px');
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
