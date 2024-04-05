import FlayAction from '../util/FlayAction';

const HTML = `
  <div>
    <button id="getCadidate">Candidate <i id="candidateLength">0</i></button>
  </div>
  <ol id="candidatesFlay"></ol>
`;

const CSS = `
div.flay-candidate {
  display: grid;
  grid-template-rows: 3rem 1fr;
  height: 100%;
}
div.flay-candidate > div {
  display: flex;
  justify-content: center;
}
div.flay-candidate ol {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  list-style: none;
  padding: 1rem;
  margin: 0;

  overflow: auto;
}
div.flay-candidate ol li {
  border-radius: 0.5rem;
  padding: 0.5rem;
  transition: 0.2s;

}
div.flay-candidate ol li:hover {
  background-color: var(--color-bg-hover);
}
div.flay-candidate ol li div {
  aspect-ratio: 400 / 269;
  background: no-repeat center / contain;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 0.25rem;
}
div.flay-candidate ol li div label {
  background-color: var(--color-bg);
  color: var(--color-text);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 1rem;
}
div.flay-candidate ol li button {
  font: 700 1rem D2Coding;
  padding: 0.25rem 0.5rem;
  margin-bottom: 0.5rem;
  border-radius: 0.25rem;
  transition: 0.2s;
}
div.flay-candidate ol li button:hover {
  background-color: var(--color-bg-hover);
}
`;

/**
 *
 */
export default class FlayCandidate extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.tyoe = 'text/css';
    link.href = 'style/component.css';

    const style = document.createElement('style');
    style.innerHTML = CSS;

    const wrapper = document.createElement('div');
    wrapper.classList.add(this.tagName.toLowerCase());
    wrapper.innerHTML = HTML;

    this.shadowRoot.append(link, style, wrapper); // 생성된 요소들을 shadow DOM에 부착합니다

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
            BTN.addEventListener(
              'click',
              () => {
                FlayAction.acceptCandidates(flay.opus, () => {
                  console.log('accept', flay.files.candidate);
                  DIV.remove();
                  LIST.insertBefore(ITEM, null);
                });
              },
              { once: true }
            );
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
