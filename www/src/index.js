import './index.scss';
import componentCssLoader from './style/componentCssLoader';

componentCssLoader();

import SideNavBar from './nav/SideNavBar';
document.querySelector('body').prepend(new SideNavBar());
