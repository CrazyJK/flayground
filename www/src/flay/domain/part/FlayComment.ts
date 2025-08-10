import FlayAction from '@lib/FlayAction';
import { Flay } from '@lib/FlayFetch';
import FlaySearch from '@lib/FlaySearch';
import StringUtils from '@lib/StringUtils';
import './FlayComment.scss';
import FlayHTMLElement, { defineCustomElements } from './FlayHTMLElement';

const COMMENT = 'Comment';

/**
 * Custom element of Comment
 */
export default class FlayComment extends FlayHTMLElement {
  #japanese: HTMLAnchorElement;
  #comment: HTMLAnchorElement;
  #input: HTMLInputElement;

  constructor() {
    super();

    this.innerHTML = `
      <div>
        <a class="japanese" title="번역보기">原語</a>
        <a class="comment">${COMMENT}</a>
      </div>
      <input type="text" placeholder="${COMMENT}" style="display: none;">
    `;

    this.#japanese = this.querySelector('.japanese')!;
    this.#comment = this.querySelector('.comment')!;
    this.#input = this.querySelector('input')!;

    this.#japanese.addEventListener('click', () => this.#handleTranslate());
    this.#comment.addEventListener('click', () => this.#handleCommentInput());
    this.#input.addEventListener('keyup', (e) => this.#handlerCommentSave(e));
  }

  connectedCallback() {}

  /**
   *
   * @param flay
   */
  set(flay: Flay): void {
    this.setFlay(flay);

    const comment = StringUtils.toBlank(flay.video.comment, COMMENT);

    this.#input.value = comment;
    this.#comment.title = comment;
    this.#comment.innerHTML = comment;
    this.#comment.classList.toggle('placeholder', StringUtils.isBlank(flay.video.comment));
    this.#japanese.classList.toggle('hide', StringUtils.isBlank(flay.video.title));
  }

  #handleTranslate(): void {
    if (StringUtils.isBlank(this.flay.video.title)) return;
    FlaySearch.translate.Papago(this.flay.video.title + ' ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ ' + this.flay.video.desc);
    FlaySearch.translate.DeepL(this.flay.video.title + ' ■■■■■■■■■■■■■■■■■■■■■■■ ' + this.flay.video.desc);
  }

  #handleCommentInput(): void {
    this.#input.style.display = 'block';
    this.#input.focus();
  }

  #handlerCommentSave(e: KeyboardEvent): void {
    e.preventDefault();
    e.stopPropagation();
    if (e.code !== 'Enter' && e.code !== 'NumpadEnter') return;

    console.log('commentInputKeyup', this.flay.opus, '[' + this.#input.value + ']');
    FlayAction.setComment(this.flay.opus, this.#input.value, () => {
      this.#comment.innerHTML = this.#input.value;
      this.#comment.parentElement!.style.display = 'block';
      this.#input.style.display = 'none';
    }).catch((error: unknown) => {
      console.error('Error setting comment:', error);
    });
  }
}

defineCustomElements('flay-comment', FlayComment);
