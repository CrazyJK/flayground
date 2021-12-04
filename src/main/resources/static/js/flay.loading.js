/**
 * loading view class
 */
class Loading {
	constructor() {
		const PARENT_SELECTOR = 'body > footer';
		const ID_LOADING_WRAPPER = 'loading-wrapper';
		const ID_LOADING = 'loading';
		const ID_LOADING_BODY = 'loading_body';
		const HTML_LOADING = `
			<div id="${ID_LOADING_WRAPPER}">
				<div id="${ID_LOADING}" style="position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); cursor: wait; display: none; z-index: 9999; flex-direction: column; align-content: center; justify-content: center; align-items: center;">
					<ol id="${ID_LOADING_BODY}" style="position: inherit; display: flex; flex-direction: column; color: white; font-size: 2rem; margin: 0;"></ol>
				</div>
			</div>`;

		this.parentSelector = PARENT_SELECTOR;
		this.loadingWrapperSelector = `${PARENT_SELECTOR} > #${ID_LOADING_WRAPPER}`;
		this.loadingSelector = `${PARENT_SELECTOR} > #${ID_LOADING_WRAPPER} > #${ID_LOADING}`;
		this.loadingBodySelector = `${PARENT_SELECTOR} > #${ID_LOADING_WRAPPER} > #${ID_LOADING} > #${ID_LOADING_BODY}`;

		if (document.querySelector(this.loadingWrapperSelector) === null) {
			document.querySelector(this.parentSelector).innerHTML += HTML_LOADING;
		}

		this.loadingIndex = 0;
		this.loading = document.querySelector(this.loadingSelector);
		this.loadingBody = document.querySelector(this.loadingBodySelector);

		// click event for close
		this.loading.addEventListener('click', () => {
			this.loading.style.display = 'none';
		});
	}

	on(message) {
		return this.show(`<li id="loadingMessage${++this.loadingIndex}">${message}</li>`);
	}

	error(message) {
		return this.show(`<li id="loadingMessage${++this.loadingIndex}" style="color: #f00;">${message}</li>`);
	}

	show(messageHtml) {
		this.loading.style.display = 'flex';
		this.loadingBody.innerHTML += messageHtml;
		return this.loadingIndex;
	}

	off(index) {
		const loadingMessage = document.querySelector(`${this.loadingBodySelector} > li#loadingMessage${index}`);
		if (loadingMessage !== null) {
			loadingMessage.remove();
		}
		if (document.querySelectorAll(`${this.loadingBodySelector} > li`).length == 0) {
			this.loading.style.display = 'none';
		}
	}
}

const loading = new Loading();
