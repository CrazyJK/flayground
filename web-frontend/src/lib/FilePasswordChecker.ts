/**
 * 파일의 비밀번호 보호 여부를 확인하는 유틸리티 모듈
 *
 * 지원 형식:
 * - HWP/HWPX (한글 워드프로세서)
 * - DOC/DOCX (Microsoft Word)
 * - XLS/XLSX (Microsoft Excel)
 * - PPT/PPTX (Microsoft PowerPoint)
 * - ZIP
 * - PDF
 *
 * 탐지 원리:
 * - ZIP 기반(DOCX/XLSX/PPTX/HWPX/ZIP): PK 매직 → 미암호화, OLE 매직 → 암호화
 * - OLE/CFB 기반(DOC/XLS/PPT/HWP): OLE 구조 파싱으로 암호화 플래그 및 스트림 확인
 * - PDF: Encrypt 딕셔너리 존재 여부 및 /Encrypt 크로스 참조 확인
 */

/** OLE/CFB 파일 매직 바이트 (D0 CF 11 E0 A1 B1 1A E1) */
const OLE_MAGIC = new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);

/** 지원하는 파일 확장자 목록 */
export const SUPPORTED_EXTENSIONS = ['hwp', 'hwpx', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'pdf'] as const;

/** 파일 input accept 속성 문자열 */
export const FILE_ACCEPT = '.hwp,.hwpx,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.pdf';

/** 비밀번호 확인 결과 */
export interface PasswordCheckResult {
  /** 파일명 */
  fileName: string;
  /** 파일 크기 (바이트) */
  fileSize: number;
  /** 파일 형식 설명 (예: "DOCX (Word)") */
  format: string;
  /** 비밀번호 설정 여부 */
  hasPassword: boolean;
  /** 결과 메시지 */
  message: string;
}

/** OLE 디렉토리 엔트리 */
interface OLEDirEntry {
  /** 스트림/스토리지 이름 */
  name: string;
  /** 엔트리 타입 (0=미사용, 1=스토리지, 2=스트림, 5=루트) */
  type: number;
  /** 시작 섹터 번호 */
  startSector: number;
  /** 스트림 크기 (바이트) */
  size: number;
}

/**
 * 다양한 오피스 파일 형식의 비밀번호 보호 여부를 클라이언트 측에서 확인하는 유틸리티 클래스
 */
export default class FilePasswordChecker {
  /**
   * 파일의 비밀번호 보호 여부를 확인합니다.
   * @param file - 검사할 File 객체
   * @returns 비밀번호 확인 결과 Promise
   */
  static async check(file: File): Promise<PasswordCheckResult> {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    const format = this.#getFormatName(ext);
    const base = { fileName: file.name, fileSize: file.size, format };

    if (!(SUPPORTED_EXTENSIONS as readonly string[]).includes(ext)) {
      return { ...base, hasPassword: false, message: '지원하지 않는 파일 형식입니다.' };
    }

    let bytes: Uint8Array;
    try {
      bytes = new Uint8Array(await file.arrayBuffer());
    } catch {
      return { ...base, hasPassword: false, message: '파일을 읽을 수 없습니다.' };
    }

    if (bytes.length < 8) {
      return { ...base, hasPassword: false, message: '파일이 손상되었거나 너무 작습니다.' };
    }

    // 파일 형식 판별: OLE (D0 CF 11 E0) vs ZIP (PK)
    const isOLE = OLE_MAGIC.every((b, i) => bytes[i] === b);
    const isZIP = bytes[0] === 0x50 && bytes[1] === 0x4b;
    // PDF 매직: %PDF (25 50 44 46)
    const isPDF = bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;

    if (isPDF) {
      return { ...base, ...this.#checkPDF(bytes) };
    } else if (isOLE) {
      return { ...base, ...this.#checkOLE(bytes, ext) };
    } else if (isZIP) {
      return { ...base, ...this.#checkZIP(bytes, ext) };
    }
    return { ...base, hasPassword: false, message: '알 수 없는 파일 형식 또는 손상된 파일입니다.' };
  }

  /**
   * ZIP 기반 파일의 비밀번호 보호 여부를 확인합니다.
   * - OOXML/HWPX: ZIP 시작 → 미암호화, OLE 시작 → 암호화(#checkOLE에서 처리)
   * - ZIP: 로컬 파일 헤더의 일반 목적 비트 플래그 bit 0 확인
   *
   * @param bytes - 파일 바이너리
   * @param ext - 소문자 확장자
   */
  static #checkZIP(bytes: Uint8Array, ext: string): Pick<PasswordCheckResult, 'hasPassword' | 'message'> {
    // OOXML/HWPX 파일이 PK(ZIP)로 시작하면 → 암호화 안 됨
    if (['docx', 'xlsx', 'pptx', 'hwpx'].includes(ext)) {
      return { hasPassword: false, message: '비밀번호가 설정되어 있지 않습니다.' };
    }

    // ZIP 파일: 로컬 파일 헤더(PK\x03\x04) 확인
    // 헤더 구조: 시그니처(4) + 버전(2) + 플래그(2) ...
    // 플래그 bit 0 = 암호화
    if (bytes.length >= 8 && bytes[2] === 0x03 && bytes[3] === 0x04) {
      const flag = (bytes[6] ?? 0) | ((bytes[7] ?? 0) << 8);
      if (flag & 0x01) {
        return { hasPassword: true, message: '비밀번호가 설정되어 있습니다.' };
      }
    }
    return { hasPassword: false, message: '비밀번호가 설정되어 있지 않습니다.' };
  }

  /**
   * OLE/CFB 기반 파일의 비밀번호 보호 여부를 확인합니다.
   *
   * 탐지 순서:
   * 1. OOXML/HWPX가 OLE로 저장되었으면 → 암호화됨
   * 2. "EncryptionInfo" 스트림 존재 여부 확인 (현대 Office 암호화)
   * 3. 형식별 상세 확인 (HWP FileHeader, DOC FIB, XLS Workbook)
   *
   * @param bytes - 파일 바이너리
   * @param ext - 소문자 확장자
   */
  static #checkOLE(bytes: Uint8Array, ext: string): Pick<PasswordCheckResult, 'hasPassword' | 'message'> {
    // OOXML/HWPX 파일이 OLE 컨테이너에 저장된 경우 → 암호화됨
    if (['docx', 'xlsx', 'pptx', 'hwpx'].includes(ext)) {
      return { hasPassword: true, message: '비밀번호가 설정되어 있습니다.' };
    }

    try {
      const view = new DataView(bytes.buffer);

      // OLE 헤더 파싱 (MS-CFB 스펙 기준)
      const sectorSizeExp = view.getUint16(0x1e, true); // 보통 9 → 512 bytes
      const miniSectorSizeExp = view.getUint16(0x20, true); // 보통 6 → 64 bytes
      const sectorSize = 1 << sectorSizeExp;
      const miniSectorSize = 1 << miniSectorSizeExp;
      const numFATSectors = view.getUint32(0x2c, true);
      const firstDirSector = view.getUint32(0x30, true);
      const miniStreamCutoff = view.getUint32(0x38, true); // 보통 4096
      const firstMiniFATSector = view.getInt32(0x3c, true);
      const numMiniFATSectors = view.getUint32(0x40, true);

      if (sectorSize < 64 || sectorSize > 65536) {
        return { hasPassword: false, message: '파일 구조를 파싱할 수 없습니다.' };
      }

      // FAT 구성 및 디렉토리 엔트리 읽기
      const fat = this.#buildFAT(view, bytes, sectorSize, numFATSectors);
      const dirEntries = this.#readDirEntries(view, bytes, sectorSize, firstDirSector, fat);

      // "EncryptionInfo" 스트림 존재 시 = 현대 Office 암호화 (Office 2007+)
      if (dirEntries.some((e) => e.name === 'EncryptionInfo')) {
        return { hasPassword: true, message: '비밀번호가 설정되어 있습니다.' };
      }

      // mini-stream 준비 (루트 엔트리의 데이터가 mini-stream 컨테이너)
      const rootEntry = dirEntries.find((e) => e.type === 5);
      let miniStreamData: Uint8Array<ArrayBufferLike> = new Uint8Array(0);
      let miniFAT: Int32Array<ArrayBufferLike> = new Int32Array(0);
      if (rootEntry && rootEntry.startSector >= 0 && numMiniFATSectors > 0 && firstMiniFATSector >= 0) {
        miniStreamData = this.#readStream(bytes, sectorSize, rootEntry.startSector, rootEntry.size, fat);
        miniFAT = this.#buildMiniFAT(view, bytes, sectorSize, firstMiniFATSector, fat, numMiniFATSectors);
      }

      /**
       * 주어진 디렉토리 엔트리의 스트림 데이터를 읽습니다.
       * 크기가 miniStreamCutoff 미만이면 mini-stream에서, 이상이면 일반 FAT에서 읽습니다.
       */
      const readEntry = (entry: OLEDirEntry, maxBytes = 8192): Uint8Array => {
        const readSize = Math.min(entry.size, maxBytes);
        if (entry.size < miniStreamCutoff && entry.type !== 5 && miniFAT.length > 0) {
          return this.#readMiniStreamEntry(miniStreamData, miniFAT, entry.startSector, readSize, miniSectorSize);
        }
        return this.#readStream(bytes, sectorSize, entry.startSector, readSize, fat);
      };

      // 형식별 상세 탐지
      switch (ext) {
        case 'hwp':
          return this.#checkHWP(dirEntries, readEntry);
        case 'doc':
          return this.#checkDOC(dirEntries, readEntry);
        case 'xls':
          return this.#checkXLS(dirEntries, readEntry);
        default:
          return { hasPassword: false, message: '비밀번호가 설정되어 있지 않습니다.' };
      }
    } catch {
      return { hasPassword: false, message: '파일 분석 중 오류가 발생했습니다.' };
    }
  }

  /**
   * HWP 5.x 파일의 비밀번호 보호 여부를 확인합니다.
   *
   * FileHeader 스트림 구조 (오프셋 36, 4바이트 attribute 플래그):
   * - bit 0: 압축 여부
   * - bit 1: 비밀번호 설정 여부 ← 이것을 확인
   * - bit 2: 배포용 문서
   *
   * @param dirEntries - OLE 디렉토리 엔트리 목록
   * @param readEntry - 엔트리 데이터 읽기 함수
   */
  static #checkHWP(dirEntries: OLEDirEntry[], readEntry: (e: OLEDirEntry) => Uint8Array): Pick<PasswordCheckResult, 'hasPassword' | 'message'> {
    const entry = dirEntries.find((e) => e.name === 'FileHeader');
    if (entry && entry.startSector >= 0) {
      const data = readEntry(entry);
      if (data.length >= 40) {
        // HWP FileHeader 구조: [0..31] 시그니처, [32..35] 버전, [36..39] 속성 플래그
        const attr = new DataView(data.buffer, data.byteOffset).getUint32(36, true);
        if (attr & 0x02) {
          return { hasPassword: true, message: '비밀번호가 설정되어 있습니다.' };
        }
      }
    }
    return { hasPassword: false, message: '비밀번호가 설정되어 있지 않습니다.' };
  }

  /**
   * DOC (Word 97-2003) 파일의 비밀번호 보호 여부를 확인합니다.
   *
   * WordDocument 스트림의 FIB(File Information Block) 구조:
   * - 오프셋 10 (2바이트 flags): bit 8 (0x0100) = fEncrypted
   *
   * @param dirEntries - OLE 디렉토리 엔트리 목록
   * @param readEntry - 엔트리 데이터 읽기 함수
   */
  static #checkDOC(dirEntries: OLEDirEntry[], readEntry: (e: OLEDirEntry) => Uint8Array): Pick<PasswordCheckResult, 'hasPassword' | 'message'> {
    const entry = dirEntries.find((e) => e.name === 'WordDocument');
    if (entry && entry.startSector >= 0) {
      const data = readEntry(entry);
      if (data.length >= 12) {
        // FIB flags at offset 10: bit 8 = fEncrypted
        const flags = new DataView(data.buffer, data.byteOffset).getUint16(10, true);
        if (flags & 0x0100) {
          return { hasPassword: true, message: '비밀번호가 설정되어 있습니다.' };
        }
      }
    }
    return { hasPassword: false, message: '비밀번호가 설정되어 있지 않습니다.' };
  }

  /**
   * XLS (Excel 97-2003) 파일의 비밀번호 보호 여부를 확인합니다.
   *
   * Workbook/Book 스트림의 BIFF 레코드에서 FILEPASS 레코드(타입 0x002F)를 탐색합니다.
   *
   * @param dirEntries - OLE 디렉토리 엔트리 목록
   * @param readEntry - 엔트리 데이터 읽기 함수
   */
  static #checkXLS(dirEntries: OLEDirEntry[], readEntry: (e: OLEDirEntry) => Uint8Array): Pick<PasswordCheckResult, 'hasPassword' | 'message'> {
    const entry = dirEntries.find((e) => e.name === 'Workbook') ?? dirEntries.find((e) => e.name === 'Book');
    if (entry && entry.startSector >= 0) {
      const data = readEntry(entry);
      const dv = new DataView(data.buffer, data.byteOffset);
      let pos = 0;
      while (pos + 4 <= data.length) {
        const recType = dv.getUint16(pos, true);
        const recLen = dv.getUint16(pos + 2, true);
        // FILEPASS 레코드 발견 시 암호화됨
        if (recType === 0x002f) {
          return { hasPassword: true, message: '비밀번호가 설정되어 있습니다.' };
        }
        // Boundsheet 레코드 이후로는 FILEPASS가 나타나지 않으므로 탐색 중단
        if (recType === 0x0085) break;
        pos += 4 + recLen;
      }
    }
    return { hasPassword: false, message: '비밀번호가 설정되어 있지 않습니다.' };
  }

  /**
   * OLE 헤더의 DIFAT 배열을 이용하여 FAT(File Allocation Table)를 구성합니다.
   *
   * FAT 항목 특수값:
   * - -2 (0xFFFFFFFE): ENDOFCHAIN
   * - -1 (0xFFFFFFFF): FREESECT
   * - -3 (0xFFFFFFFD): FATSECT
   * - -4 (0xFFFFFFFC): DIFSECT
   *
   * @param view - 파일 DataView
   * @param bytes - 파일 바이너리
   * @param sectorSize - 섹터 크기 (바이트)
   * @param numFATSectors - FAT 섹터 수
   * @returns FAT 배열 (섹터 번호 → 다음 섹터 번호)
   */
  static #buildFAT(view: DataView, bytes: Uint8Array, sectorSize: number, numFATSectors: number): Int32Array {
    const entriesPerSector = sectorSize / 4;
    const fat = new Int32Array(numFATSectors * entriesPerSector);
    let fatIdx = 0;

    // DIFAT 초기 배열: 헤더 오프셋 0x4C부터 109개 항목
    const maxDIFAT = Math.min(109, numFATSectors);
    for (let i = 0; i < maxDIFAT; i++) {
      const fatSectorNum = view.getInt32(0x4c + i * 4, true);
      if (fatSectorNum < 0) break;

      const sectorOffset = 512 + fatSectorNum * sectorSize;
      if (sectorOffset + sectorSize > bytes.length) break;

      for (let j = 0; j < entriesPerSector && fatIdx < fat.length; j++) {
        fat[fatIdx++] = view.getInt32(sectorOffset + j * 4, true);
      }
    }
    return fat;
  }

  /**
   * mini-FAT(Small Block Allocation Table)를 구성합니다.
   *
   * @param view - 파일 DataView
   * @param bytes - 파일 바이너리
   * @param sectorSize - 일반 섹터 크기 (바이트)
   * @param firstMiniFATSector - mini-FAT 첫 번째 섹터 번호
   * @param fat - 일반 FAT 배열
   * @param numMiniFATSectors - mini-FAT 섹터 수
   * @returns mini-FAT 배열
   */
  static #buildMiniFAT(view: DataView, bytes: Uint8Array, sectorSize: number, firstMiniFATSector: number, fat: Int32Array, numMiniFATSectors: number): Int32Array {
    const entriesPerSector = sectorSize / 4;
    const miniFAT = new Int32Array(numMiniFATSectors * entriesPerSector);
    let idx = 0;
    let sector = firstMiniFATSector;
    const visited = new Set<number>();

    while (sector >= 0 && sector !== -2 && !visited.has(sector)) {
      visited.add(sector);
      const sectorOffset = 512 + sector * sectorSize;
      if (sectorOffset + sectorSize > bytes.length) break;

      for (let j = 0; j < entriesPerSector && idx < miniFAT.length; j++) {
        miniFAT[idx++] = view.getInt32(sectorOffset + j * 4, true);
      }
      sector = sector >= 0 && sector < fat.length ? (fat[sector] ?? -2) : -2;
    }
    return miniFAT;
  }

  /**
   * OLE 디렉토리 섹터 체인을 따라 모든 디렉토리 엔트리를 읽습니다.
   *
   * @param view - 파일 DataView
   * @param bytes - 파일 바이너리
   * @param sectorSize - 섹터 크기 (바이트)
   * @param firstDirSector - 첫 번째 디렉토리 섹터 번호
   * @param fat - FAT 배열
   * @returns 디렉토리 엔트리 목록
   */
  static #readDirEntries(view: DataView, bytes: Uint8Array, sectorSize: number, firstDirSector: number, fat: Int32Array): OLEDirEntry[] {
    const entries: OLEDirEntry[] = [];
    let sector = firstDirSector;
    const visited = new Set<number>();

    while (sector >= 0 && sector !== -2 && !visited.has(sector)) {
      visited.add(sector);
      const sectorOffset = 512 + sector * sectorSize;
      if (sectorOffset + sectorSize > bytes.length) break;

      // 섹터당 128바이트 엔트리가 (sectorSize / 128)개 존재
      for (let i = 0; i < sectorSize / 128; i++) {
        const entryOffset = sectorOffset + i * 128;
        const nameLen = view.getUint16(entryOffset + 64, true);
        const type = bytes[entryOffset + 66] ?? 0;

        if (type === 0 || nameLen === 0 || nameLen > 64) continue;

        // 이름: UTF-16LE, 널 종결자 제외 (nameLen / 2 - 1 문자)
        const nameChars: string[] = [];
        for (let j = 0; j < nameLen / 2 - 1; j++) {
          nameChars.push(String.fromCharCode(view.getUint16(entryOffset + j * 2, true)));
        }

        entries.push({
          name: nameChars.join(''),
          type,
          startSector: view.getInt32(entryOffset + 116, true),
          size: view.getUint32(entryOffset + 120, true),
        });
      }

      sector = sector >= 0 && sector < fat.length ? (fat[sector] ?? -2) : -2;
    }
    return entries;
  }

  /**
   * FAT 체인을 따라 일반 스트림 데이터를 읽습니다.
   *
   * @param bytes - 파일 바이너리
   * @param sectorSize - 섹터 크기 (바이트)
   * @param startSector - 시작 섹터 번호
   * @param size - 읽을 바이트 수
   * @param fat - FAT 배열
   * @returns 스트림 데이터
   */
  static #readStream(bytes: Uint8Array, sectorSize: number, startSector: number, size: number, fat: Int32Array): Uint8Array {
    const buf = new Uint8Array(Math.min(size, bytes.length));
    let offset = 0;
    let sector = startSector;
    const visited = new Set<number>();

    while (sector >= 0 && sector !== -2 && offset < buf.length && !visited.has(sector)) {
      visited.add(sector);
      const sectorOffset = 512 + sector * sectorSize;
      if (sectorOffset >= bytes.length) break;

      const toCopy = Math.min(sectorSize, buf.length - offset, bytes.length - sectorOffset);
      buf.set(bytes.subarray(sectorOffset, sectorOffset + toCopy), offset);
      offset += toCopy;

      sector = sector >= 0 && sector < fat.length ? (fat[sector] ?? -2) : -2;
    }
    return buf.subarray(0, offset);
  }

  /**
   * mini-stream 컨테이너에서 스트림 데이터를 읽습니다.
   *
   * mini-sector N의 위치 = mini-stream 컨테이너 내 오프셋 N * miniSectorSize
   *
   * @param miniStreamData - mini-stream 컨테이너 데이터
   * @param miniFAT - mini-FAT 배열
   * @param startSector - 시작 mini-섹터 번호
   * @param size - 읽을 바이트 수
   * @param miniSectorSize - mini-섹터 크기 (보통 64 바이트)
   * @returns 스트림 데이터
   */
  static #readMiniStreamEntry(miniStreamData: Uint8Array, miniFAT: Int32Array, startSector: number, size: number, miniSectorSize: number): Uint8Array {
    const buf = new Uint8Array(size);
    let offset = 0;
    let sector = startSector;
    const visited = new Set<number>();

    while (sector >= 0 && sector !== -2 && offset < size && !visited.has(sector)) {
      visited.add(sector);
      const miniOffset = sector * miniSectorSize;
      if (miniOffset >= miniStreamData.length) break;

      const toCopy = Math.min(miniSectorSize, size - offset, miniStreamData.length - miniOffset);
      buf.set(miniStreamData.subarray(miniOffset, miniOffset + toCopy), offset);
      offset += toCopy;

      sector = sector >= 0 && sector < miniFAT.length ? (miniFAT[sector] ?? -2) : -2;
    }
    return buf;
  }

  /**
   * PDF 파일의 비밀번호 보호 여부를 확인합니다.
   *
   * PDF 암호화 탐지 전략 (두 가지 방식):
   *
   * 1. xref 테이블 기반 파싱:
   *    - PDF 파일 끝에서 startxref 오프셋을 찾아 xref 테이블 또는 xref 스트림으로 이동
   *    - trailer 딕셔너리에 /Encrypt 항목이 있으면 암호화됨
   *
   * 2. 단순 텍스트 스캔 (폴백):
   *    - 전체 바이너리에서 "/Encrypt" 토큰 직접 탐색
   *    - 딕셔너리 값(숫자 간접참조 또는 인라인 딕셔너리)이 있으면 암호화로 판단
   *
   * @param bytes - 파일 바이너리
   */
  static #checkPDF(bytes: Uint8Array): Pick<PasswordCheckResult, 'hasPassword' | 'message'> {
    const decoder = new TextDecoder('latin1');

    // xref/trailer 파싱은 큰 파일에서 비용이 크므로 끝부분(최대 2KB)만 디코딩
    const tailSize = Math.min(2048, bytes.length);
    const tail = decoder.decode(bytes.subarray(bytes.length - tailSize));

    // startxref 위치에서 xref 오프셋 추출
    const startxrefMatch = /startxref\s+(\d+)/g;
    let xrefOffset = -1;
    let m: RegExpExecArray | null;
    // 마지막 startxref를 사용 (업데이트된 PDF 고려)
    while ((m = startxrefMatch.exec(tail)) !== null) {
      xrefOffset = parseInt(m[1] ?? '0', 10);
    }

    if (xrefOffset >= 0 && xrefOffset < bytes.length) {
      // xref 테이블 또는 xref 스트림 주변 4KB를 디코딩하여 trailer 탐색
      const scanEnd = Math.min(xrefOffset + 4096, bytes.length);
      const xrefArea = decoder.decode(bytes.subarray(xrefOffset, scanEnd));

      // trailer 딕셔너리에서 /Encrypt 항목 확인
      // 패턴: /Encrypt <숫자 간접참조> 또는 /Encrypt << ... >>
      if (/\/Encrypt\s*(\d+\s+\d+\s+R|<<)/.test(xrefArea)) {
        return { hasPassword: true, message: '비밀번호가 설정되어 있습니다.' };
      }
    }

    // 폴백: 전체 파일에서 /Encrypt 토큰 스캔 (최대 512KB)
    const scanSize = Math.min(524288, bytes.length);
    const fullText = decoder.decode(bytes.subarray(0, scanSize));
    if (/\/Encrypt\s*(\d+\s+\d+\s+R|<<)/.test(fullText)) {
      return { hasPassword: true, message: '비밀번호가 설정되어 있습니다.' };
    }

    return { hasPassword: false, message: '비밀번호가 설정되어 있지 않습니다.' };
  }

  /**
   * 확장자에 따른 파일 형식 이름을 반환합니다.
   * @param ext - 소문자 확장자
   * @returns 형식 이름 (예: "DOCX (Word)")
   */
  static #getFormatName(ext: string): string {
    const formats: Record<string, string> = {
      hwp: 'HWP (한글)',
      hwpx: 'HWPX (한글)',
      doc: 'DOC (Word)',
      docx: 'DOCX (Word)',
      xls: 'XLS (Excel)',
      xlsx: 'XLSX (Excel)',
      ppt: 'PPT (PowerPoint)',
      pptx: 'PPTX (PowerPoint)',
      zip: 'ZIP',
      pdf: 'PDF',
    };
    return formats[ext] ?? ext.toUpperCase();
  }
}
