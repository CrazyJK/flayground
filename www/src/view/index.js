import DateUtils from '@lib/DateUtils';
import './inc/Page';
import './index.scss';

class Page {
  constructor() {}

  async start() {
    const mainElement = document.querySelector('body > main');
    import(/* webpackChunkName: "ImageCircle" */ '@image/ImageCircle')
      .then(({ ImageCircle }) => new ImageCircle({ rem: 10, effect: 'engrave' }))
      .then((imageCircle) => {
        imageCircle.classList.toggle('right-bottom');
        mainElement.appendChild(imageCircle);

        window.addEventListener('keydown', (e) => {
          imageCircle.classList.toggle('right-bottom', e.key === 'ArrowDown');
          window.dispatchEvent(new Event('resize'));
        });
        window.addEventListener('resize', () => {
          imageCircle.setOptions(
            imageCircle.classList.contains('right-bottom')
              ? {
                  rem: 10,
                  effect: 'engrave',
                  duration: 2000,
                  eventAllow: false,
                }
              : {
                  rem: getAvailableRemSize(mainElement),
                  effect: 'emboss',
                  duration: 3000,
                  eventAllow: true,
                }
          );
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
