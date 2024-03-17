import ImageFall from './image/ImageFall';
import './lib/ThemeListener';
import './nav/appendSideNavBar';
import './page.image-fall.scss';
import { appendStyle } from './util/componentCssLoader';

appendStyle();

document.querySelector('body').appendChild(new ImageFall());
