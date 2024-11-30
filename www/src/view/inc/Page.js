import SideNavBar from '../../flay/nav/SideNavBar';
import '../../lib/SseConnector';
import '../../lib/UpdateMyPosition';
import './Page.scss';

document.querySelector('body').style.backgroundImage = 'url(./svg/flayground-circle.svg)';
document.querySelector('body').prepend(new SideNavBar());
