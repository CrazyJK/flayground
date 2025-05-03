/**
 * 테이블 정렬을 위한 Web Worker
 *
 * 메인 스레드에서 분리된 별도의 스레드에서 정렬 작업을 수행합니다.
 */

// Web Worker 내부에서 메시지 수신 리스너
self.addEventListener('message', (e) => {
  const { rows, columnIndex, sortType, cellData } = e.data;

  // 정렬 수행
  const sortedRows = sortRows(rows, columnIndex, sortType, cellData);

  // 정렬 결과를 메인 스레드로 보냄
  self.postMessage({ sortedRows });
});

/**
 * 행 데이터 정렬 함수
 * @param {Array} rows 정렬할 행 배열
 * @param {number} columnIndex 정렬 기준 컬럼 인덱스
 * @param {number} sortType 정렬 타입 (0: 원래순서, 1: 오름차순, 2: 내림차순)
 * @param {Object} cellData 셀 데이터 캐시
 * @returns {Array} 정렬된 행 배열
 */
function sortRows(rows, columnIndex, sortType, cellData) {
  // 원래 순서(0)일 경우
  if (sortType === 0) {
    return rows.sort((a, b) => parseInt(a.originalIndex) - parseInt(b.originalIndex));
  }

  // 정렬 로직 수행
  return rows.sort((a, b) => {
    const dataA = cellData[a.id][columnIndex];
    const dataB = cellData[b.id][columnIndex];

    if (dataA.isNumber && dataB.isNumber) {
      // 숫자 데이터 정렬
      return sortType === 1 ? dataA.value - dataB.value : dataB.value - dataA.value;
    } else {
      // 문자열 데이터 정렬
      return sortType === 1 ? dataA.text.localeCompare(dataB.text) : dataB.text.localeCompare(dataA.text);
    }
  });
}
