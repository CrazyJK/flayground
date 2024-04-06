import FlayAction from '../../util/FlayAction';
import Search from '../../util/FlaySearch';
import './FlayComment.scss';
import FlayHTMLElement from './FlayHTMLElement';

const COMMENT = 'Comment';

/**
 * Custom element of Comment
 */
export default class FlayComment extends FlayHTMLElement {
  flay;

  constructor() {
    super();
  }

  connectedCallback() {
    const div = this.wrapper.appendChild(document.createElement('div'));

    this.japanese = div.appendChild(document.createElement('a'));
    this.japanese.title = '번역보기';
    this.japanese.innerHTML = '原語';
    this.japanese.classList.add('japanese');
    this.japanese.addEventListener('click', () => {
      console.log('原語Click', this.flay.video.title, this.flay.video.desc);
      if (this.flay.video.title == null || this.flay.video.title === '') {
        return;
      }
      Search.translate.Papago(this.flay.video.title + ' ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ ' + this.flay.video.desc);
      Search.translate.DeepL(this.flay.video.title + ' ■■■■■■■■■■■■■■■■■■■■■■■ ' + this.flay.video.desc);
    });

    this.comment = div.appendChild(document.createElement('a'));
    this.comment.innerHTML = COMMENT;
    this.comment.addEventListener('click', () => {
      console.log('commentLabelClick', this.flay.opus);
      div.style.display = 'none';
      this.input.style.display = 'block';
      this.input.focus();
    });

    this.input = this.wrapper.appendChild(document.createElement('input'));
    this.input.type = 'text';
    this.input.placeholder = COMMENT;
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
        div.style.display = 'block';
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

    let comment = flay.video.comment === null ? '' : flay.video.comment.trim();
    let blank = comment === '';
    this.comment.title = blank ? COMMENT : comment;
    this.comment.innerHTML = blank ? COMMENT : comment;
    this.comment.classList.toggle('placeholder', blank);
    this.input.value = comment;
    this.japanese.classList.toggle('hide', flay.video.title == null);
  }
}

// Define the new element
customElements.define('flay-comment', FlayComment);
