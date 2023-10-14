import './lib/ThemeListener';
import SideNavBar from './nav/SideNavBar';
import './page.image-page.scss';
import { appendStyle } from './util/componentCssLoader';

appendStyle();
document.querySelector('body').prepend(new SideNavBar());
