import '@lib/SseConnector';
import '@lib/UpdateMyPosition';
import './Page.scss';

import(/* webpackChunkName: "SideNavBar" */ '@nav/SideNavBar').then(({ SideNavBar }) => {
  document.body.prepend(new SideNavBar());
});
