/**
 *
 */
export default class FlayFiles extends HTMLElement {
  /**
   *
   * @param {Files} title
   * @param {String} opus
   */
  constructor(files, opus) {
    super();

    const existsMovie = files.movie.length;
    const existsSubtitles = files.subtitles.length;

    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다

    const wrapper = document.createElement('div');
    wrapper.setAttribute('data-opus', opus);
    wrapper.classList.add('buttons');

    const playElement = wrapper.appendChild(document.createElement('button'));
    playElement.setAttribute('title', existsMovie ? 'Movie' : 'no Movie');
    playElement.textContent = existsMovie ? 'Movie' : 'noMovie';

    const subtitlesElement = wrapper.appendChild(document.createElement('button'));
    subtitlesElement.setAttribute('title', existsSubtitles ? 'Subtitles' : 'no Subtitles');
    subtitlesElement.textContent = existsSubtitles ? 'Subtitles' : 'noSub';

    const filesElement = wrapper.appendChild(document.createElement('button'));
    filesElement.setAttribute('title', 'show files');
    filesElement.textContent = 'files';

    // files
    const fileListElement = document.createElement('ol');
    fileListElement.classList.add('files');

    Array.from(files.cover).forEach((path) => {
      const fileElement = fileListElement.appendChild(document.createElement('li'));
      fileElement.textContent = path;
    });

    Array.from(files.movie).forEach((path) => {
      const fileElement = fileListElement.appendChild(document.createElement('li'));
      fileElement.textContent = path;
    });

    Array.from(files.subtitles).forEach((path) => {
      const fileElement = fileListElement.appendChild(document.createElement('li'));
      fileElement.textContent = path;
    });

    // event
    filesElement.addEventListener('click', () => {
      fileListElement.classList.toggle('show');
    });

    const style = document.createElement('link');
    style.setAttribute('rel', 'stylesheet');
    style.setAttribute('href', './css/components.css');

    this.shadowRoot.append(style, wrapper, fileListElement); // 생성된 요소들을 shadow DOM에 부착합니다
  }
}

// Define the new element
customElements.define('flay-files', FlayFiles);
