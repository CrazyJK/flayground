import FlayAction from '../../util/flay.action';
import Search from '../../util/Search';
import SVG from '../svg.json';

/**
 *
 */
export default class FlayFiles extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다
    const LINK = document.createElement('link');
    LINK.setAttribute('rel', 'stylesheet');
    LINK.setAttribute('href', './css/4.components.css');
    const STYLE = document.createElement('style');
    STYLE.innerHTML = CSS;
    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('files');
    this.shadowRoot.append(LINK, STYLE, this.wrapper); // 생성된 요소들을 shadow DOM에 부착합니다

    this.flay = null;

    this.infoDiv = this.wrapper.appendChild(document.createElement('div'));
    this.infoDiv.classList.add('info');

    this.movieBtn = this.infoDiv.appendChild(document.createElement('button'));
    this.movieBtn.addEventListener('click', (e) => {
      console.log('playClick', this.flay.opus);
      if (this.flay.files.movie.length > 0) FlayAction.play(this.flay.opus);
    });

    this.subBtn = this.infoDiv.appendChild(document.createElement('button'));
    this.subBtn.classList.add('sub-btn');
    this.subBtn.addEventListener('click', (e) => {
      console.log('subtitlesClick', this.flay.opus);
      if (this.flay.files.subtitles.length > 0) {
        FlayAction.editSubtitles(this.flay.opus);
      } else {
        Search.subtitles(this.flay.opus);
      }
    });

    this.playLabel = this.infoDiv.appendChild(document.createElement('label'));
    this.playLabel.classList.add('play-label');
    this.playLabel.innerHTML = 'Play';

    this.sizeLabel = this.infoDiv.appendChild(document.createElement('label'));
    this.sizeLabel.classList.add('size-label');
    this.sizeLabel.innerHTML = '';

    this.fileShowBtn = this.infoDiv.appendChild(document.createElement('button'));
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
    this.wrapper.classList.toggle('small', this.parentElement.classList.contains('small'));

    this.movieBtn.innerHTML = 'Movie<i class="badge">' + flay.files.movie.length + '</i>';
    this.movieBtn.classList.toggle('disable', flay.files.movie.length === 0);

    this.subBtn.innerHTML = 'Sub<i class="badge">' + flay.files.subtitles.length + '</i>';
    this.subBtn.classList.toggle('disable', flay.files.subtitles.length === 0);

    this.playLabel.innerHTML = 'Play<i class="badge">' + flay.video.play + '</i>';
    this.playLabel.classList.toggle('disable', flay.video.play === 0);

    this.sizeLabel.innerHTML = getPrettyFilesize(flay.length);

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

const CSS = `
div.files > div.info {
  display: flex;
  gap: 1rem;
  justify-content: center;
  align-items: flex-end;
}
div.files > div.list {
  display: none;
}
div.files > div.list.show {
  display: block;
}
div.files > div.list > ol {
  margin: 0;
  padding: 0.5rem;
  list-style: none;
  text-align: left;
  border: 2px dashed purple;
  border-bottom: 0;
}
div.files > div.list > ol > li {
  font-size: var(--font-smallest);
  font-family: D2Coding;
  margin-bottom: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}
div.files > div.list > ol > li:last-child {
  margin-bottom: 0;
}
div.files > div.list > div.rename-flay {
  display: flex;
}
div.files > div.list > div.rename-flay > input#studio {
  flex: 0 0 auto;
  width: 4rem;
}
div.files > div.list > div.rename-flay > input#opus {
  flex: 0 0 auto;
  width: 3rem;
}
div.files > div.list > div.rename-flay > input#title {
  flex: 1 1 auto;
}
div.files > div.list > div.rename-flay > input#actress {
  flex: 0 0 auto;
  width: 6rem;
}
div.files > div.list > div.rename-flay > input#release {
  flex: 0 0 auto;
  width: 4rem;
}
div.files > div.list > div.rename-flay > input,
div.files > div.list > div.rename-flay > button {
  font-size: var(--font-smallest);
  font-family: D2Coding;
  border: 2px dashed purple;
  border-right: 0;
  padding: 4px;
}
div.files > div.list > div.rename-flay > button {
  font-size: var(--font-small);
  border-right: 2px dashed purple;
}
@media screen and (max-width: 600px) {
  .sub-btn,
  .play-label,
  .size-label,
  .files-btn {
    display: none;
  }
}
div.files.small .sub-btn,
div.files.small .play-label,
div.files.small .size-label,
div.files.small .files-btn {
  display: none !important;
}
div.files.small button {
  font-size: var(--font-normal);
}
`;
