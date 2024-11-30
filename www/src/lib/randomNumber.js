/**
 * 랜덤 난수
 *
 * @param {number} min 최솟값. 포함
 * @param {number} max 최댓값. 제외
 * @returns
 */
export function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * 랜덤 정수
 *
 * @param {number} min 최솟값. 포함
 * @param {number} max 최댓값. 제외
 * @returns
 */
export function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

/**
 * 랜덤 정수
 *
 * @param {number} min 최솟값. 포함
 * @param {number} max 최댓값. 포함
 * @returns
 */
export function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
