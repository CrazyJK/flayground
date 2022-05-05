/**
 * loading view class
 */

class Loading {
  constructor() {
    const PARENT_SELECTOR = 'body > footer';
    const ID_LOADING_WRAPPER = 'loading-wrap';
    const ID_LOADING_MAIN = 'loading-main';
    const ID_LOADING_BODY = 'loading-body';
    const ID_LOADING_MESSAGE_PREFIX = 'loading-message';
    const HTML_LOADING = `
			<div id="${ID_LOADING_WRAPPER}">
				<div id="${ID_LOADING_MAIN}" style="
						position: fixed;
						top: 0;
						left: 0;
						right: 0;
						bottom: 0;
						background: rgba(0, 0, 0, 0.5);
						cursor: wait;
						z-index: 9999;
						display: none;
						flex-direction: column;
						align-content: center;
						justify-content: center;
						align-items: center;">
					<ol id="${ID_LOADING_BODY}" style="
							position: inherit;
							display: flex;
							flex-direction: column;
							color: white;
							font-size: 2rem;
							margin: 0;
							text-shadow: 1px 1px 2px #000;"></ol>
				</div>
			</div>`;

    this.loadingMessageId = 0;
    this.loadingMessageIdPrefix = ID_LOADING_MESSAGE_PREFIX;
    this.loadingMainSelector = `${PARENT_SELECTOR} > #${ID_LOADING_WRAPPER} > #${ID_LOADING_MAIN}`;
    this.loadingBodySelector = `${this.loadingMainSelector} > #${ID_LOADING_BODY}`;

    window.addEventListener('DOMContentLoaded', () => {
      const parentElement = document.querySelector(PARENT_SELECTOR);
      if (parentElement !== null) {
        parentElement.innerHTML += HTML_LOADING;
      } else {
        alert('parent element of loading not found. ' + PARENT_SELECTOR);
        return;
      }

      this.loadingMain = document.querySelector(this.loadingMainSelector);
      this.loadingBody = document.querySelector(this.loadingBodySelector);

      // click event for close
      this.loadingMain.addEventListener('click', () => {
        document.querySelectorAll(`${this.loadingBodySelector} > li`).forEach((node) => node.remove());
        this.loadingMain.style.display = 'none';
      });
    });
  }

  on(message) {
    return this.show(`<li id="${this.loadingMessageIdPrefix}${++this.loadingMessageId}">${message}</li>`);
  }

  append(index, message) {
    const selector = `${this.loadingBodySelector} > li#${this.loadingMessageIdPrefix}${index}`;
    const element = document.querySelector(selector);
    if (element !== null) {
      element.innerHTML += message;
    } else {
      this.on(message);
    }
  }

  update(index, message) {
    const selector = `${this.loadingBodySelector} > li#${this.loadingMessageIdPrefix}${index}`;
    const element = document.querySelector(selector);
    if (element !== null) {
      element.innerHTML = message;
    } else {
      this.on(message);
    }
  }

  error(message) {
    return this.show(`<li id="${this.loadingMessageIdPrefix}${++this.loadingMessageId}" style="color: #f00;">${message}</li>`);
  }

  show(messageHtml) {
    if (this.loadingMain) {
      this.loadingMain.style.display = 'flex';
      this.loadingBody.innerHTML += messageHtml;
      return this.loadingMessageId;
    }
    return -1;
  }

  off(index) {
    if (index > 0) {
      document.querySelector(`${this.loadingBodySelector} > li#${this.loadingMessageIdPrefix}${index}`).remove();

      if (!this.loadingBody.hasChildNodes()) {
        this.loadingMain.style.display = 'none';
      }
    }
  }
}

export let loading = new Loading();
