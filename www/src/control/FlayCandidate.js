import FlayArticle from '../flay/FlayArticle';
import FlayAction from '../util/FlayAction';
import './FlayCandidate.scss';

/**
 * accept candidate
 */
export default class FlayCandidate extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.attachShadow({ mode: 'open' });

    const link = this.shadowRoot.appendChild(document.createElement('link'));
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = 'style.css';

    const wrapper = this.shadowRoot.appendChild(document.createElement('div'));
    wrapper.classList.add(this.tagName.toLowerCase());
    wrapper.innerHTML = `
      <div>
        <button id="getCadidate"><span id="candidateLength">0</span> Candidates</button>
      </div>
      <ol id="candidatesFlay"></ol>
    `;

    wrapper.querySelector('#getCadidate').addEventListener('click', () => {
      fetch('/flay/candidates')
        .then((res) => res.json())
        .then((list) => {
          wrapper.querySelector('#candidateLength').innerHTML = list.length;

          const LIST = wrapper.querySelector('#candidatesFlay');
          LIST.textContent = null;
          list.forEach((flay) => {
            const ITEM = LIST.appendChild(document.createElement('li'));
            const BTN = ITEM.appendChild(document.createElement('button'));
            BTN.innerHTML = flay.files.candidate.join('<br>');
            BTN.addEventListener(
              'click',
              () => {
                FlayAction.acceptCandidates(flay.opus, () => {
                  console.log('accept', flay.files.candidate);
                  flayArticle.remove();
                  LIST.insertBefore(ITEM, null);
                });
              },
              { once: true }
            );

            const flayArticle = ITEM.appendChild(new FlayArticle({ card: true }));
            flayArticle.set(flay);
          });
        });
    });
  }
}

customElements.define('flay-candidate', FlayCandidate);
