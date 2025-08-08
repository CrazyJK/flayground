import FlayArticle from '@flay/domain/FlayArticle';
import FlayAction from '@lib/FlayAction';
import FlayFetch from '@lib/FlayFetch';
import './FlayCandidate.scss';

/**
 * accept candidate
 */
export default class FlayCandidate extends HTMLElement {
  constructor() {
    super();

    this.classList.add('flay-candidate', 'flay-div');
    this.innerHTML = `
      <div>
        <button id="getCadidate"><span id="candidateLength">0</span> Candidates</button>
      </div>
      <ol id="candidatesFlay"></ol>
    `;
  }

  connectedCallback() {
    this.querySelector('#getCadidate').addEventListener('click', () => {
      FlayFetch.getFlayCandidates().then((list) => {
        this.querySelector('#candidateLength').innerHTML = list.length;

        const LIST = this.querySelector('#candidatesFlay');
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

          const flayArticle = ITEM.appendChild(new FlayArticle({ mode: 'card' }));
          flayArticle.set(flay);
        });
      });
    });
  }
}

customElements.define('flay-candidate', FlayCandidate);
