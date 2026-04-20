/**
 * 이미지에서 주요 색상을 추출하는 유틸리티
 *
 * Canvas API를 사용하여 이미지의 픽셀 데이터를 분석하고,
 * 가장 많이 사용된 색상들을 빈도순으로 반환합니다.
 *
 * 특징:
 * - 성능 최적화를 위한 이미지 스케일링
 * - 특정 색상(회색 등) 무시 기능
 * - 색상 그룹화를 통한 유사 색상 병합
 * - Promise 기반 비동기 처리
 * - 투명도(알파) 지원
 *
 * @author kamoru
 * @since 2024
 */

/** RGB 색상 타입 (0-255 범위의 세 개 값) */
type RGBColor = [number, number, number];

/** RGBA 색상 타입 (RGB + 0-1 범위의 알파값) */
type RGBAColor = [number, number, number, number];

/** 색상 빈도 정보 인터페이스 */
export interface ColorFrequency {
  /** RGBA 색상 값 */
  rgba: RGBAColor;
  /** 해당 색상의 출현 빈도 */
  count: number;
}

/** 주요 색상 추출 옵션 인터페이스 */
interface DominatedColorOptions {
  /** 이미지 스케일 (0-1 사이, 성능 최적화에 사용) */
  scale?: number;
  /** 무시할 RGB 색상 배열 */
  ignore?: RGBColor[];
  /** 색상 값 그룹화를 위한 오프셋 */
  offset?: number;
  /** 반환할 주요 색상 수 */
  limit?: number;
  /** 최소 채도 (0-1). 이 값 미만의 무채색 계열 색상을 제외 */
  minSaturation?: number;
  /** 최소 밝기 (0-1). 이 값 미만의 너무 어두운 색상을 제외 */
  minLightness?: number;
  /** 최대 밝기 (0-1). 이 값 초과의 너무 밝은 색상을 제외 */
  maxLightness?: number;
  /** 밝기 가중치 지수. 0이면 순수 빈도순, 높을수록 밝은 색에 높은 점수 부여 */
  lightnessBoost?: number;
}

/**
 * 회색 RGB 배열 (0-255까지의 모든 회색 색상)
 * @deprecated minSaturation 옵션으로 대체됨. 명시적으로 회색을 ignore에 지정할 때만 사용.
 */
export const GREY_RGB_ARRAY: RGBColor[] = Array.from({ length: 256 }).map((_, i) => [i, i, i] as RGBColor);

/**
 * RGB 값에서 HSL의 채도(S)와 밝기(L)를 계산하는 함수.
 * getRGBAs 내부에서는 성능을 위해 인라인 처리하므로 외부 사용 시만 호출.
 * @returns [채도(0-1), 밝기(0-1)]
 */
export const getSaturationLightness = (r: number, g: number, b: number): [number, number] => {
  const rn = r / 255,
    gn = g / 255,
    bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, l]; // 무채색
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  return [s, l];
};

/**
 * 이미지 데이터에서 RGBA 색상 분포를 추출하는 함수
 * @param data 이미지 픽셀 데이터
 * @param ignoreRGBs 무시할 RGB 색상 배열
 * @param offset 색상 값 그룹화를 위한 오프셋
 * @param minSaturation 최소 채도 (미만 제외)
 * @param minLightness 최소 밝기 (미만 제외)
 * @param maxLightness 최대 밝기 (초과 제외)
 * @param lightnessBoost 밝기 가중치 지수 (0=빈도순, 높을수록 밝은 색 우선)
 * @param limit 반환할 최대 색상 수
 * @returns 밝기 가중 점수 내림차순으로 정렬된 상위 RGBA 색상 배열
 */
const getRGBAs = (data: Uint8ClampedArray, ignoreRGBs: RGBColor[], offset: number, minSaturation: number, minLightness: number, maxLightness: number, lightnessBoost: number, limit: number): ColorFrequency[] => {
  // 무시 목록을 숫자 키 Set으로 변환 (문자열 비교 대신 비트 연산)
  const ignoreSet = new Set(ignoreRGBs.map(([r, g, b]) => (r << 16) | (g << 8) | b));
  const hasIgnore = ignoreSet.size > 0;

  type ColorEntry = { r: number; g: number; b: number; alpha: number; count: number; lightness: number };
  const countMap = new Map<number, ColorEntry>();
  const dataLength = data.length;
  const invOffset = offset > 1 ? 1 / offset : 0;
  const inv255 = 1 / 255;

  for (let i = 0; i < dataLength; i += 4) {
    const alpha = data[i + 3]!;
    if (alpha === 0) continue;

    // 오프셋 적용 색상 그룹화
    let fr: number, fg: number, fb: number;
    if (invOffset > 0) {
      fr = ((data[i]! * invOffset) | 0) * offset;
      fg = ((data[i + 1]! * invOffset) | 0) * offset;
      fb = ((data[i + 2]! * invOffset) | 0) * offset;
    } else {
      fr = data[i]!;
      fg = data[i + 1]!;
      fb = data[i + 2]!;
    }

    // 정수 키로 채도/밝기 계산 전 무시 목록 확인 (더 가벼운 연산 먼저)
    const intKey = (fr << 16) | (fg << 8) | fb;
    if (hasIgnore && ignoreSet.has(intKey)) continue;

    // 채도/밝기 필터링 (인라인 계산으로 함수 호출 오버헤드 제거)
    const rn = fr * inv255,
      gn = fg * inv255,
      bn = fb * inv255;
    const max = rn > gn ? (rn > bn ? rn : bn) : gn > bn ? gn : bn;
    const min = rn < gn ? (rn < bn ? rn : bn) : gn < bn ? gn : bn;
    const l = (max + min) * 0.5;
    if (l < minLightness || l > maxLightness) continue;
    if (max !== min) {
      const d = max - min;
      const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (s < minSaturation) continue;
    } else if (minSaturation > 0) {
      continue; // 무채색
    }

    // RGB 키로 그룹화 (대부분 불투명 이미지이므로 alpha 변화 무시해도 무방)
    const entry = countMap.get(intKey);
    if (entry) {
      entry.count++;
    } else {
      countMap.set(intKey, { r: fr, g: fg, b: fb, alpha: Math.round(alpha * inv255 * 1000) / 1000, count: 1, lightness: l });
    }
  }

  // 부분 정렬: limit 개수만큼만 상위 추출 (전체 정렬 대신 선택 정렬)
  const entries: ColorEntry[] = Array.from(countMap.values());
  const resultLength = Math.min(limit, entries.length);
  const result: ColorFrequency[] = [];

  for (let n = 0; n < resultLength; n++) {
    let bestIdx = n;
    let bestScore = -1;
    for (let j = n; j < entries.length; j++) {
      const e = entries[j]!;
      const score = Math.log(e.count + 1) * e.lightness ** lightnessBoost;
      if (score > bestScore) {
        bestScore = score;
        bestIdx = j;
      }
    }
    // swap
    const temp = entries[n]!;
    entries[n] = entries[bestIdx]!;
    entries[bestIdx] = temp;

    const best = entries[n]!;
    result.push({
      rgba: [best.r, best.g, best.b, best.alpha] as RGBAColor,
      count: best.count,
    });
  }

  return result;
};

/**
 * 이미지용 캔버스 컨텍스트를 가져오는 함수
 * @param img 이미지 요소
 * @param width 캔버스 너비
 * @param height 캔버스 높이
 * @returns 2D 캔버스 컨텍스트
 */
const getContext = (img: HTMLImageElement, width: number, height: number): CanvasRenderingContext2D => {
  // 이미지 부모에 존재하는 캔버스를 재사용하거나 새로 생성
  let canvas = (img.parentNode?.querySelector('.dominated-color-canvas') as HTMLCanvasElement | null) ?? document.querySelector('.dominated-color-canvas');
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

  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) {
    throw new Error('2D 캔버스 컨텍스트를 생성할 수 없습니다');
  }

  return context;
};

/**
 * 이미지에서 컨텍스트 이미지 데이터를 추출하는 함수
 * @param img 이미지 요소
 * @param scale 이미지 스케일 (0-1 사이)
 * @returns 이미지 픽셀 데이터
 */
const getContextImageData = (img: HTMLImageElement, scale: number): Uint8ClampedArray => {
  const width = Math.round(img.width * scale);
  const height = Math.round(img.height * scale);
  const context = getContext(img, width, height);
  context.drawImage(img, 0, 0, width, height);
  return context.getImageData(0, 0, width, height).data;
};

/**
 * 이미지 URL에서 이미지 데이터를 로드하는 함수
 * @param src 이미지 URL 또는 데이터 URL
 * @param scale 이미지 스케일 (0-1 사이)
 * @returns 이미지 픽셀 데이터를 담은 Promise
 */
function getImageData(src: string, scale: number): Promise<Uint8ClampedArray> {
  const img = new Image();

  // 데이터 URL이 아닌 경우에만 CORS 설정 (data URL에는 설정할 수 없음)
  // https://github.com/mrdoob/three.js/issues/1305
  if (!src.startsWith('data')) {
    img.crossOrigin = 'Anonymous';
  }

  return new Promise((resolve, reject) => {
    const errorHandler = (): void => reject(new Error('이미지 로드 중 오류가 발생했습니다'));

    img.onload = (): void => {
      try {
        const data = getContextImageData(img, scale);
        resolve(data);
      } catch (error) {
        reject(new Error(`이미지 데이터 추출 중 오류: ${(error as Error).message}`));
      }
    };

    img.onerror = errorHandler;
    img.onabort = errorHandler;
    img.src = src;
  });
}

/**
 * 이미지에서 주요 색상을 추출하는 함수
 * @param src 이미지 URL 또는 Image 객체
 * @param opts 옵션 객체
 * @returns 주요 색상 배열 (빈도 내림차순)
 * @throws 입력 오류 또는 처리 오류 시 발생
 */
export async function getDominatedColors(src: string | HTMLImageElement, opts: DominatedColorOptions = {}): Promise<ColorFrequency[]> {
  if (!src) {
    throw new Error('이미지 소스(src)를 지정해야 합니다');
  }

  // 기본 옵션과 사용자 지정 옵션 병합
  // minSaturation 기본값 0.15: 채도 15% 미만의 회색 계열 제외 (GREY_RGB_ARRAY보다 정확)
  // minLightness/maxLightness: 거의 검정(5% 미만), 거의 흰색(95% 초과) 제외
  // lightnessBoost 기본값 1: 밝기에 비례한 선형 가중치 적용
  const { scale = 0.5, ignore = [], offset = 10, limit = 10, minSaturation = 0.15, minLightness = 0.05, maxLightness = 0.95, lightnessBoost = 1 } = opts;

  // 유효성 검사
  if (scale > 1 || scale <= 0) {
    throw new Error(`scale 값이 ${scale}로 설정되었습니다. 0-1 사이의 값이어야 합니다 (> 1은 의미 없음, ≤ 0은 작동하지 않음)`);
  }

  try {
    // 이미지 데이터 가져오기
    let imageData: Uint8ClampedArray;
    if (typeof src === 'string') {
      imageData = await getImageData(src, scale);
    } else if (src instanceof HTMLImageElement) {
      imageData = getContextImageData(src, scale);
    } else {
      throw new Error(`인식할 수 없는 소스 형식: ${typeof src}`);
    }

    // 색상 분석 및 결과 반환 (limit을 getRGBAs에 전달하여 부분 정렬 최적화)
    const rgbaList = getRGBAs(imageData, ignore, offset, minSaturation, minLightness, maxLightness, lightnessBoost, limit);
    return rgbaList;
  } catch (error) {
    console.error('주요 색상 추출 중 오류:', error);
    throw error;
  }
}
