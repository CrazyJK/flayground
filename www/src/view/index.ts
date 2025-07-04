import DateUtils from '@lib/DateUtils';
import './inc/Page';
import './index.scss';

/**
 * 메인 페이지 클래스
 */
class Page {
  async start(): Promise<void> {
    const mainElement = document.querySelector('body > main') as HTMLElement;
  }
}

new Page().start();

console.info(`%c\n\tFlayground : ${process.env.NODE_ENV} : ${process.env.WATCH_MODE === 'true' ? 'Watch mode' : ''} 🕒 ${DateUtils.format(process.env.BUILD_TIME)}\n`, 'color: orange; font-size: 20px; font-weight: bold;');
