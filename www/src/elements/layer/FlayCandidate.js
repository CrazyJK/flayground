import flayAction from '../../util/flay.action';

/**
 *
 */
export default class FlayCandidate extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다
    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('candidate');
    const link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', './css/components.css');
    const link2 = document.createElement('link');
    link2.setAttribute('rel', 'stylesheet');
    link2.setAttribute('href', './css/FlayCandidate.css');
    this.shadowRoot.append(link, link2, this.wrapper); // 생성된 요소들을 shadow DOM에 부착합니다

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
