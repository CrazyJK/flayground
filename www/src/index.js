import './index.scss';
import './lib/ThemeListener';
import { appendStyle } from './util/componentCssLoader';

appendStyle();

import SideNavBar from './nav/SideNavBar';
document.querySelector('body').prepend(new SideNavBar());
