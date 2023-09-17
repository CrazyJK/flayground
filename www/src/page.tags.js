import TagLayer from './elements/control/TagLayer';
import './page.tags.scss';

import SideNavBar from './elements/page/SideNavBar';
document.querySelector('body').prepend(new SideNavBar());

document.querySelector('body').appendChild(new TagLayer());
