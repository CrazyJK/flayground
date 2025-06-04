import DateUtils from '@lib/DateUtils';
import './inc/Page';
import './index.scss';

class Page {
  constructor() {}

  async start() {
    const mainElement = document.querySelector('body > main');
    import(/* webpackChunkName: "ImageCircle" */ '@image/ImageCircle')
      .then(({ ImageCircle }) => new ImageCircle({ effect: 'engrave', eventAllow: true }))
      .then((imageCircle) => {
        imageCircle.style.position = 'fixed';
        imageCircle.style.right = 0;
        imageCircle.style.bottom = 0;
        mainElement.appendChild(imageCircle);
      });
  }
}

new Page().start();

console.info(`%c\n\tFlayground : ${process.env.NODE_ENV} : ${process.env.WATCH_MODE === true ? 'Watch mode' : ''} 🕒 ${DateUtils.format(process.env.BUILD_TIME)}\n`, 'color: orange; font-size: 20px; font-weight: bold;');
