import DateUtils from '@lib/DateUtils';
import { FlayCircleMask } from '../image/FlayCircleMask';
import './inc/Page';
import './index.scss';

console.info(`%c\n\tFlayground : ${process.env.NODE_ENV} : ${process.env.WATCH_MODE === 'true' ? 'Watch mode' : ''} 🕒 ${DateUtils.format(process.env.BUILD_TIME)}\n`, 'color: orange; font-size: 20px; font-weight: bold;');

document.querySelector('body').appendChild(new FlayCircleMask());
