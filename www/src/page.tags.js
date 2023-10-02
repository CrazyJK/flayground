import TagLayer from './control/TagLayer';
import './page.tags.scss';

import SideNavBar from './nav/SideNavBar';
document.querySelector('body').prepend(new SideNavBar());

document.querySelector('body').appendChild(new TagLayer());
