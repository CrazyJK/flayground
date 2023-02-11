import { CSRF_HEADER, File, MB } from '../lib/crazy.common';

const MULTIPART = {
  maxFileSize: MB * 30, // max-file-size=30MB
  maxRequestSize: MB * 100, // max-request-size=100MB
};

const OPT_DEFAULT = {
  id: 'flayAttach',
  attachChangeCallback: null,
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
    font-size: 0.875rem;
  }

  .wrapper.file-empty .file-list {
    background: transparent url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' version='1.1' height='32px' width='192px'><text x='0' y='15' fill='lightgray' font-size='20'>Drag and drop here</text></svg>") center no-repeat;
  }

  .wrapper.file-dragover .file-list {
    background: rgba(0, 0, 0, 0.125) url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' version='1.1' height='32px' width='144px'><text x='0' y='15' fill='orange' font-size='20'>Drop file here!</text></svg>") center no-repeat;
  }

  .wrapper.file-transfer .file-list {
    background: rgba(0, 0, 0, 0.25) url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' version='1.1' height='32px' width='144px'><text x='0' y='15' fill='orange' font-size='20'>File transfer...</text></svg>") center no-repeat;
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
  .file-list > li > .file-name > a {
    color: var(--color-text);
    text-decoration: none;
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
    align-items: flex-end;
    gap: 1rem;
    padding: 0 3rem;
  }

  #fileSelector {
    cursor: pointer;
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

    this.attach = null;
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

    this.fileInput = this.fileBox.appendChild(document.createElement('input'));
    this.fileInput.setAttribute('type', 'file');
    this.fileInput.setAttribute('multiple', 'multiple');

    const fontAwesomelink = document.createElement('link');
    fontAwesomelink.setAttribute('rel', 'stylesheet');
    fontAwesomelink.setAttribute('href', 'css/fontawesome/font-awesome-v4.css');

    const style = document.createElement('style');
    style.textContent = CSS;

    this.addFileDragEventListener();
    this.addFileRemoveEventListener();
    this.addFileFinderClickEventListener();

    // 생성된 요소들을 shadow DOM에 부착합니다
    this.shadowRoot.append(fontAwesomelink, style, this.wrapper);

    this.initiate('1c414415614211313313e1401ec1421c31fc1961431f71ee', 'TEMP', 'unnamed');
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
      this.removeFile(e.target.dataset.attachfileid);
    });
  }

  /**
   * 파일박스 클릭 이밴트
   */
  addFileFinderClickEventListener() {
    this.fileSummary.addEventListener('click', (e) => {
      if (e.target.id !== 'fileSelector') return;
      this.fileInput.click();
    });
    this.fileInput.addEventListener('change', (e) => {
      this.insertFile(e.target.files);
    });
  }

  /**
   * 첨부 초기화
   * @param {*} files
   */
  initiate(id, type, name) {
    console.log('initiate', id, type, name);

    if (id) {
      // 기존 첨부 가져오기
      fetch('/attach/' + id)
        .then((response) => response.json())
        .then((attach) => this.changeCallback(attach))
        .catch((error) => console.error('get', error));
    } else {
      // 신규 첨부 생성
      const formData = new FormData();
      formData.append('name', name);
      formData.append('type', type);

      fetch('/attach/create', {
        method: 'POST',
        headers: new Headers(CSRF_HEADER),
        body: formData,
      })
        .then((response) => response.json())
        .then((attach) => this.changeCallback(attach))
        .catch((error) => console.error('create', error));
    }
  }

  /**
   * 첨부가 변경될때 콜백
   */
  changeCallback(attach) {
    console.log('changeCallback', attach);
    this.attach = attach;
    this.renderFileList();
    this.dispatchEvent(new CustomEvent('attach', { detail: { files: this.attach }, cancelable: true, composed: false, bubbles: false }));
    this.setAttribute('length', this.getFiles().length);

    if (this.options.attachChangeCallback) {
      this.options.attachChangeCallback(this.attach);
    }

    this.wrapper.classList.remove('file-transfer');
    this.wrapper.classList.toggle('file-empty', attach.attachFiles.length === 0);
  }

  /**
   * 파일 추가
   * 중복 파일, 제한 크기 초과 체크 후 서버로 전송
   * @param {FileList} dataTransferFiles
   * @returns
   */
  insertFile(dataTransferFiles) {
    let drapedFileArray = [];
    let drapedFileLength = 0;
    let duplicatedText = [];
    let overflowText = [];

    // 중복 파일이 있는지
    Array.from(dataTransferFiles).forEach((file) => {
      if (this.containsFile(file)) {
        duplicatedText.push(file.name);
      }
    });
    if (duplicatedText.length > 0) {
      alert(`중복 파일이 있습니다.\n\t${duplicatedText.join('\n\t')}`);
      return;
    }

    // 단일 파일 최대 크기 초과 했는지
    Array.from(dataTransferFiles).forEach((file) => {
      if (0 < MULTIPART.maxFileSize && MULTIPART.maxFileSize < file.size) {
        overflowText.push(`${file.name}: ${File.formatSize(file.size, 'MB', 0)}`);
      }
    });
    if (overflowText.length > 0) {
      alert(`제한 크기(${File.formatSize(MULTIPART.maxFileSize, 'MB', 0)})를 초과한 파일이 있습니다.\n\t${overflowText.join('\n\t')}`);
      return;
    }

    Array.from(dataTransferFiles).forEach((file) => {
      drapedFileArray.push(file);
      drapedFileLength += file.size;
    });

    // 단일 요청의 최대 크기 초과 했는지
    if (0 < MULTIPART.maxRequestSize && MULTIPART.maxRequestSize < drapedFileLength) {
      alert(`단일 요청의 최대 크기(${File.formatSize(MULTIPART.maxRequestSize, 'MB', 0)})를 초과했습니다.
        현재 첨부한 파일의 전체 크기: ${File.formatSize(drapedFileLength, 'MB', 0)}`);
      return;
    }

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

    this.wrapper.classList.add('file-transfer');

    // 체크가 완료된 파일
    const dataTransfer = new DataTransfer();
    Array.from(drapedFileArray).forEach((file) => dataTransfer.items.add(file));

    // 서버로 업로드 호출
    this.uploadToServer(dataTransfer);
  }

  /**
   * 파일 제거
   * @param {Number} uniqueKey 클릭된 파일 인덱스
   */
  removeFile(attachfileid) {
    this.wrapper.classList.add('file-transfer');

    // 서버로 파일 제거 호출
    this.removeToServer(attachfileid);
  }

  /**
   * 동일 파일이 있는지. 파일 이름으로 체크
   * @param {File} newFile
   * @returns
   */
  containsFile(newFile) {
    return Array.from(this.getFiles()).filter((file) => file.name === newFile.name).length > 0;
  }

  /**
   * 첨부된 파일 목록
   * @returns
   */
  getFiles() {
    return this.attach.attachFiles;
  }

  /**
   * 첨부된 파일 목록 렌더링
   */
  renderFileList() {
    this.fileCount = 0;
    this.fileLength = 0;

    this.fileList.innerHTML = '';
    Array.from(this.getFiles()).forEach((attachFile) => {
      this.fileList.innerHTML += `
          <li id="${attachFile.id}">
            <label class="file-icon"><i class="fa fa-${getFileIcon(attachFile)}"></i></label>
            <label class="file-name"><a href="/attach/${this.attach.id}/${attachFile.id}/download">${attachFile.name}</a></label>
            <label class="file-size">${File.formatSize(attachFile.size)}</label>
            <button class="file-remove" data-attachfileid="${attachFile.id}">X</button>
          </li>`;

      this.fileCount++;
      this.fileLength += attachFile.size;
    });
    // summary render
    this.fileSummary.innerHTML = `
      <label>${this.fileCount} <small>${this.options.totalFileCount > 0 ? `/ ${this.options.totalFileCount} ` : ''}files</small></label>
      <label id="fileSelector">Select</label>
      <label>${File.formatSize(this.fileLength)} ${this.options.totalFileLength > 0 ? `/ ${File.formatSize(this.options.totalFileLength)}` : ''}</label>`;
  }

  /**
   * 드랍된 파일을 서버로 전송한다
   * @param {DataTransfer} dataTransfer
   */
  uploadToServer(dataTransfer) {
    const formData = new FormData();
    formData.append('id', this.attach.id);
    for (const file of dataTransfer.files) {
      formData.append('file', file);
    }

    fetch('/attach/upload', {
      method: 'POST',
      headers: new Headers(CSRF_HEADER),
      body: formData,
    })
      .then((response) => response.json())
      .then((attach) => this.changeCallback(attach))
      .catch((error) => console.error('upload', error));
  }

  /**
   * 서버에 임시 저장된 파일 삭제
   * @param {String} attachFileId
   */
  removeToServer(attachFileId) {
    const formData = new FormData();
    formData.append('id', this.attach.id);
    formData.append('attachFileId', attachFileId);

    fetch('/attach/remove', {
      method: 'DELETE',
      headers: new Headers(CSRF_HEADER),
      body: formData,
    })
      .then((response) => response.json())
      .then((attach) => this.changeCallback(attach))
      .catch((error) => console.error('remove', error));
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
