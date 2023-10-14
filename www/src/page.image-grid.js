import ImageFall from './image/ImageFall';
import './lib/ThemeListener';
import './page.image-grid.scss';
import { appendStyle } from './util/componentCssLoader';

appendStyle();

import SideNavBar from './nav/SideNavBar';
document.querySelector('body').prepend(new SideNavBar());

document.querySelector('body').appendChild(new ImageFall());
