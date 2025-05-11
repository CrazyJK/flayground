import '@lib/SseConnector';
import '@lib/UpdateMyPosition';
import './Page.scss';

document.body.style.backgroundImage = 'url(./svg/flayground-circle.svg)';

import(/* webpackChunkName: "SideNavBar" */ '@nav/SideNavBar').then(({ SideNavBar }) => {
  document.body.prepend(new SideNavBar());
});
