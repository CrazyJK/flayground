import ApiClient from '../lib/ApiClient';
import FlayAction from '../lib/FlayAction';
import './inc/Page';
import './page.image-download.scss';

class Page {
  constructor() {}

  async start() {
    document.querySelector('#openFolderBtn').addEventListener('click', (e) => FlayAction.explore(e.target.textContent));

    document.querySelector('#pageUrl').addEventListener('change', () => this.runDownload());
  }

  async runDownload() {
    const searchParams = new URLSearchParams({
      pageUrl: document.querySelector('#pageUrl').value,
      downloadDir: document.querySelector('#downloadDir').value,
      folderName: document.querySelector('#folderName').value,
      titlePrefix: document.querySelector('#titlePrefix').value,
      titleCssQuery: document.querySelector('#titleCssQuery').value,
      minimumKbSize: document.querySelector('#minimumKbSize').value,
    });

    const { imageFiles, imageUrls, localPath, message, pageUrl, result } = await ApiClient.get('/image/pageImageDownload?' + searchParams.toString());
    if (result) {
      document.querySelector('#openFolderBtn').innerHTML = localPath;
      document.querySelector('#fileList').innerHTML = imageFiles
        .map((file) => {
          return `<li>${file.split('\\').pop()}</li>`;
        })
        .join('');
      document.querySelector('#images').innerHTML = imageUrls
        .map((url) => {
          return `<li><img src="${url}" title="${url.split('/').pop()}"></li>`;
        })
        .join('');
      document.querySelector('main > footer').innerHTML = `<label>${imageFiles.length} downloaded. ${imageUrls.length} images</label>`;
    } else {
      document.querySelector('main > footer').innerHTML = `<label style="color:red">${message}</label>`;
    }
  }
}

new Page().start();
