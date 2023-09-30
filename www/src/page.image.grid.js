import ImageFall from './elements/image/ImageFall';
import './page.image.grid.scss';
import './util/theme.listener';

import SideNavBar from './elements/page/SideNavBar';
document.querySelector('body').prepend(new SideNavBar());

document.querySelector('body').appendChild(new ImageFall());
