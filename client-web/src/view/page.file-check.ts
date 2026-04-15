import FilePasswordChecker, { PasswordCheckResult } from '@lib/FilePasswordChecker';
import FileUtils from '@lib/FileUtils';
import './inc/Page';
import './page.file-check.scss';

const dropZone = document.getElementById('drop-zone') as HTMLElement;
const fileInput = document.getElementById('file-input') as HTMLInputElement;
const resultSection = document.getElementById('result-section') as HTMLElement;
const resultTbody = document.getElementById('result-tbody') as HTMLTableSectionElement;
const resultCount = document.getElementById('result-count') as HTMLElement;
const clearBtn = document.getElementById('clear-btn') as HTMLButtonElement;

/** 처리된 결과 행 수 */
let rowCount = 0;

// 드롭존 클릭 → 파일 선택 다이얼로그 열기
dropZone.addEventListener('click', () => fileInput.click());

// 파일 선택 시 처리
fileInput.addEventListener('change', () => {
  if (fileInput.files?.length) {
    void processFiles(fileInput.files);
    fileInput.value = ''; // 동일 파일 재선택 가능하도록 초기화
  }
});

// 드래그 앤 드롭 이벤트
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  if (e.dataTransfer?.files.length) {
    void processFiles(e.dataTransfer.files);
  }
});

// 초기화 버튼
clearBtn.addEventListener('click', () => {
  resultTbody.innerHTML = '';
  rowCount = 0;
  updateResultCount();
  resultSection.classList.add('hidden');
});

/**
 * 파일 목록을 순차적으로 검사하고 결과를 테이블에 추가합니다.
 * @param files - 검사할 FileList
 */
async function processFiles(files: FileList): Promise<void> {
  resultSection.classList.remove('hidden');

  for (const file of Array.from(files)) {
    const row = addPendingRow(file);
    try {
      const result = await FilePasswordChecker.check(file);
      updateRow(row, result);
    } catch (err) {
      updateRowError(row, file.name, String(err));
    }
    rowCount++;
    updateResultCount();
  }
}

/**
 * 검사 중 상태의 임시 테이블 행을 추가합니다.
 * @param file - 검사 대상 파일
 * @returns 추가된 tr 엘리먼트
 */
function addPendingRow(file: File): HTMLTableRowElement {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td class="col-name">${escapeHtml(file.name)}</td>
    <td class="col-format">-</td>
    <td class="col-size">${FileUtils.formatSize(file.size)}</td>
    <td class="col-status status-processing">검사 중...</td>
  `;
  resultTbody.appendChild(tr);
  return tr;
}

/**
 * 임시 행을 검사 결과로 업데이트합니다.
 * @param tr - 업데이트할 tr 엘리먼트
 * @param result - 비밀번호 확인 결과
 */
function updateRow(tr: HTMLTableRowElement, result: PasswordCheckResult): void {
  const { statusClass, statusText } = getStatusDisplay(result);
  tr.innerHTML = `
    <td class="col-name">${escapeHtml(result.fileName)}</td>
    <td class="col-format">${escapeHtml(result.format)}</td>
    <td class="col-size">${FileUtils.formatSize(result.fileSize)}</td>
    <td class="col-status ${statusClass}">${statusText}</td>
  `;
}

/**
 * 오류 발생 시 행을 오류 상태로 업데이트합니다.
 * @param tr - 업데이트할 tr 엘리먼트
 * @param fileName - 파일명
 * @param errorMsg - 오류 메시지
 */
function updateRowError(tr: HTMLTableRowElement, fileName: string, errorMsg: string): void {
  const cells = tr.querySelectorAll('td');
  if (cells[3]) {
    cells[3].className = 'col-status status-error';
    cells[3].textContent = `오류: ${errorMsg}`;
  }
  if (cells[0]) {
    cells[0].textContent = fileName;
  }
}

/**
 * 결과에 따른 상태 CSS 클래스와 표시 텍스트를 반환합니다.
 * @param result - 비밀번호 확인 결과
 * @returns 상태 클래스와 텍스트
 */
function getStatusDisplay(result: PasswordCheckResult): { statusClass: string; statusText: string } {
  if (result.message.includes('지원하지 않는')) {
    return { statusClass: 'status-unsupported', statusText: '⚠ 미지원 형식' };
  }
  if (result.message.includes('오류') || result.message.includes('파싱')) {
    return { statusClass: 'status-error', statusText: `⚠ ${result.message}` };
  }
  if (result.hasPassword) {
    return { statusClass: 'status-locked', statusText: '🔒 설정됨' };
  }
  return { statusClass: 'status-unlocked', statusText: '🔓 없음' };
}

/**
 * 결과 건수 표시를 업데이트합니다.
 */
function updateResultCount(): void {
  resultCount.textContent = rowCount > 0 ? `(${rowCount}건)` : '';
}

/**
 * HTML 특수문자를 이스케이프합니다.
 * @param str - 이스케이프할 문자열
 * @returns 이스케이프된 문자열
 */
function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
