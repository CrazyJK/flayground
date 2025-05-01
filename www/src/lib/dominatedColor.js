/**
 * 회색 RGB 배열 (0-255까지의 모든 회색 색상)
 * @type {Array<Array<number>>}
 */
const GREY_RGB_ARRAY = Array.from({ length: 256 }).map((_, i) => [i, i, i]);

/**
 * 이미지 데이터에서 RGBA 색상 분포를 추출하는 함수
 * @param {Uint8ClampedArray} data - 이미지 픽셀 데이터
 * @param {Array<Array<number>>} ignoreRGBs - 무시할 RGB 색상 배열
 * @param {number} offset - 색상 값 그룹화를 위한 오프셋
 * @returns {Array<{rgba: Array<number>, count: number}>} - 사용 빈도별로 정렬된 RGBA 색상 배열
 */
const getRGBAs = (data, ignoreRGBs, offset) => {
  // 미리 문자열 변환하여 성능 최적화
  const ignoreRgbStrings = new Set(ignoreRGBs.map((i) => i.join(',')));

  const countMap = {};
  const dataLength = data.length;

  for (let i = 0; i < dataLength; i += 4) {
    const alpha = data[i + 3];

    // 완전히 투명한 픽셀은 건너뜀
    if (alpha === 0) {
      continue;
    }

    // 메모리 효율을 위해 TypedArray.slice 대신 개별 요소 추출
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // 유효하지 않은 색상 데이터는 건너뜀
    if (r === undefined || g === undefined || b === undefined) {
      console.error('유효하지 않은 RGB 컴포넌트', [r, g, b]);
      continue;
    }

    // 오프셋 적용하여 색상 그룹화
    let finalR = r;
    let finalG = g;
    let finalB = b;

    if (offset > 1) {
      finalR = Math.round(Math.floor(r / offset) * offset);
      finalG = Math.round(Math.floor(g / offset) * offset);
      finalB = Math.round(Math.floor(b / offset) * offset);
    }

    // 무시 목록에 있는 색상은 건너뜀
    const rgbString = `${finalR},${finalG},${finalB}`;
    if (ignoreRgbStrings.size > 0 && ignoreRgbStrings.has(rgbString)) {
      continue;
    }

    // 알파 값을 0-1 범위로 정규화
    const normalizedAlpha = Number((alpha / 255).toFixed(3));

    // 고유 키 생성 (더 빠른 조회를 위해)
    const key = `${rgbString},${normalizedAlpha}`;

    if (countMap[key]) {
      countMap[key].count++;
    } else {
      countMap[key] = {
        rgba: [finalR, finalG, finalB, normalizedAlpha],
        count: 1,
      };
    }
  }

  return Object.values(countMap).sort((a, b) => b.count - a.count);
};

/**
 * 이미지용 캔버스 컨텍스트를 가져오는 함수
 * @param {HTMLImageElement} img - 이미지 요소
 * @param {number} width - 캔버스 너비
 * @param {number} height - 캔버스 높이
 * @returns {CanvasRenderingContext2D} - 2D 캔버스 컨텍스트
 */
const getContext = (img, width, height) => {
  // 이미지 부모에 존재하는 캔버스를 재사용하거나 새로 생성
  let canvas = img.parentNode?.querySelector('.dominated-color-canvas');

  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.classList.add('dominated-color-canvas');
    canvas.style.display = 'none'; // 더 간결한 style 설정 방식

    if (img.parentNode) {
      img.parentNode.appendChild(canvas);
    } else {
      // 부모 노드가 없는 경우 처리
      document.body.appendChild(canvas);
    }
  }

  canvas.width = width; // 속성 직접 설정이 더 효율적
  canvas.height = height;

  return canvas.getContext('2d', { willReadFrequently: true });
};

/**
 * 이미지에서 컨텍스트 이미지 데이터를 추출하는 함수
 * @param {HTMLImageElement} img - 이미지 요소
 * @param {number} scale - 이미지 스케일 (0-1 사이)
 * @returns {Uint8ClampedArray} - 이미지 픽셀 데이터
 */
const getContextImageData = (img, scale) => {
  const width = Math.round(img.width * scale);
  const height = Math.round(img.height * scale);
  const context = getContext(img, width, height);
  context.drawImage(img, 0, 0, width, height);
  return context.getImageData(0, 0, width, height).data;
};

/**
 * 이미지 URL에서 이미지 데이터를 로드하는 함수
 * @param {string} src - 이미지 URL 또는 데이터 URL
 * @param {number} scale - 이미지 스케일 (0-1 사이)
 * @returns {Promise<Uint8ClampedArray>} - 이미지 픽셀 데이터를 담은 Promise
 */
function getImageData(src, scale) {
  const img = new Image();

  // 데이터 URL이 아닌 경우에만 CORS 설정 (data URL에는 설정할 수 없음)
  // https://github.com/mrdoob/three.js/issues/1305
  if (!src.startsWith('data')) {
    img.crossOrigin = 'Anonymous';
  }

  return new Promise((resolve, reject) => {
    const errorHandler = () => reject(new Error('이미지 로드 중 오류가 발생했습니다'));

    img.onload = () => {
      try {
        const data = getContextImageData(img, scale);
        resolve(data);
      } catch (error) {
        reject(new Error(`이미지 데이터 추출 중 오류: ${error.message}`));
      }
    };

    img.onerror = errorHandler;
    img.onabort = errorHandler;
    img.src = src;
  });
}

/**
 * 이미지에서 주요 색상을 추출하는 함수
 * @param {string|HTMLImageElement} src - 이미지 URL 또는 Image 객체
 * @param {Object} [opts] - 옵션 객체
 * @param {number} [opts.scale=0.5] - 이미지 스케일 (0-1 사이, 성능 최적화에 사용)
 * @param {Array<Array<number>>} [opts.ignore=GREY_RGB_ARRAY] - 무시할 RGB 색상 배열
 * @param {number} [opts.offset=10] - 색상 값 그룹화를 위한 오프셋
 * @param {number} [opts.limit=10] - 반환할 주요 색상 수
 * @returns {Promise<Array<{rgba: Array<number>, count: number}>>} - 주요 색상 배열 (빈도 내림차순)
 * @throws {Error} 입력 오류 또는 처리 오류 시 발생
 */
export async function getDominatedColors(src, opts = {}) {
  if (!src) {
    throw new Error('이미지 소스(src)를 지정해야 합니다');
  }

  // 기본 옵션과 사용자 지정 옵션 병합
  const { scale, ignore, offset, limit } = {
    scale: 0.5,
    offset: 10,
    limit: 10,
    ignore: GREY_RGB_ARRAY,
    ...opts,
  };

  // 유효성 검사
  if (scale > 1 || scale <= 0) {
    throw new Error(`scale 값이 ${scale}로 설정되었습니다. 0-1 사이의 값이어야 합니다 (> 1은 의미 없음, ≤ 0은 작동하지 않음)`);
  }

  try {
    // 이미지 데이터 가져오기
    let imageData;
    if (typeof src === 'string') {
      imageData = await getImageData(src, scale);
    } else if (src instanceof HTMLImageElement) {
      imageData = getContextImageData(src, scale);
    } else {
      throw new Error(`인식할 수 없는 소스 형식: ${typeof src}`);
    }

    // 색상 분석 및 결과 반환
    const rgbas = getRGBAs(imageData, ignore, offset);
    return rgbas.slice(0, limit);
  } catch (error) {
    console.error('주요 색상 추출 중 오류:', error);
    throw error;
  }
}
