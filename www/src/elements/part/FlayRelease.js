/**
 *
 */
export default class FlayRelease extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다
    const LINK = document.createElement('link');
    LINK.setAttribute('rel', 'stylesheet');
    LINK.setAttribute('href', './css/4.components.css');
    const STYLE = document.createElement('style');
    STYLE.innerHTML = CSS;
    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('release');
    this.shadowRoot.append(LINK, STYLE, this.wrapper); // 생성된 요소들을 shadow DOM에 부착합니다

    this.flay = null;

    this.releaseLabel = this.wrapper.appendChild(document.createElement('label'));
    this.lastModifiedLabel = this.wrapper.appendChild(document.createElement('label'));
    this.lastModifiedLabel.classList.add('modified-label');
    this.lastAccessLabel = this.wrapper.appendChild(document.createElement('label'));
    this.lastAccessLabel.classList.add('access-label');
    this.lastPlayLabel = this.wrapper.appendChild(document.createElement('label'));
    this.lastPlayLabel.classList.add('played-label');
  }

  /**
   *
   * @param {Flay} flay
   */
  set(flay) {
    this.flay = flay;
    this.wrapper.classList.toggle('archive', this.flay.archive);
    this.wrapper.setAttribute('data-opus', flay.opus);
    this.wrapper.classList.toggle('small', this.parentElement.classList.contains('small'));

    this.releaseLabel.textContent = flay.release;
    this.lastModifiedLabel.innerHTML = flay.lastModified > 0 ? '<small>' + dateFormat(flay.lastModified) + '<i class="badge">mod</i></small>' : '';
    this.lastAccessLabel.innerHTML = flay.video.lastAccess > 0 ? '<small>' + dateFormat(flay.video.lastAccess) + '<i class="badge">acc</i></small>' : '';
    this.lastPlayLabel.innerHTML = flay.video.lastPlay > 0 ? '<small>' + dateFormat(flay.video.lastPlay) + '<i class="badge">play</i></small>' : '';
  }
}

// Define the new element
customElements.define('flay-release', FlayRelease);

function dateFormat(time) {
  const date = new Date(time);
  let year = date.getFullYear();
  let month = date.getMonth() + 1;
  let day = date.getDate();
  return `${year}-${month > 9 ? month : '0' + month}-${day > 9 ? day : '0' + day}`;
}

const CSS = `
/* for FlayRelease */
div.release {
  display: flex;
  gap: 1rem;
  justify-content: center;
  align-items: center;
}
@media screen and (max-width: 600px) {
  .modified-label,
  .access-label,
  .played-label {
    display: none;
  }
}
div.release.small .modified-label,
div.release.small .access-label,
div.release.small .played-label {
  display: none;
}
div.release.small label {
  font-size: var(--font-small);
}
`;
