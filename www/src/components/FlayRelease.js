/**
 *
 */
export default class FlayRelease extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다

    this.flay = null;
    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('release');

    this.releaseLabel = this.wrapper.appendChild(document.createElement('label'));
    this.lastModifiedLabel = this.wrapper.appendChild(document.createElement('label'));
    this.lastModifiedLabel.classList.add('modified-label');
    this.lastAccessLabel = this.wrapper.appendChild(document.createElement('label'));
    this.lastAccessLabel.classList.add('access-label');
    this.lastPlayLabel = this.wrapper.appendChild(document.createElement('label'));
    this.lastPlayLabel.classList.add('played-label');

    const style = document.createElement('link');
    style.setAttribute('rel', 'stylesheet');
    style.setAttribute('href', './css/components.css');

    this.shadowRoot.append(style, this.wrapper); // 생성된 요소들을 shadow DOM에 부착합니다
  }

  /**
   *
   * @param {Flay} flay
   */
  set(flay) {
    this.flay = flay;
    this.wrapper.classList.toggle('archive', this.flay.archive);
    this.wrapper.setAttribute('data-opus', flay.opus);

    this.releaseLabel.textContent = flay.release;
    this.lastModifiedLabel.innerHTML = '<small>' + dateFormat(flay.lastModified) + '<i class="badge">mod</i></small>';
    this.lastAccessLabel.innerHTML = '<small>' + dateFormat(flay.video.lastAccess) + '<i class="badge">acc</i></small>';
    this.lastPlayLabel.innerHTML = '<small>' + dateFormat(flay.video.lastPlay) + '<i class="badge">play</i></small>';

    let domRect = this.wrapper.getBoundingClientRect();
    this.wrapper.classList.toggle('small', domRect.width < 600);
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
