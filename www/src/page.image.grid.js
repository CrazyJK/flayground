import ImageFall from './image/ImageFall';
import './page.image.grid.scss';
import './util/theme.listener';

import SideNavBar from './nav/SideNavBar';
document.querySelector('body').prepend(new SideNavBar());

document.querySelector('body').appendChild(new ImageFall());
