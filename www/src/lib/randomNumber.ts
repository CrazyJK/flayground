/**
 * 랜덤 난수를 생성합니다.
 *
 * @param min 최솟값. 포함
 * @param max 최댓값. 제외
 * @returns min(포함)과 max(제외) 사이의 랜덤 부동소수점 숫자
 * @throws min이 max보다 크거나 같을 경우
 */
export function getRandomArbitrary(min: number, max: number): number {
  if (min >= max) {
    throw new Error('최솟값은 최댓값보다 작아야 합니다.');
  }
  return Math.random() * (max - min) + min;
}

/**
 * 랜덤 정수를 생성합니다.
 *
 * @param min 최솟값. 포함
 * @param max 최댓값. 제외
 * @returns min(포함)과 max(제외) 사이의 랜덤 정수
 * @throws min이 max보다 크거나 같을 경우
 */
export function getRandomInt(min: number, max: number): number {
  if (min >= max) {
    throw new Error('최솟값은 최댓값보다 작아야 합니다.');
  }
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

/**
 * 최솟값과 최댓값을 모두 포함하는 랜덤 정수를 생성합니다.
 *
 * @param min 최솟값. 포함
 * @param max 최댓값. 포함
 * @returns min과 max를 모두 포함하는 범위 내의 랜덤 정수
 * @throws min이 max보다 클 경우
 */
export function getRandomIntInclusive(min: number, max: number): number {
  if (min > max) {
    throw new Error('최솟값은 최댓값보다 크면 안 됩니다.');
  }
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 주어진 배열에서 랜덤 요소를 선택합니다.
 *
 * @param array 선택할 배열
 * @returns 배열에서 무작위로 선택된 요소
 * @throws 빈 배열이 주어진 경우
 */
export function getRandomArrayElement<T>(array: T[]): T {
  if (!Array.isArray(array) || array.length === 0) {
    throw new Error('유효한 배열이 필요합니다.');
  }
  return array[getRandomInt(0, array.length)];
}
