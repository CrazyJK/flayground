import './inc/Page';
import './index.scss';

class Page {
  constructor() {}

  async start() {
    document.addEventListener(
      'click',
      (e) => {
        const main = document.querySelector('body > main');
        main.style.position = 'fixed';
        main.style.inset = 0;
        import(/* webpackChunkName: "PopoutCover" */ '../flay/panel/PopoutCover').then((module) => new module.default(main).계속나오기(e));
      },
      { once: true }
    );
  }
}

new Page().start();
