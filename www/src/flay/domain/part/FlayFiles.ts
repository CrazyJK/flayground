import FileUtils from '@lib/FileUtils';
import FlayAction from '@lib/FlayAction';
import FlaySearch from '@lib/FlaySearch';
import folderSVG from '@svg/folder';
import torrentSVG from '@svg/torrent';
import youtubeSVG from '@svg/youtube';
// import PlayTimeDB from '@flay/idb/PlayTimeDB';
import { Flay } from '@lib/FlayFetch';
import './FlayFiles.scss';
import FlayHTMLElement, { defineCustomElements } from './FlayHTMLElement';

/**
 * Custom element of File
 */
export default class FlayFiles extends FlayHTMLElement {
  #studioInput: HTMLInputElement;
  #opusInput: HTMLInputElement;
  #titleInput: HTMLInputElement;
  #actressInput: HTMLInputElement;
  #releaseInput: HTMLInputElement;

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

    this.#studioInput = this.querySelector('[name="studio"]');
    this.#opusInput = this.querySelector('[name="opus"]');
    this.#titleInput = this.querySelector('[name="title"]');
    this.#actressInput = this.querySelector('[name="actress"]');
    this.#releaseInput = this.querySelector('[name="release"]');

    this.querySelector('.flay-play').addEventListener('click', async () => {
      const { playInLayer } = await import(/* webpackChunkName: "FlayVideoPlayer" */ '@flay/panel/FlayVideoPlayer');
      await playInLayer(this.flay.opus);
    });

    // const playTimeDB = new PlayTimeDB();

    this.querySelector('.flay-movie').addEventListener('click', async () => {
      if (this.flay.files.movie.length > 0) {
        // const record = await playTimeDB.select(this.flay.opus);
        // console.log('record', record);
        // const seekTime = record.time;
        const seekTime = -1;

        FlayAction.play(this.flay.opus, seekTime).then(async () => {
          const { FlayBasket } = await import(/* webpackChunkName: "FlayBasket" */ '@flay/panel/FlayBasket');
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
      const target = e.target as HTMLElement;
      FlayAction.explore(target.textContent);
    });

    this.querySelectorAll('.rename-flay input').forEach((input) => input.addEventListener('keyup', (e) => e.stopPropagation()));

    this.querySelector('#renameBtn').addEventListener('click', () => {
      const [studio, opus, title, actress, release] = Array.from(this.querySelectorAll('.rename-flay input')).map((input: HTMLInputElement) => input.value.trim());
      console.log('renameClick', studio, opus, title, actress, release);
      FlayAction.renameFlay(studio, opus, title, actress, release);
    });
  }

  connectedCallback() {
    this.classList.add('flay-files');
  }

  /**
   *
   * @param flay
   */
  set(flay: Flay): void {
    this.setFlay(flay);

    this.querySelector('.movie-length').innerHTML = String(flay.files.movie.length);
    this.querySelector('.flay-movie').classList.toggle('disable', flay.files.movie.length === 0);

    this.querySelector('.sub-length').innerHTML = String(flay.files.subtitles.length);
    this.querySelector('.sub-btn').classList.toggle('disable', flay.files.subtitles.length === 0);

    const [size, unit] = FileUtils.prettySize(flay.length);
    this.querySelector('.size-num').innerHTML = String(size);
    this.querySelector('.size-unit').innerHTML = String(unit);

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

    this.#studioInput.value = flay.studio;
    this.#opusInput.value = flay.opus;
    this.#titleInput.value = flay.title;
    this.#actressInput.value = flay.actressList.join(', ');
    this.#releaseInput.value = flay.release;
  }
}

defineCustomElements('flay-files', FlayFiles);
