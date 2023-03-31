/**
 *
 */
export default class FlayFiles extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다

    this.flay = null;
    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('files');

    this.playElement = this.wrapper.appendChild(document.createElement('button'));
    this.playElement.addEventListener('click', (e) => {
      console.log('playClick', this.flay.opus);
      fetch('/flay/play/' + this.flay.opus, { method: 'PATCH' })
        .then((res) => res.text())
        .then((text) => {
          console.log('played', text);
        });
    });

    this.subtitlesElement = this.wrapper.appendChild(document.createElement('button'));
    this.subtitlesElement.addEventListener('click', (e) => {
      console.log('subtitlesClick', this.flay.opus);
    });

    this.filesElement = this.wrapper.appendChild(document.createElement('button'));
    this.filesElement.setAttribute('title', 'show files');
    this.filesElement.textContent = 'files';
    this.filesElement.addEventListener('click', () => {
      this.fileListElement.classList.toggle('show');
    });

    this.fileListElement = this.wrapper.appendChild(document.createElement('ol'));
    this.fileListElement.classList.add('files');
    this.fileListElement.addEventListener('click', (e) => {
      console.log('filesClick', this.flay.opus, e.target);
    });

    const style = document.createElement('link');
    style.setAttribute('rel', 'stylesheet');
    style.setAttribute('href', './css/components.css');

    this.shadowRoot.append(style, this.wrapper, this.fileListElement); // 생성된 요소들을 shadow DOM에 부착합니다
  }

  /**
   *
   * @param {Flay} flay
   */
  set(flay) {
    this.flay = flay;

    let movieSize = flay.files.movie.length;
    let subtitlesSize = flay.files.subtitles.length;

    this.wrapper.setAttribute('data-opus', flay.opus);

    this.playElement.setAttribute('title', movieSize + ' Movie');
    this.playElement.textContent = movieSize ? (movieSize > 1 ? movieSize + ' ' : '') + 'Movie' : 'noMovie';

    this.subtitlesElement.setAttribute('title', subtitlesSize + ' Subtitles');
    this.subtitlesElement.textContent = subtitlesSize ? (subtitlesSize > 1 ? subtitlesSize + ' ' : '') + 'Sub' : 'noSub';

    this.filesElement.innerHTML = getPrettyFilesize(flay.length) + ' files';

    this.fileListElement.textContent = null;

    Array.from(flay.files.cover).forEach((path) => {
      const fileElement = this.fileListElement.appendChild(document.createElement('li'));
      fileElement.textContent = path;
    });

    Array.from(flay.files.movie).forEach((path) => {
      const fileElement = this.fileListElement.appendChild(document.createElement('li'));
      fileElement.textContent = path;
    });

    Array.from(flay.files.subtitles).forEach((path) => {
      const fileElement = this.fileListElement.appendChild(document.createElement('li'));
      fileElement.textContent = path;
    });
  }
}

// Define the new element
customElements.define('flay-files', FlayFiles);

function getPrettyFilesize(length) {
  const KB = 1024;
  const MB = KB * 1024;
  const GB = MB * 1024;
  if (length > GB) {
    return (length / GB).toFixed(1) + '<small>GB</small>';
  } else if (length > MB) {
    return (length / MB).toFixed(0) + '<small>MB</small>';
  } else {
    return (length / KB).toFixed(0) + '<small>KB</small>';
  }
}
