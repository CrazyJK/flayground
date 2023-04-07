import FlayAction from '../util/flay.action';
import SVG from './svg.json';

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

    this.movieBtn = this.wrapper.appendChild(document.createElement('button'));
    this.movieBtn.addEventListener('click', (e) => {
      console.log('playClick', this.flay.opus);
      FlayAction.play(this.flay.opus);
    });

    this.subBtn = this.wrapper.appendChild(document.createElement('button'));
    this.subBtn.classList.add('sub-btn');
    this.subBtn.addEventListener('click', (e) => {
      console.log('subtitlesClick', this.flay.opus);
      FlayAction.editSubtitles(this.flay.opus);
    });

    this.playLabel = this.wrapper.appendChild(document.createElement('label'));
    this.playLabel.classList.add('play-label');
    this.playLabel.innerHTML = 'Play';

    this.sizeLabel = this.wrapper.appendChild(document.createElement('label'));
    this.sizeLabel.classList.add('size-label');
    this.sizeLabel.innerHTML = '';

    this.fileShowBtn = this.wrapper.appendChild(document.createElement('button'));
    this.fileShowBtn.classList.add('files-btn');
    this.fileShowBtn.setAttribute('title', 'show files');
    this.fileShowBtn.innerHTML = SVG.folder;
    this.fileShowBtn.addEventListener('click', () => {
      this.fileListElement.classList.toggle('show');
    });

    this.fileListElement = this.wrapper.appendChild(document.createElement('ol'));
    this.fileListElement.classList.add('files');
    this.fileListElement.addEventListener('click', (e) => {
      console.log('filesClick', this.flay.opus, e.target.textContent);
      FlayAction.explore(e.target.textContent);
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
    let movieSize = flay.files.movie.length;
    let subtitlesSize = flay.files.subtitles.length;

    this.flay = flay;
    this.wrapper.classList.toggle('archive', this.flay.archive);
    this.wrapper.setAttribute('data-opus', flay.opus);
    this.wrapper.classList.toggle('small', this.parentElement.classList.contains('small'));

    this.movieBtn.setAttribute('title', movieSize + ' Movie');
    this.movieBtn.innerHTML = 'Movie<i class="badge">' + movieSize + '</i>';

    this.subBtn.setAttribute('title', subtitlesSize + ' Subtitles');
    this.subBtn.innerHTML = 'Sub<i class="badge">' + subtitlesSize + '</i>';

    this.playLabel.innerHTML = 'Play<i class="badge">' + flay.video.play + '</i>';

    this.sizeLabel.innerHTML = getPrettyFilesize(flay.length);

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
