const GREY_RGB_ARRAY = Array.from({ length: 256 }).map((v, i) => [i, i, i]);

const getRGBAs = (data, ignoreRGBs, offset) => {
  const ignoreRgbStrings = ignoreRGBs.map((i) => i.join(','));

  const countMap = {};
  for (let i = 0; i < data.length; i += 4 /* 4 gives us r, g, b, and a */) {
    const alpha = data[i + 3];

    // skip FULLY transparent pixels
    if (alpha === 0) {
      continue;
    }

    let rgbComponent = Array.from(data.subarray(i, i + 3));

    // skip undefined data
    if (rgbComponent.indexOf(undefined) !== -1) {
      console.error('rgbComponent contains undefined', rgbComponent);
      continue;
    }

    if (offset > 1) {
      rgbComponent = rgbComponent.map((x) => Math.round(Math.floor(x / offset) * offset));
    }

    // skip colors in the ignore list
    if (ignoreRgbStrings.length > 0 && ignoreRgbStrings.includes(rgbComponent.join(','))) {
      continue;
    }

    const rgba = [...rgbComponent, Number((alpha / 255).toFixed(3))];

    if (countMap[rgba]) {
      countMap[rgba].count++;
    } else {
      countMap[rgba] = { rgba, count: 1 };
    }
  }

  const counts = Object.values(countMap);
  return counts.sort((a, b) => b.count - a.count);
};

const getContext = (img, width, height) => {
  let canvas = img.parentNode.querySelector('.dominated-color-canvas');
  if (canvas === null) {
    canvas = document.createElement('canvas');
    canvas.classList.add('dominated-color-canvas');
    canvas.setAttribute('style', 'display:none');
    img.parentNode.appendChild(canvas);
  }
  canvas.setAttribute('width', width);
  canvas.setAttribute('height', height);
  return canvas.getContext('2d', { willReadFrequently: true });
};

const getContextImageData = (img, scale) => {
  const width = Math.round(img.width * scale);
  const height = Math.round(img.height * scale);
  const context = getContext(img, width, height);
  context.drawImage(img, 0, 0, width, height);
  const { data } = context.getImageData(0, 0, width, height);
  return data;
};

function getImageData(src, scale) {
  const img = new Image();

  // Can't set cross origin to be anonymous for data url's
  // https://github.com/mrdoob/three.js/issues/1305
  if (!src.startsWith('data')) img.crossOrigin = 'Anonymous';

  return new Promise((resolve, reject) => {
    const errorHandler = () => reject(new Error('An error occurred attempting to load image'));
    img.onload = () => {
      resolve(getContextImageData(img, scale));
    };
    img.onerror = errorHandler;
    img.onabort = errorHandler;
    img.src = src;
  });
}

/**
 *
 * @param {*} src url or Image
 * @param {*} opts
 * @returns
 */
export async function getDominatedColors(src, opts) {
  if (!src) {
    throw new Error('src must be specified');
  }

  const { scale, ignore, offset, limit } = {
    scale: 0.5,
    offset: 10,
    limit: 10,
    ignore: GREY_RGB_ARRAY,
    ...opts,
  };
  // console.debug('getDominatedColors', 'scale', scale, 'offset', offset, 'limit', limit, 'ignore', ignore.length);

  if (scale > 1 || scale <= 0) {
    throw new Error(`You set scale to ${scale}, which isn't between 0-1. This is either pointless (> 1) or a no-op (≤ 0)`);
  }

  // console.time(src);
  let imageData;
  if (typeof src === 'string') {
    imageData = await getImageData(src, scale);
  } else if (typeof src === 'object' && src instanceof Image) {
    imageData = getContextImageData(src, scale);
  } else {
    throw new Error(`unrecognized src ${src}`);
  }
  const rgbas = getRGBAs(imageData, ignore, offset);
  // console.timeEnd(src);

  return rgbas.slice(0, limit);
}
