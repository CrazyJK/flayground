import DateUtils from '@lib/DateUtils';
import './inc/Page';
import './index.scss';

class Page {
  constructor() {}

  async start() {
    const mainElement = document.querySelector('body > main');
    import(/* webpackChunkName: "ImageCircle" */ '@image/ImageCircle')
      .then(({ ImageCircle }) => new ImageCircle({ effect: 'engrave' }))
      .then((imageCircle) => {
        imageCircle.style.position = 'fixed';
        imageCircle.style.right = 0;
        imageCircle.style.bottom = 0;
        mainElement.appendChild(imageCircle);

        imageCircle.addEventListener('click', () => {
          imageCircle.style.position = 'relative';
          imageCircle.style.right = 'unset';
          imageCircle.style.bottom = 'unset';
          window.dispatchEvent(new Event('resize'));
        });
        window.addEventListener('resize', () => {
          if (imageCircle.style.position === 'fixed') return; // 고정 위치일 때는 무시
          const rem = getAvailableRemSize(mainElement);
          imageCircle.setOptions({ rem: rem, effect: 'emboss', duration: 3000, eventAllow: true });
        });
      });
  }
}

new Page().start();

console.info(`%c\n\tFlayground : ${process.env.NODE_ENV} : ${process.env.WATCH_MODE === true ? 'Watch mode' : ''} 🕒 ${DateUtils.format(process.env.BUILD_TIME)}\n`, 'color: orange; font-size: 20px; font-weight: bold;');

function getAvailableRemSize(element) {
  function getAvailableWidth(element) {
    const computedStyle = getComputedStyle(element);
    const paddingLeft = parseFloat(computedStyle.paddingLeft);
    const paddingRight = parseFloat(computedStyle.paddingRight);

    return window.innerWidth - paddingLeft - paddingRight;
  }
  function getAvailableHeight(element) {
    const computedStyle = getComputedStyle(element);
    const paddingTop = parseFloat(computedStyle.paddingTop);
    const paddingBottom = parseFloat(computedStyle.paddingBottom);

    return window.innerHeight - paddingTop - paddingBottom;
  }

  function pxToRem(px) {
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    return Math.floor(px / rem);
  }

  const width = getAvailableWidth(element);
  const height = getAvailableHeight(element);
  return Math.min(pxToRem(width), pxToRem(height));
}
