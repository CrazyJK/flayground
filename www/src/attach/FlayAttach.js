import ApiClient from '@lib/ApiClient';
import windowButton from '@svg/windowButton';
import './FlayAttach.scss';

const File = {
  formatSize: (length) => {
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
  },
};
const MB = 1024 * 1024;
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

    this.id = this.options.id;
    this.classList.add('flay-attach', 'flay-div');

    this.fileBox = this.appendChild(document.createElement('div'));
    this.fileBox.setAttribute('class', 'file-box');

    this.fileList = this.fileBox.appendChild(document.createElement('ol'));
    this.fileList.setAttribute('class', 'file-list');

    this.fileSummary = this.fileBox.appendChild(document.createElement('div'));
    this.fileSummary.setAttribute('class', 'file-summary');

    this.fileInput = this.fileBox.appendChild(document.createElement('input'));
    this.fileInput.setAttribute('type', 'file');
    this.fileInput.setAttribute('multiple', 'multiple');

    this.addFileDragEventListener();
    this.addFileRemoveEventListener();
    this.addFileFinderClickEventListener();

    this.initiate('1c414415614211313313e1401ec1421c31fc1961431f71ee', 'TEMP', 'unnamed');
  }

  /**
   * 파일 드래그&드롭 이벤트
   */
  addFileDragEventListener() {
    this.fileList.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.classList.add('file-dragover');
    });

    this.fileList.addEventListener('dragenter', (e) => {});

    this.fileList.addEventListener('dragleave', (e) => {
      this.classList.remove('file-dragover');
    });

    this.fileList.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.classList.remove('file-dragover');
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
      ApiClient.get('/attach/' + id)
        .then((attach) => this.changeCallback(attach))
        .catch((error) => console.error('get fetch attach', id, error));
    } else {
      // 신규 첨부 생성
      const formData = new FormData();
      formData.append('name', name);
      formData.append('type', type);

      ApiClient.postFormData('/attach', formData)
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
    this.dispatchEvent(new CustomEvent('attachChange', { detail: { files: this.attach }, cancelable: true, composed: false, bubbles: false }));
    this.setAttribute('length', this.getFiles().length);

    if (this.options.attachChangeCallback) {
      this.options.attachChangeCallback(this.attach);
    }

    this.classList.remove('file-transfer');
    this.classList.toggle('file-empty', attach.attachFiles.length === 0);
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

    this.classList.add('file-transfer');

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
    this.classList.add('file-transfer');

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
            <button class="file-remove" data-attachfileid="${attachFile.id}">${windowButton.terminate}</button>
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

    ApiClient.putFormData('/attach', formData)
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

    ApiClient.delete('/attach', { data: formData })
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
