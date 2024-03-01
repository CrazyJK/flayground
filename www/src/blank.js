import './blank.scss';
import './lib/ThemeListener';
import SideNavBar from './nav/SideNavBar';

class Page {
  constructor() {
    document.querySelector('body').prepend(new SideNavBar());
  }

  async start() {}
}

new Page().start();
