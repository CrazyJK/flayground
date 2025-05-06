import FlayAction from '@lib/FlayAction';
import FlaySearch from '@lib/FlaySearch';
import StringUtils from '@lib/StringUtils';
import './FlayComment.scss';
import FlayHTMLElement, { defineCustomElements } from './FlayHTMLElement';

const COMMENT = 'Comment';

/**
 * Custom element of Comment
 */
export default class FlayComment extends FlayHTMLElement {
  constructor() {
    super();

    this.innerHTML = `
      <div>
        <a class="japanese" title="번역보기">原語</a>
        <a class="comment">${COMMENT}</a>
      </div>
      <input type="text" placeholder="${COMMENT}" style="display: none;">
    `;

    const japanese = this.querySelector('.japanese');
    const comment = this.querySelector('.comment');
    const input = this.querySelector('input');

    japanese.addEventListener('click', () => {
      if (StringUtils.isBlank(this.flay.video.title)) return;

      FlaySearch.translate.Papago(this.flay.video.title + ' ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ ' + this.flay.video.desc);
      FlaySearch.translate.DeepL(this.flay.video.title + ' ■■■■■■■■■■■■■■■■■■■■■■■ ' + this.flay.video.desc);
    });

    comment.addEventListener('click', () => {
      comment.parentElement.style.display = 'none';
      input.style.display = 'block';
      input.focus();
    });

    input.addEventListener('keyup', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.code !== 'Enter' && e.code !== 'NumpadEnter') return;

      console.log('commentInputKeyup', this.flay.opus, '[' + input.value + ']');
      FlayAction.setComment(this.flay.opus, input.value, () => {
        comment.innerHTML = input.value;
        comment.parentElement.style.display = 'block';
        input.style.display = 'none';
      });
    });
  }

  connectedCallback() {
    this.classList.add('flay-comment');
  }

  /**
   *
   * @param {Flay} flay
   */
  set(flay) {
    this.setFlay(flay);

    const comment = StringUtils.toBlank(flay.video.comment, COMMENT);

    this.querySelector('input').value = comment;
    this.querySelector('.comment').title = comment;
    this.querySelector('.comment').innerHTML = comment;
    this.querySelector('.comment').classList.toggle('placeholder', StringUtils.isBlank(flay.video.comment));
    this.querySelector('.japanese').classList.toggle('hide', StringUtils.isBlank(flay.video.title));
  }
}

defineCustomElements('flay-comment', FlayComment);
