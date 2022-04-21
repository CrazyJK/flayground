const GREY_RGB_ARRAY = Array.from({ length: 256 }).map((v, i) => [i, i, i]);

async function getDominatedColors(src, opts) {
	if (!src) {
		throw new Error('src musr be specified');
	}

	const { scale, ignore, offset, limit } = {
		scale: 0.5,
		offset: 10,
		limit: 10,
		ignore: GREY_RGB_ARRAY,
		...opts,
	};
	console.debug('getDominatedColors', 'scale', scale, 'offset', offset, 'limit', limit, 'ignore', ignore.length);

	if (scale > 1 || scale <= 0) {
		throw new Error(`You set scale to ${scale}, which isn't between 0-1. This is either pointless (> 1) or a no-op (≤ 0)`);
	}

	// console.time(src);
	const imageData = await getImageData(src, scale);
	const rgbas = getRGBAs(imageData, ignore, offset);
	// console.timeEnd(src);

	return rgbas.slice(0, limit);

	async function getImageData(src, scale) {
		const img = new Image();

		// Can't set cross origin to be anonymous for data url's
		// https://github.com/mrdoob/three.js/issues/1305
		if (!src.startsWith('data')) img.crossOrigin = 'Anonymous';

		return await new Promise((resolve, reject) => {
			img.onload = function () {
				const width = Math.round(img.width * scale);
				const height = Math.round(img.height * scale);
				const context = getContext(width, height);
				context.drawImage(img, 0, 0, width, height);

				const { data } = context.getImageData(0, 0, width, height);

				resolve(data);
			};

			const errorHandler = () => reject(new Error('An error occurred attempting to load image'));

			img.onerror = errorHandler;
			img.onabort = errorHandler;
			img.src = src;
		});
	}

	function getContext(width, height) {
		let canvas = document.querySelector('#dominatedColorCanvas');
		if (canvas === null) {
			canvas = document.createElement('canvas');
			canvas.setAttribute('id', 'dominatedColorCanvas');
			canvas.setAttribute('style', 'display:none');
			document.body.appendChild(canvas);
		}
		canvas.setAttribute('width', width);
		canvas.setAttribute('height', height);
		return canvas.getContext('2d');
	}

	function getRGBAs(data, ignoreRGBs, offset) {
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
	}
}
