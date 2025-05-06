import SideNavBar from '@flay/nav/SideNavBar';
import '@lib/SseConnector';
import '@lib/UpdateMyPosition';
import './Page.scss';

document.body.style.backgroundImage = 'url(./svg/flayground-circle.svg)';
document.body.prepend(new SideNavBar());
