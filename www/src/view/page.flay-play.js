import './inc/Page';
import './page.flay-play.scss';

import FlayVideoViewPanel from '../flay/panel/FlayVideoViewPanel';

document.querySelector('body > main').appendChild(new FlayVideoViewPanel()).start();
