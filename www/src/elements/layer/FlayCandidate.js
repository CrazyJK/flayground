import flayAction from '../../util/flay.action';

/**
 *
 */
export default class FlayCandidate extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다
    const LINK = document.createElement('link');
    LINK.setAttribute('rel', 'stylesheet');
    LINK.setAttribute('href', './css/components.css');
    const STYLE = document.createElement('style');
    STYLE.innerHTML = CSS;
    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('candidate');
    this.shadowRoot.append(LINK, STYLE, this.wrapper); // 생성된 요소들을 shadow DOM에 부착합니다

    this.wrapper.innerHTML = HTML;

    const BUTTON = this.shadowRoot.querySelector('#getCadidate');
    const BADGE = this.shadowRoot.querySelector('#candidateLength');
    const LIST = this.shadowRoot.querySelector('#candidatesFlay');

    BUTTON.addEventListener('click', () => {
      fetch('/flay/candidates')
        .then((res) => res.json())
        .then((list) => {
          console.log('cadidate', list);
          BADGE.innerHTML = list.length;
          list.forEach((flay) => {
            const ITEM = LIST.appendChild(document.createElement('li'));
            const BTN = ITEM.appendChild(document.createElement('button'));
            BTN.innerHTML = flay.files.candidate.join('\n');
            BTN.addEventListener('click', () => {
              console.log('accept', flay.files.candidate);
              flayAction.acceptCandidates(flay.opus, () => {
                DIV.remove();
                LIST.insertBefore(ITEM, null);
              });
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

const HTML = `
  <button id="getCadidate">Candidate <i class="badge" id="candidateLength">0</i></button>
  <ol id="candidatesFlay"></ol>
`;

const CSS = `
div.candidate {
  width: 800px;
  height: 100%;
}

div.candidate ol {
  display: flex;
  flex-direction: column;
  list-style: none;
  padding: 1rem;
  gap: 1rem;
  height: calc(100% - 5rem);
  overflow: auto;
}
div.candidate ol li {
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  padding: 0.5rem;
  box-shadow: var(--box-shadow);
}
div.candidate ol li div {
  aspect-ratio: 400 / 269;
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
  text-align: left;
  font: 700 1rem D2Coding;
  padding: 0.25rem;
}

div.candidate img {
  width: 100%;
  aspect-ratio: 400 / 269;
}
`;
