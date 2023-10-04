import ImageFall from './image/ImageFall';
import './lib/ThemeListener';
import './page.image.grid.scss';
import componentCssLoader from './style/componentCssLoader';

componentCssLoader();

import SideNavBar from './nav/SideNavBar';
document.querySelector('body').prepend(new SideNavBar());

document.querySelector('body').appendChild(new ImageFall());
