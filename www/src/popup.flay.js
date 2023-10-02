import FlayPage from './flay/FlayPage';
import './lib/SseConnector';
import './lib/ThemeListener';
import './popup.flay.scss';

const urlParams = new URL(location.href).searchParams;
const opus = urlParams.get('opus');

document.title = opus;
document.querySelector('body').appendChild(new FlayPage()).set(opus);
