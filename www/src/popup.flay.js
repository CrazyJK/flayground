import FlayPage from './elements/page/FlayPage';
import './popup.flay.scss';
import './util/flay.sse';
import './util/theme.listener';

const urlParams = new URL(location.href).searchParams;
const opus = urlParams.get('opus');

document.title = opus;
document.querySelector('body').appendChild(new FlayPage()).set(opus);
