import '../lib/SseConnector';
import SideNavBar from '../nav/SideNavBar';
import './Page.scss';
import './UpdateMyPosition';

document.querySelector('body').style.backgroundImage = 'url(./svg/flayground-circle.svg)';
document.querySelector('body').prepend(new SideNavBar());
