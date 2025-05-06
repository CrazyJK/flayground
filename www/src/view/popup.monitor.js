import '@flay/panel/FlayMonitor';
import './inc/Popup';
import './popup.monitor.scss';

document.querySelector('#clearBtn').addEventListener('click', () => {
  document.querySelector('.flay-monitor').clear();
});
