import FlayDiv from '@flay/FlayDiv';
import ApiClient from '@lib/ApiClient';
import windowButton from '@svg/windowButton';
import StringUtils from '../lib/StringUtils';
import './FlayAttach.scss';

interface AttachFile {
  id: string;
  name: string;
  size: number;
}

interface Attach {
  id: string;
  name: string;
  attachFiles: AttachFile[];
}

const File = {
  formatSize: (length: number) => {
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

interface Options {
  id: string;
  attachChangeCallback: Function | null;
  totalFileCount: number;
  totalFileLength: number;
}

const OPT_DEFAULT = {
  id: 'flayAttach',
  attachChangeCallback: null,
  totalFileCount: 0,
  totalFileLength: 0,
};

/**
 * 커스텀 파일 첨부 박스
 */
export default class FlayAttach extends FlayDiv {
  private options: Options;
  private attach: Attach | null;
  private fileCount: number;
  private fileLength: number;

  private fileBox!: HTMLDivElement;
  private fileList!: HTMLOListElement;
  private fileSummary!: HTMLDivElement;
  private fileInput!: HTMLInputElement;

  constructor(opts: Partial<Options> = {}) {
    super();

    this.options = { ...OPT_DEFAULT, ...opts };

    this.attach = null;
    this.fileCount = 0;
    this.fileLength = 0;

    this.id = this.options.id;

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

    this.fileList.addEventListener('dragenter', () => {});

    this.fileList.addEventListener('dragleave', () => {
      this.classList.remove('file-dragover');
    });

    this.fileList.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.classList.remove('file-dragover');
      if (e.dataTransfer) {
        this.insertFile(e.dataTransfer.files);
      }
    });
  }

  /**
   * 파일 제거 이벤트
   */
  addFileRemoveEventListener() {
    this.fileList.addEventListener('click', (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.className !== 'file-remove') return;
      if (target.dataset.attachfileid) {
        this.removeFile(target.dataset.attachfileid);
      }
    });
  }

  /**
   * 파일박스 클릭 이밴트
   */
  addFileFinderClickEventListener() {
    this.fileSummary.addEventListener('click', (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.className === 'file-finder') {
        this.fileInput.click();
      }
    });

    this.fileInput.addEventListener('change', () => {
      if (this.fileInput.files) {
        this.insertFile(this.fileInput.files);
      }
    });
  }

  /**
   * 초기화
   * @param {string} id
   * @param {string} name
   * @param {string} desc
   */
  initiate(id: string, name?: string, _desc?: string) {
    this.attach = {
      id: id,
      name: name ?? 'attach',
      attachFiles: [],
    };
    if (!StringUtils.isBlank(this.attach.id)) {
      void fetch('/api/v1/attach/' + this.attach.id).then((response) => {
        if (response.ok) {
          void response.json().then((attach: Attach) => {
            this.changeCallback(attach);
          });
        }
      });
    } else {
      // ID가 없는 경우 처리
      this.changeCallback(this.attach);
    }
  }

  /**
   * 파일 삽입
   * @param {FileList | File[]} fileList
   */
  insertFile(fileList: FileList | File[]) {
    const maxFileSize = MULTIPART.maxFileSize;
    const maxRequestSize = MULTIPART.maxRequestSize;

    let exceedingSizeIndex = -1;
    const exceedingSizeFileArray: string[] = [];
    const drapedFileArray: string[] = [];
    const duplicatedText = '';
    let overflowText = '';

    Array.from(fileList).forEach((file, index) => {
      if (file.size === 0) {
        return; // bypass 빈파일
      }

      if (file.size > maxFileSize) {
        exceedingSizeIndex = index;
        exceedingSizeFileArray.push(file.name);
        return;
      }

      const totalLength = this.fileLength + file.size;
      if (totalLength > maxRequestSize) {
        if (exceedingSizeIndex === -1) {
          exceedingSizeIndex = index;
        }
        overflowText = File.formatSize(totalLength) + ' / ' + File.formatSize(maxRequestSize);
        return;
      }

      drapedFileArray.push(file.name);
    });

    if (exceedingSizeFileArray.length > 0) {
      console.warn('exceeding size', exceedingSizeFileArray);
    }

    if (overflowText) {
      console.warn('overflow', overflowText);
    }

    if (duplicatedText) {
      console.warn('duplicated', duplicatedText);
    }

    if (exceedingSizeIndex > -1) {
      Array.from(fileList)
        .slice(0, exceedingSizeIndex)
        .forEach((file) => this.uploadToServer(file));
    } else {
      Array.from(fileList).forEach((file) => this.uploadToServer(file));
    }
  }

  /**
   * 첨부파일 변경시 이벤트
   * @param {Attach} attach
   */
  changeCallback(attach: Attach) {
    this.attach = attach;
    this.setFile();

    if (this.options.attachChangeCallback) {
      this.options.attachChangeCallback(attach);
    }
  }

  /**
   * 파일 정보 설정
   */
  setFile() {
    if (!this.attach) return;

    this.classList.toggle('file-empty', this.attach.attachFiles.length === 0);

    this.fileCount = this.attach.attachFiles.length;
    this.fileLength = this.attach.attachFiles.reduce((previousValue, attachFile) => {
      return previousValue + (attachFile.size || 0);
    }, 0);

    this.displayFile();
    this.displaySummary();
  }

  /**
   * 파일 목록 표시
   */
  displayFile() {
    if (!this.attach) return;

    this.fileList.innerHTML = this.attach.attachFiles.length === 0 ? '' : this.attach.attachFiles.map((file) => this.makeFileElement(file)).join('');
  }

  /**
   * 파일 아이템 생성
   * @param {AttachFile} file
   * @return {string}
   */
  makeFileElement(file: AttachFile): string {
    return `
      <li class="file-item">
        <span class="file-left">
          <label class="file-name">
            ${file.name}
          </label>
          <label class="file-size">
            ${File.formatSize(file.size)}
          </label>
        </span>
        <span class="file-right">
          <label class="file-remove" data-attachfileid="${file.id}">${windowButton.terminate}</label>
        </span>
      </li>`;
  }

  displaySummary() {
    this.fileSummary.innerHTML = `
      <label class="file-count" title="파일개수">${this.fileCount}</label>
      <label class="file-length" title="용량">${File.formatSize(this.fileLength)}</label>
      <label class="file-finder">파일 추가</label>
    `;
  }

  /**
   * 서버 파일 검색
   * @param {string} id
   */
  searchFile(id: string) {
    ApiClient.get(`/attach/${id}`)
      .then((attach) => this.changeCallback(attach as Attach))
      .catch((error) => console.error('searchFile', error));
  }

  /**
   * 현재 파일 삭제
   * @param {string} attachFileId
   */
  removeFile(attachFileId: string) {
    this.removeToServer(attachFileId);
  }

  get files(): AttachFile[] {
    return this.attach?.attachFiles ?? [];
  }

  /**
   * 파일 업로드
   * @param {File} file
   */
  uploadToServer(file: File) {
    if (!this.attach) return;

    const formData = new FormData();
    formData.append('id', this.attach.id);
    formData.append('file', file);

    ApiClient.putFormData('/attach', formData)
      .then((attach) => this.changeCallback(attach as Attach))
      .catch((error) => console.error('upload', error));
  }

  /**
   * 서버에 임시 저장된 파일 삭제
   * @param {string} attachFileId
   */
  removeToServer(attachFileId: string) {
    if (!this.attach) return;

    const formData = new FormData();
    formData.append('id', this.attach.id);
    formData.append('attachFileId', attachFileId);

    ApiClient.delete('/attach', { data: formData })
      .then((attach) => this.changeCallback(attach as Attach))
      .catch((error) => console.error('remove', error));
  }
}

// Define the new element
customElements.define('flay-attach', FlayAttach);
