import { CSRF_HEADER, File } from '../lib/crazy.common';

const OPT_DEFAULT = {
  id: 'flayAttach',
  attachChangeCallback: null,
  maxLengthPerFile: 0,
  totalFileCount: 0,
  totalFileLength: 0,
};

const CSS = `
  ::-webkit-scrollbar {
    width: 0.25rem;
  }
  ::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.5);
    border-radius: 0.25rem;
  }

  .wrapper {
    position: relative;
    width: calc(100% - 2px);
    height: calc(100% - 2px);
    margin: 0;
    padding: 0;
    border: 1px solid var(--color-border-form);
    border-radius: 0.25rem;
  }

  .file-box {
    position: relative;
    width: calc(100% - 1rem);
    height: calc(100% - 1rem);
    margin: 0;
    padding: 0.5rem;
  }

  .wrapper.file-dragover .file-list {
    background: rgba(0, 250, 250, 0.25)
        url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' version='1.1' height='32px' width='144px'><text x='0' y='15' fill='green' font-size='20'>Drop file here!</text></svg>")
        center no-repeat;

  }

  .file-list {
    height: calc(100% - 1.5rem);
    overflow: auto;
    margin: 0;
    padding: 0 0 0 0.5rem;
  }
  .file-list > li {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 1rem;
    margin: 0.125rem;
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
  }
  .file-list > li:hover {
    background-color: rgba(250, 250, 0, 0.125);
  }
  .file-list > li > .file-size {
    margin-left: auto;
  }
  .file-list > li > button {
    background-color: transparent;
    border: 0;
    color: red;
    cursor: pointer;
  }
  .file-list > li > button:hover {
    text-shadow: 1px 1px black;
  }

  .file-summary {
    border-top: 1px solid var(--color-border-form);
    height: 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 1rem;
    padding: 0 3rem;
  }

  input[type="file"] {
    position: absolute;
    width: 1px;
    height: 1px;
    display: none;
  }
`;

/**
 * 커스텀 파일 첨부 박스
 */
export default class FlayAttach extends HTMLElement {
  constructor(opts) {
    super();

    this.options = { ...OPT_DEFAULT, ...opts };

    // 첨부 파일 관리 객체
    this.dataTransfer = new DataTransfer();
    this.fileCount = 0;
    this.fileLength = 0;

    // shadow root을 생성합니다
    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다
    this.setAttribute('id', this.options.id);

    this.wrapper = document.createElement('div');
    this.wrapper.setAttribute('class', 'wrapper');

    this.fileBox = this.wrapper.appendChild(document.createElement('div'));
    this.fileBox.setAttribute('class', 'file-box');

    this.fileList = this.fileBox.appendChild(document.createElement('ol'));
    this.fileList.setAttribute('class', 'file-list');

    this.fileSummary = this.fileBox.appendChild(document.createElement('div'));
    this.fileSummary.setAttribute('class', 'file-summary');

    const fileInput = this.fileBox.appendChild(document.createElement('input'));
    fileInput.setAttribute('type', 'file');

    const fontAwesomelink = document.createElement('link');
    fontAwesomelink.setAttribute('rel', 'stylesheet');
    fontAwesomelink.setAttribute('href', 'css/fontawesome/font-awesome-v4.css');

    const style = document.createElement('style');
    style.textContent = CSS;

    this.addFileDragEventListener();
    this.addFileRemoveEventListener();

    // 생성된 요소들을 shadow DOM에 부착합니다
    this.shadowRoot.append(fontAwesomelink, style, this.wrapper);
  }

  /**
   * 파일 드래그&드롭 이벤트
   */
  addFileDragEventListener() {
    this.fileList.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.wrapper.classList.add('file-dragover');
    });

    this.fileList.addEventListener('dragenter', (e) => {});

    this.fileList.addEventListener('dragleave', (e) => {
      this.wrapper.classList.remove('file-dragover');
    });

    this.fileList.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.wrapper.classList.remove('file-dragover');
      this.insertFile(e.dataTransfer.files);
    });
  }

  /**
   * 파일 제거 이벤트
   */
  addFileRemoveEventListener() {
    this.fileList.addEventListener('click', (e) => {
      if (e.target.className !== 'file-remove') return;
      this.removeFile(e.target.dataset.uniquekey);
    });
  }

  /**
   * 파일 추가
   * @param {FileList} files
   * @returns
   */
  insertFile(files) {
    // 중복 파일, 제한 크기 초과 체크

    let drapedFileArray = [];
    let drapedFileLength = 0;
    let duplicatedText = [];
    let overflowText = [];

    // 중복 파일이 있는지
    Array.from(files).forEach((file) => {
      if (this.containsFile(file)) {
        duplicatedText.push(file.name);
      }
    });
    if (duplicatedText.length > 0) {
      alert(`중복 파일이 있습니다.\n\t${duplicatedText.join('\n\t')}`);
      return;
    }

    // 단일 파일 최대 크기 초과 했는지
    Array.from(files).forEach((file) => {
      if (0 < this.options.maxLengthPerFile && this.options.maxLengthPerFile < file.size) {
        overflowText.push(`${file.name}: ${File.formatSize(file.size, 'MB', 0)}`);
      }
    });
    if (overflowText.length > 0) {
      alert(`제한 크기(${File.formatSize(this.options.maxLengthPerFile, 'MB', 0)})를 초과한 파일이 있습니다.\n\t${overflowText.join('\n\t')}`);
      return;
    }

    Array.from(files).forEach((file) => {
      drapedFileArray.push(file);
      drapedFileLength += file.size;
    });

    // 파일 갯수를 초과 했는지
    if (0 < this.options.totalFileCount && this.options.totalFileCount < drapedFileArray.length + this.fileCount) {
      alert(`첨부 가능한 파일 갯수(${this.options.totalFileCount})를 초과했습니다.
        현재 개수: ${this.fileCount}, 추가한 갯수: ${drapedFileArray.length}`);
      return;
    }

    // 전체 파일 크기를 초과 했는지
    if (0 < this.options.totalFileLength && this.options.totalFileLength < drapedFileLength + this.fileLength) {
      alert(`첨부 가능한 전체 파일 크기(${File.formatSize(this.options.totalFileLength, 'MB', 0)})를 초과했습니다.
        현재 크기: ${File.formatSize(this.fileLength, 'MB', 0)}, 추가한 크기: ${File.formatSize(drapedFileLength, 'MB', 0)}`);
      return;
    }

    // 체크된 파일 추가
    Array.from(drapedFileArray).forEach((file) => this.dataTransfer.items.add(file));

    // 서버로 업로드 호출. ticket 받기
    this.uploadToServer();
  }

  /**
   * 파일 제거
   * @param {Number} uniqueKey 클릭된 파일 인덱스
   */
  removeFile(uniqueKey) {
    // 서버로 파일 제거 호출
    this.removeToServer(uniqueKey, () => {
      const tmpDataTranster = new DataTransfer();
      Array.from(this.getFiles())
        .filter((file) => file.uniqueKey != uniqueKey)
        .forEach((file) => {
          tmpDataTranster.items.add(file);
        });
      this.dataTransfer = tmpDataTranster;

      this.changeCallback();
    });
  }

  /**
   * 동일 파일이 있는지
   * @param {File} newFile
   * @returns
   */
  containsFile(newFile) {
    return Array.from(this.getFiles()).filter((file) => file.lastModified === newFile.lastModified && file.name === newFile.name).length > 0;
  }

  /**
   * 첨부된 파일 목록
   * @returns
   */
  getFiles() {
    return this.dataTransfer.files;
  }

  /**
   * 첨부가 변경될때 콜백
   */
  changeCallback() {
    this.renderFileList();
    this.dispatchEvent(new CustomEvent('attach', { detail: { files: this.getFiles() }, cancelable: true, composed: false, bubbles: false }));
    this.setAttribute('length', this.getFiles().length);

    if (this.options.attachChangeCallback) {
      this.options.attachChangeCallback(this.getFiles());
    }
  }

  /**
   * 첨부된 파일 목록 렌더링
   */
  renderFileList() {
    this.fileCount = 0;
    this.fileLength = 0;

    this.fileList.innerHTML = '';
    Array.from(this.getFiles()).forEach((file) => {
      this.fileList.innerHTML += `
          <li id="${file.uniqueKey}">
            <label class="file-icon"><i class="fa fa-${getFileIcon(file)}"></i></label>
            <label class="file-name">${file.name}</label>
            <label class="file-size">${File.formatSize(file.size)}</label>
            <button class="file-remove" data-uniquekey="${file.uniqueKey}">X</button>
          </li>`;

      this.fileCount++;
      this.fileLength += file.size;
    });
    // summary render
    this.fileSummary.innerHTML = `
      <labe>${this.fileCount} <small>${this.options.totalFileCount > 0 ? `/ ${this.options.totalFileCount} ` : ''}files</small></labe>
      <labe>${File.formatSize(this.fileLength)} ${this.options.totalFileLength > 0 ? `/ ${File.formatSize(this.options.totalFileLength)}` : ''}</labe>`;
  }

  uploadToServer() {
    const formData = new FormData();
    for (const file of this.getFiles()) {
      formData.append('file', file);
    }

    fetch('/attach/upload', {
      method: 'POST',
      headers: new Headers(CSRF_HEADER),
      body: formData,
    })
      .then((response) => response.json())
      .then((result) => {
        console.log('Success:', result);
        Array.from(result).forEach((ticket) => {
          for (const file of this.getFiles()) {
            if (file.name === ticket.filename) {
              file['uniqueKey'] = ticket.uniqueKey;
              break;
            }
          }

          this.changeCallback();
        });
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  }

  removeToServer(uniqueKey, callback) {
    fetch('/attach/remove', {
      method: 'DELETE',
      headers: new Headers(CSRF_HEADER),
      body: uniqueKey,
    })
      .then((response) => response.json())
      .then((result) => {
        console.log('Success:', result);
        if (callback) {
          callback();
        }
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  }
}

// Define the new element
customElements.define('flay-attach', FlayAttach);

function getFileIcon(file) {
  function getFileType(fileExt, fileType) {
    let type0 = fileType.split('/')[0];
    if (type0 === 'video') return 'video';
    if (type0 === 'audio') return 'audio';
    if (type0 === 'image') return 'image';
    if (['java', 'js', 'cjs', 'css', 'scss', 'json', 'html', 'xml', 'json', 'properties', 'md'].includes(fileExt)) return 'code';
    if (type0 === 'text') return 'text';
    if (['jar', 'tar', 'gz', 'cab', 'zip'].includes(fileExt)) return 'archive';
    if (['ppt', 'pptx'].includes(fileExt)) return 'powerpoint';
    if (['xls', 'xlsx'].includes(fileExt)) return 'excel';
    if (['doc', 'docx'].includes(fileExt)) return 'word';
    if (['pdf'].includes(fileExt)) return 'pdf';

    return 'etc';
  }

  switch (getFileType(file.name.split('.').pop(), file.type)) {
    case 'video':
      return 'file-video-o';
    case 'audio':
      return 'file-audio-o';
    case 'image':
      return 'file-image-o';
    case 'code':
      return 'file-code-o';
    case 'text':
      return 'file-text-o';
    case 'archive':
      return 'file-archive-o';
    case 'powerpoint':
      return 'file-powerpoint-o';
    case 'excel':
      return 'file-excel-o';
    case 'word':
      return 'file-word-o';
    case 'pdf':
      return 'file-pdf-o';
    default:
      return 'file-o';
  }
}
