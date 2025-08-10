import ApiClient from '@lib/ApiClient';
import FlayAction from '@lib/FlayAction';
import './inc/Page';
import './page.image-download.scss';

class Page {
  start() {
    document.querySelector('#openFolderBtn')!.addEventListener('click', (e) => FlayAction.explore((e.target as HTMLElement).textContent!));

    document.querySelector('#pageUrl')!.addEventListener('change', () => this.runDownload());
  }

  async runDownload() {
    const searchParams = new URLSearchParams({
      pageUrl: (document.querySelector('#pageUrl') as HTMLInputElement).value,
      downloadDir: (document.querySelector('#downloadDir') as HTMLInputElement).value,
      folderName: (document.querySelector('#folderName') as HTMLInputElement).value,
      titlePrefix: (document.querySelector('#titlePrefix') as HTMLInputElement).value,
      titleCssQuery: (document.querySelector('#titleCssQuery') as HTMLInputElement).value,
      minimumKbSize: (document.querySelector('#minimumKbSize') as HTMLInputElement).value,
    });

    const imageInfo = await ApiClient.get('/image/pageImageDownload?' + searchParams.toString());
    const { imageFiles, imageUrls, localPath, message, result } = imageInfo as {
      imageFiles: string[];
      imageUrls: string[];
      localPath: string;
      message: string;
      pageUrl: string;
      result: boolean;
    };
    if (result) {
      document.querySelector('#openFolderBtn')!.innerHTML = localPath;
      document.querySelector('#fileList')!.innerHTML = imageFiles
        .map((file) => {
          return `<li>${file.split('\\').pop()}</li>`;
        })
        .join('');
      document.querySelector('#images')!.innerHTML = imageUrls
        .map((url) => {
          return `<li><img src="${url}" title="${url.split('/').pop()}"></li>`;
        })
        .join('');
      document.querySelector('main > footer')!.innerHTML = `<label>${imageFiles.length} downloaded. ${imageUrls.length} images</label>`;
    } else {
      document.querySelector('main > footer')!.innerHTML = `<label style="color:red">${message}</label>`;
    }
  }
}

new Page().start();
