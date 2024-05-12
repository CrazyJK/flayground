import './init/Popup';
import './popup.monitor.scss';

import './flay/FlayMonitor';

document.querySelector('#clearBtn').addEventListener('click', () => {
  document.querySelector('flay-monitor').clear();
});
