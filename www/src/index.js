import './index.scss';
import './lib/ThemeListener';
import SideNavBar from './nav/SideNavBar';
import { appendStyle } from './util/componentCssLoader';

appendStyle();
document.querySelector('body').prepend(new SideNavBar());
