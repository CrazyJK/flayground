import SVG from '../../svg/SVG';
import FlayAction from '../../util/FlayAction';
import Search from '../../util/FlaySearch';
import { getPrettyFilesize } from '../../util/fileUtils';
import './FlayFiles.scss';
import FlayHTMLElement from './FlayHTMLElement';

/**
 * Custom element of File
 */
export default class FlayFiles extends FlayHTMLElement {
  flay;

  constructor() {
    super();
  }

  connectedCallback() {
    const infoDiv = this.wrapper.appendChild(document.createElement('div'));
    infoDiv.classList.add('info');

    this.movieBtn = infoDiv.appendChild(document.createElement('button'));
    this.movieBtn.innerHTML = 'Movie<i class="badge">0</i>';
    this.movieBtn.addEventListener('click', (e) => {
      console.log('playClick', this.flay.opus);
      if (this.flay.files.movie.length > 0) {
        FlayAction.play(this.flay.opus);
      } else {
        Search.torrent.Download(this.flay.opus);
      }
    });

    this.subBtn = infoDiv.appendChild(document.createElement('button'));
    this.subBtn.classList.add('sub-btn');
    this.subBtn.innerHTML = 'Sub<i class="badge">0</i>';
    this.subBtn.addEventListener('click', (e) => {
      console.log('subtitlesClick', this.flay.opus);
      if (this.flay.files.subtitles.length > 0) {
        FlayAction.editSubtitles(this.flay.opus);
      } else {
        Search.subtitles.Subtitlecat(this.flay.opus);
      }
    });

    this.sizeLabel = infoDiv.appendChild(document.createElement('label'));
    this.sizeLabel.classList.add('size-label');
    this.sizeLabel.innerHTML = '0<small>GB</small>';

    this.fileShowBtn = infoDiv.appendChild(document.createElement('button'));
    this.fileShowBtn.classList.add('files-btn');
    this.fileShowBtn.setAttribute('title', 'show files');
    this.fileShowBtn.innerHTML = SVG.folder;
    this.fileShowBtn.addEventListener('click', () => {
      this.listDiv.classList.toggle('show');
    });

    this.listDiv = this.wrapper.appendChild(document.createElement('div'));
    this.listDiv.classList.add('list');

    this.fileList = this.listDiv.appendChild(document.createElement('ol'));
    this.fileList.addEventListener('click', (e) => {
      console.log('filesClick', this.flay.opus, e.target.textContent);
      FlayAction.explore(e.target.textContent);
    });

    this.renameDiv = this.listDiv.appendChild(document.createElement('div'));
    this.renameDiv.classList.add('rename-flay');
    ['studio', 'opus', 'title', 'actress', 'release'].forEach((name) => {
      let input = this.renameDiv.appendChild(document.createElement('input'));
      input.placeholder = name;
      input.type = 'text';
      input.id = name;
      input.setAttribute('spellcheck', false);
      input.addEventListener('keyup', (e) => {
        e.stopPropagation();
      });
      if (name === 'opus') {
        input.readOnly = true;
      }
      this[name + 'Input'] = input;
    });
    this.renameBtn = this.renameDiv.appendChild(document.createElement('button'));
    this.renameBtn.innerHTML = 'Rename';
    this.renameBtn.addEventListener('click', (e) => {
      let newName = `[${this.studioInput.value}][${this.opusInput.value}][${this.titleInput.value}][${this.actressInput.value}][${this.releaseInput.value}]`;
      console.log('renameClick', newName);
      FlayAction.renameFlay(this.studioInput.value, this.opusInput.value, this.titleInput.value, this.actressInput.value, this.releaseInput.value);
    });
  }

  /**
   *
   * @param {Flay} flay
   */
  set(flay) {
    this.flay = flay;
    this.wrapper.setAttribute('data-opus', flay.opus);
    this.wrapper.classList.toggle('archive', this.flay.archive);

    this.movieBtn.innerHTML = 'Movie<i class="badge">' + flay.files.movie.length + '</i>';
    this.movieBtn.classList.toggle('disable', flay.files.movie.length === 0);

    this.subBtn.innerHTML = 'Sub<i class="badge">' + flay.files.subtitles.length + '</i>';
    this.subBtn.classList.toggle('disable', flay.files.subtitles.length === 0);

    const [size, unit] = getPrettyFilesize(flay.length);
    this.sizeLabel.innerHTML = `${size}<small>${unit}</small>`;

    this.fileList.textContent = null;

    Array.from(flay.files.cover).forEach((path) => {
      const fileElement = this.fileList.appendChild(document.createElement('li'));
      fileElement.textContent = path;
    });

    Array.from(flay.files.movie).forEach((path) => {
      const fileElement = this.fileList.appendChild(document.createElement('li'));
      fileElement.textContent = path;
    });

    Array.from(flay.files.subtitles).forEach((path) => {
      const fileElement = this.fileList.appendChild(document.createElement('li'));
      fileElement.textContent = path;
    });

    this.studioInput.value = flay.studio;
    this.opusInput.value = flay.opus;
    this.titleInput.value = flay.title;
    this.actressInput.value = flay.actressList.join(', ');
    this.releaseInput.value = flay.release;
  }
}

// Define the new element
customElements.define('flay-files', FlayFiles);
