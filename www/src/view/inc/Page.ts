import DateUtils from '@lib/DateUtils';
import '@lib/SseConnector';
import '@lib/UpdateMyPosition';
import './Page.scss';

import(/* webpackChunkName: "SideNavBar" */ '@nav/SideNavBar').then(({ SideNavBar }) => {
  document.body.prepend(new SideNavBar());
});

console.info(`%c\n\tFlayground : ${process.env.NODE_ENV} : ${process.env.WATCH_MODE === 'true' ? 'Watch mode' : ''} 🕒 ${DateUtils.format(process.env.BUILD_TIME)}\n`, 'color: orange; font-size: 20px; font-weight: bold;');
