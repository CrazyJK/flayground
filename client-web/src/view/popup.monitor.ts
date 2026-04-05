import '@flay/panel/FlayMonitor';
import FlayMonitor from '@flay/panel/FlayMonitor';
import './inc/Popup';
import './popup.monitor.scss';

document.querySelector('#clearBtn')!.addEventListener('click', () => {
  const flayMonitor = document.querySelector('flay-monitor') as FlayMonitor;
  if (flayMonitor) {
    flayMonitor.clear();
  }
});
