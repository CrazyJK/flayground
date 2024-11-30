import './inc/Popup';
import './popup.monitor.scss';

import '../flay/panel/FlayMonitor';

document.querySelector('#clearBtn').addEventListener('click', () => {
  document.querySelector('.flay-monitor').clear();
});
