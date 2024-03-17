import './init/Popup';
import './popup.flay.scss';

import FlayPage from './flay/FlayPage';

const urlParams = new URL(location.href).searchParams;
const opus = urlParams.get('opus');

document.title = opus;
const flayPage = document.querySelector('body').appendChild(new FlayPage());
flayPage.set(opus);
