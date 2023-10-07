import SideNavBar from './nav/SideNavBar';
import './page.develop.scss';
import { appendStyle } from './util/componentCssLoader';

appendStyle();
document.querySelector('body').prepend(new SideNavBar());
