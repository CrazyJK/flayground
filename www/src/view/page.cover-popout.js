import './inc/Page';
import './page.cover-popout.scss';

const main = document.querySelector('body > main');
main.style.position = 'fixed';
main.style.inset = 0;
main.addEventListener(
  'click',
  (e) => {
    import(/* webpackChunkName: "PopoutCover" */ '../flay/panel/PopoutCover').then((module) => new module.default(main).계속나오기(e));
  },
  { once: true }
);
