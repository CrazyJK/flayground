import FlayAction from '../util/FlayAction';

const HTML = `
  <div>
    <button id="getCadidate">Candidate <i class="badge" id="candidateLength">0</i></button>
  </div>
  <div>
    <ol id="candidatesFlay"></ol>
  </div>
`;

const CSS = `
div.candidate {
  display: grid;
  grid-template-rows: 3rem 1fr;
  padding: 1rem;
}
div.candidate div {
  text-align: center;
  overflow: auto;
}
div.candidate ol {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  list-style: none;
  padding: 1rem;
  margin: 0;

  overflow: auto;
}
div.candidate ol li {
  border-radius: 0.5rem;
  padding: 0.5rem;
  transition: 0.2s;

}
div.candidate ol li:hover {
  background-color: var(--color-bg-hover);
}
div.candidate ol li div {
  aspect-ratio: 400 / 269;
  background: no-repeat center / contain;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 0.25rem;
}
div.candidate ol li div label {
  background-color: var(--color-bg);
  color: var(--color-text);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 1rem;
}
div.candidate ol li button {
  font: 700 1rem D2Coding;
  padding: 0.25rem 0.5rem;
  margin-bottom: 0.5rem;
  border-radius: 0.25rem;
  transition: 0.2s;
}
div.candidate ol li button:hover {
  background-color: var(--color-bg-hover);
}
`;

/**
 *
 */
export default class FlayCandidate extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다

    const link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', './css/4.components.css');

    const style = document.createElement('style');
    style.innerHTML = CSS;

    const wrapper = document.createElement('div');
    wrapper.classList.add('candidate');
    wrapper.innerHTML = HTML;

    this.shadowRoot.append(link, style, wrapper); // 생성된 요소들을 shadow DOM에 부착합니다
  }

  connectedCallback() {
    const BUTTON = this.shadowRoot.querySelector('#getCadidate');
    const BADGE = this.shadowRoot.querySelector('#candidateLength');
    const LIST = this.shadowRoot.querySelector('#candidatesFlay');

    BUTTON.addEventListener('click', () => {
      fetch('/flay/candidates')
        .then((res) => res.json())
        .then((list) => {
          console.log('cadidate', list);
          BADGE.innerHTML = list.length;
          LIST.textContent = null;
          list.forEach((flay) => {
            const ITEM = LIST.appendChild(document.createElement('li'));
            const BTN = ITEM.appendChild(document.createElement('button'));
            BTN.innerHTML = flay.files.candidate.join('\n');
            BTN.dataset.accept = 'N';
            BTN.addEventListener('click', () => {
              if (BTN.dataset.accept === 'N') {
                FlayAction.acceptCandidates(flay.opus, () => {
                  console.log('accept', flay.files.candidate);
                  DIV.remove();
                  LIST.insertBefore(ITEM, null);
                  BTN.dataset.accept = 'Y';
                });
              }
            });
            const DIV = ITEM.appendChild(document.createElement('div'));
            DIV.style.backgroundImage = `url(/static/cover/${flay.opus})`;
            DIV.innerHTML = `
              <label>${flay.studio}</label>
              <label>${flay.opus}</label>
              <label>${flay.title}</label>
              <label>${flay.actressList}</label>
              <label>${flay.release}</label>
            `;
          });
        });
    });
  }
}

// Define the new element
customElements.define('flay-candidate', FlayCandidate);
