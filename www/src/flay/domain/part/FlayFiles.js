import FileUtils from '../../../lib/FileUtils';
import FlayAction from '../../../lib/FlayAction';
import FlaySearch from '../../../lib/FlaySearch';
import folderSVG from '../../../svg/folder';
import torrentSVG from '../../../svg/torrent';
import youtubeSVG from '../../../svg/youtube';
import PlayTimeDB from '../../idb/PlayTimeDB';
import './FlayFiles.scss';
import FlayHTMLElement, { defineCustomElements } from './FlayHTMLElement';

/**
 * Custom element of File
 */
export default class FlayFiles extends FlayHTMLElement {
  constructor() {
    super();

    this.innerHTML = `
      <div class="info">
        <button type="button" class="flay-play" title="play on layer">${youtubeSVG}</button>
        <button type="button" class="flay-movie">Movie<i class="badge movie-length">0</i></button>
        <button type="button" class="sub-btn">Sub<i class="badge sub-length">0</i></button>
        <label class="size-label"><span class="size-num">0</span><small class="size-unit">GB</small></label>
        <button type="button" class="files-btn" title="show files">${folderSVG}</button>
        <button type="button" class="search-torrent" title="search torrent">${torrentSVG}</button>
      </div>
      <div class="list">
        <ol></ol>
        <div class="rename-flay">
          ${['studio', 'opus', 'title', 'actress', 'release'].map((name) => `<input type="text" name="${name}" placeholder="${name}" spellcheck="false">`).join('')}
          <button type="button" title="rename flay file name" id="renameBtn">Rename</button>
        </div>
      </div>
    `;

    this.querySelector('.flay-play').addEventListener('click', async () => {
      const { playInLayer } = await import(/* webpackChunkName: "FlayVideoPlayer" */ '../../panel/FlayVideoPlayer');
      await playInLayer(this.flay.opus);
    });

    const playTimeDB = new PlayTimeDB();

    this.querySelector('.flay-movie').addEventListener('click', async () => {
      if (this.flay.files.movie.length > 0) {
        const record = await playTimeDB.select(this.flay.opus);
        console.log('record', record);

        FlayAction.play(this.flay.opus, record.time).then(async () => {
          const { FlayBasket } = await import(/* webpackChunkName: "FlayBasket" */ '../../panel/FlayBasket');
          FlayBasket.remove(this.flay.opus);
        });
      } else {
        FlaySearch.torrent.Download(this.flay.opus);
      }
    });

    this.querySelector('.sub-btn').addEventListener('click', () => {
      if (this.flay.files.subtitles.length > 0) {
        FlayAction.editSubtitles(this.flay.opus);
      } else {
        FlaySearch.subtitles.Subtitlecat(this.flay.opus);
      }
    });

    this.querySelector('.files-btn').addEventListener('click', () => {
      this.querySelector('.list').classList.toggle('show');
    });

    this.querySelector('.search-torrent').addEventListener('click', () => {
      FlaySearch.torrent.Ijav(this.flay.opus);
    });

    this.querySelector('.list ol').addEventListener('click', (e) => {
      FlayAction.explore(e.target.textContent);
    });

    this.querySelectorAll('.rename-flay input').forEach((input) => input.addEventListener('keyup', (e) => e.stopPropagation()));

    this.querySelector('#renameBtn').addEventListener('click', () => {
      const [studio, opus, title, actress, release] = Array.from(this.querySelectorAll('.rename-flay input')).map((input) => input.value.trim());
      console.log('renameClick', studio, opus, title, actress, release);
      FlayAction.renameFlay(studio, opus, title, actress, release);
    });
  }

  connectedCallback() {
    this.classList.add('flay-files');
  }

  /**
   *
   * @param {Flay} flay
   */
  set(flay) {
    this.setFlay(flay);

    this.querySelector('.movie-length').innerHTML = flay.files.movie.length;
    this.querySelector('.flay-movie').classList.toggle('disable', flay.files.movie.length === 0);

    this.querySelector('.sub-length').innerHTML = flay.files.subtitles.length;
    this.querySelector('.sub-btn').classList.toggle('disable', flay.files.subtitles.length === 0);

    const [size, unit] = FileUtils.prettySize(flay.length);
    this.querySelector('.size-num').innerHTML = size;
    this.querySelector('.size-unit').innerHTML = unit;

    const fileList = this.querySelector('.list ol');
    fileList.textContent = null;

    Array.from(flay.files.cover).forEach((path) => {
      fileList.appendChild(document.createElement('li')).textContent = path;
    });

    Array.from(flay.files.movie).forEach((path) => {
      fileList.appendChild(document.createElement('li')).textContent = path;
    });

    Array.from(flay.files.subtitles).forEach((path) => {
      fileList.appendChild(document.createElement('li')).textContent = path;
    });

    this.querySelector('[name="studio"]').value = flay.studio;
    this.querySelector('[name="opus"]').value = flay.opus;
    this.querySelector('[name="title"]').value = flay.title;
    this.querySelector('[name="actress"]').value = flay.actressList.join(', ');
    this.querySelector('[name="release"]').value = flay.release;
  }
}

defineCustomElements('flay-files', FlayFiles);
