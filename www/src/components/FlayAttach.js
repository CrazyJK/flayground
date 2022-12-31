/**
 * 커스텀 파일 첨부 박스
 */
export default class FlayAttach extends HTMLElement {
  constructor() {
    super();

    // shadow root을 생성합니다
    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다

    this.dataTransfer = new DataTransfer();

    const wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'wrapper');

    this.fileList = wrapper.appendChild(document.createElement('ol'));

    const fileInput = wrapper.appendChild(document.createElement('input'));
    fileInput.setAttribute('type', 'file');

    const style = document.createElement('style');
    style.textContent = `
      .wrapper {
        position: relative;
        width: 100%;
        height: 100%;
      }
      .wrapper.attach-dragover {
        background-color: rgba(0, 0, 0, 0.5);
      }
      .wrapper > input[type="file"] {
        position: absolute;
        width: 1px;
        height: 1px;
        display: none;
      }
      .wrapper > ol {
        height: 100%;
        overflow: auto;
        margin: 0;
        padding: 0 0 0 0.5rem;
      }
      .wrapper > ol > li {
        display: flex;
        align-items: baseline;
        gap: 1rem;
        margin: 0.125rem;
        padding: 0.125rem 0.25rem;
        border-radius: 0.25rem;
      }
      .wrapper > ol > li:hover {
        background-color: rgba(0, 0, 0, 0.125);
      }
      .wrapper > ol > li > button {
        background-color: transparent;
        border: 0;
        color: red;
      }
      .wrapper > ol > li > button:hover {
        text-shadow: 1px 1px black;
      }
    `;

    // 드래그
    this.shadowRoot.addEventListener('dragover', (e) => {
      // console.log('dragover', e);
      // 드롭을 허용하기 위해 기본 동작 취소
      e.preventDefault();
    });
    this.shadowRoot.addEventListener('dragenter', (e) => {
      console.log('dragenter', e.target.tagName);
      // 드래그 가능한 요소가 대상 위로 오면. 반응하고 있다는 표시
      wrapper.classList.add('attach-dragover');
    });
    this.shadowRoot.addEventListener('dragleave', (e) => {
      console.log('dragleave', e.target.tagName);
      if (e.target.tagName === 'OL') {
        // 드래그 가능한 요소가 대상 밖으로 나가면
        wrapper.classList.remove('attach-dragover');
      }
    });
    this.shadowRoot.addEventListener('drop', (e) => {
      console.log('drop', e.target.tagName);
      // 기본 동작 취소
      e.preventDefault();
      e.stopPropagation();
      // 드래그한 요소를 선택한 드롭 대상으로 이동
      wrapper.classList.remove('attach-dragover');

      Array.from(e.dataTransfer.files).forEach((file) => {
        if (!this.containsFile(file)) {
          this.dataTransfer.items.add(file);
        }
      });

      this.renderFileList();
    });

    // file 삭제 버튼 이벤트
    this.shadowRoot.addEventListener('click', (e) => {
      if (e.target.className !== 'file-remove') return;

      const removeTargetId = e.target.dataset.index;
      const tmpDataTranster = new DataTransfer();
      Array.from(this.dataTransfer.files)
        .filter((file) => file.lastModified != removeTargetId)
        .forEach((file) => {
          tmpDataTranster.items.add(file);
        });
      this.dataTransfer = tmpDataTranster;

      this.renderFileList();
    });

    // 생성된 요소들을 shadow DOM에 부착합니다
    this.shadowRoot.append(style, wrapper);
  }

  containsFile(defFile) {
    return Array.from(this.dataTransfer.files).filter((file) => file.lastModified === defFile.lastModified).length > 0;
  }

  renderFileList() {
    console.log('renderFileList', this.dataTransfer.files);
    this.fileList.innerHTML = '';
    Array.from(this.dataTransfer.files).forEach((file) => {
      this.fileList.innerHTML += `
        <li id="${file.lastModified}">
          <label>${file.name}</label>
          <button data-index='${file.lastModified}' class='file-remove'>X</button>
        </li>`;
    });

    this.dispatchEvent(new CustomEvent('change', { detail: { files: this.getFiles() }, cancelable: true, composed: false, bubbles: false }));
  }

  getFiles() {
    return this.dataTransfer.files;
  }

  upload(url) {
    // upload file
  }
}

// Define the new element
customElements.define('flay-attach', FlayAttach);
