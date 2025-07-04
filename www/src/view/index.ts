import DateUtils from '@lib/DateUtils';
import FlayFetch, { ImageData } from '../lib/FlayFetch';
import './inc/Page';
import './index.scss';

/**
 * 메인 페이지 클래스
 */
class Page {
  async start(): Promise<void> {
    const mainElement = document.querySelector('body > main') as HTMLElement;

    const length = await FlayFetch.getImageSize();
    const randomIndex = Math.floor(Math.random() * length);
    const imageData: ImageData = await FlayFetch.getStaticImage(randomIndex);
    const imageUrl = URL.createObjectURL(imageData.imageBlob);
    mainElement.style.backgroundImage = `url(${imageUrl})`;
  }
}

new Page().start();

console.info(`%c\n\tFlayground : ${process.env.NODE_ENV} : ${process.env.WATCH_MODE === 'true' ? 'Watch mode' : ''} 🕒 ${DateUtils.format(process.env.BUILD_TIME)}\n`, 'color: orange; font-size: 20px; font-weight: bold;');
