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

    // files
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
    const existsMovie = flay.files.movie.length;
    const existsSubtitles = flay.files.subtitles.length;

    this.wrapper.setAttribute('data-opus', flay.opus);

    this.playElement.setAttribute('title', existsMovie ? 'Movie' : 'no Movie');
    this.playElement.textContent = existsMovie ? 'Movie' : 'noMovie';

    this.subtitlesElement.setAttribute('title', existsSubtitles ? 'Subtitles' : 'no Subtitles');
    this.subtitlesElement.textContent = existsSubtitles ? 'Subtitles' : 'noSub';

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
