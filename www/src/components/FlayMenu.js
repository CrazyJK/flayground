import { imageWaterfall } from '../components/ImageWaterfall';
import { LocalStorageItem } from '../lib/crazy.common.js';
import '../lib/flay.sse';
import { calculateLifeTime } from '../lib/kamoru.life.timer';

import menuItems from '../components/FlayMenu.json';

/* ref)
  https://developer.mozilla.org/ko/docs/Web/Web_Components/Using_custom_elements
  https://developer.mozilla.org/ko/docs/Web/Web_Components/Using_shadow_DOM
 */

class FlayMenu extends HTMLElement {
  constructor(align) {
    super();

    // Create a shadow root
    const shadow = this.attachShadow({ mode: 'open' });

    // width
    const width = 200;

    // get align
    let dataAlign = this.getAttribute('data-align') || align;
    let alignLeft = dataAlign !== 'right';

    // style
    const fontAwesomelinkElem = document.createElement('link');
    fontAwesomelinkElem.setAttribute('rel', 'stylesheet');
    fontAwesomelinkElem.setAttribute('href', 'css/fontawesome/font-awesome-v4.css');
    shadow.appendChild(fontAwesomelinkElem);

    // current Page
    const currentPage = location.pathname.split('/').pop();

    const style = document.createElement('style');
    style.textContent = `
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
      border: 0;
      background-color: rgba(255, 255, 255, 0);
    }

    a {
      text-decoration: none;
    }
    .nav-wrap {
      position: fixed;
      top: 0;
      ${alignLeft ? 'left' : 'right'}: -200px;
      bottom: 0;
      width: ${width}px;
      overflow: hidden;
      z-index: 6974892;
      transition: ${alignLeft ? 'left' : 'right'} 0.4s 0.4s;
      display: flex;
      flex-direction: column;
    }
    .nav-wrap.fixed,
    .nav-wrap:hover {
      ${alignLeft ? 'left' : 'right'}: 0;
      box-shadow: 0 0 0.5rem var(--color-box-shadow);
      border-${alignLeft ? 'right' : 'left'}: 1px solid #000;
      transition: ${alignLeft ? 'left' : 'right'} 0.4s;
    }
    .nav-wrap.dark {
      background-color: #151515;
      color: #607d8b;
    }
    .nav-wrap.dark a {
      color: #607d8b;
    }
    .nav-wrap.light {
      background-color: #fff;
      color: #000;
    }
    .nav-wrap.light a {
      color: #000;
    }
    .nav-wrap > span {
      cursor: pointer;
      margin: 0;
      padding: 0.75rem;
    }
    .nav-wrap > span#fixedPin {
      position: absolute;
      top: 0;
      ${alignLeft ? 'right' : 'left'}: 0;
      transform: rotate(${alignLeft ? '' : '-'}45deg);
      transition: transform 0.3s;
    }
    .nav-wrap.fixed > span#fixedPin {
      color: crimson;
      transform: rotate(0deg);
    }
    .nav-wrap > span#openTrigger {
      position: fixed;
      top: 0;
      ${alignLeft ? 'left' : 'right'}: 0;
      opacity: 0;
      font-size: 1.25rem;
    }
    .nav-wrap > span#openTrigger:hover {
      opacity: 1;
    }
    .nav-wrap h1 {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 0.5rem;
      margin: 2rem 0 1rem;
    }
    .nav-wrap h1 img {
      width: 2rem;
      border-radius: 1rem;
    }
    .nav-wrap ul.nav {
      display: flex;
      flex-direction: column;
      list-style: none;
      margin: 0;
      padding: 0;
      font-size: 0.875em;
    }
    .nav-wrap ul.nav li {
      display: flex;
      align-items: center;
      flex: 0 0 1.75rem;
    }
    @media screen and (min-height: 1400px) {
      .nav-wrap ul.nav {
        font-size: 1em;
      }
      .nav-wrap ul.nav li {
        flex: 0 0 2rem;
      }
    }
    .nav-wrap ul.nav li.active {
      color: orange;
    }
    .nav-wrap ul.nav li i {
      flex: 0 0 2rem;
      text-align: center;
    }
    .nav-wrap ul.nav li div {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      flex: 1 1 auto;
    }

    .nav-wrap ul.nav li div a:nth-child(2) {
      width: 2rem;
      text-align: center;
      opacity: 0;
    }
    .nav-wrap ul.nav li:hover a {
      color: orange;
    }
    .nav-wrap ul.nav li:hover div a.href::after {
      content: " ▣";
    }
    .nav-wrap ul.nav li:hover div a:nth-child(2) {
      opacity: 1;
      transition: 0.3s 0.2s;
    }

    .nav-wrap ul.nav.nav-main {
      overflow-y: auto;
    }
    .nav-wrap ul.nav.nav-sub {
      margin-top: auto;
      margin-bottom: 0.5rem;
      padding-right: 0.5rem;
    }

    button {
      background-color: transparent;
      border: 0;
      color: inherit;
      cursor: pointer;
      margin: 0;
      padding: 0;
    }
    button > i.fa {
      margin: 0.125rem 0.25rem;
      font-size: 1.5em;
    }
    button#themeToggle.dark > i.light {
      display: none;
    }
    button#themeToggle.light > i.dark {
      display: none;
    }

    button#imageToggle.toggle-on > i.fa-toggle-off {
      display: none;
    }
    button#imageToggle.toggle-off > i.fa-toggle-on {
      display: none;
    }
    `;
    shadow.appendChild(style);

    const bodyMain = document.querySelector('body > main');

    // main wrapper
    const navWrap = document.createElement('nav');
    navWrap.setAttribute('class', 'nav-wrap ' + bgTheme);
    shadow.appendChild(navWrap);

    // fixed pin
    let isFixed = LocalStorageItem.getBoolean('flay.menu.fixed', false);
    navWrap.classList.toggle('fixed', isFixed);
    if (bodyMain) bodyMain.style.left = isFixed ? width + 'px' : 0 + 'px';

    const fixedPin = document.createElement('span');
    fixedPin.setAttribute('id', 'fixedPin');
    fixedPin.setAttribute('class', 'fa fa-thumb-tack');
    fixedPin.addEventListener('click', (e) => {
      navWrap.classList.toggle('fixed');
      isFixed = navWrap.classList.contains('fixed');
      if (bodyMain) bodyMain.style.left = isFixed ? width + 'px' : 0 + 'px';
      LocalStorageItem.set('flay.menu.fixed', isFixed);
    });
    navWrap.appendChild(fixedPin);

    if (bodyMain) console.log('bodyMain', bodyMain, 'left', bodyMain.style.left);

    // open trigger
    const openTrigger = document.createElement('span');
    openTrigger.setAttribute('id', 'openTrigger');
    openTrigger.setAttribute('class', 'fa fa-angle-double-' + (alignLeft ? 'right' : 'left'));
    navWrap.appendChild(openTrigger);

    // title
    const title = document.createElement('h1');
    const titleImg = document.createElement('img');
    titleImg.setAttribute('src', '/dist/img/favicon/flay_1.png');
    title.appendChild(titleImg);
    const titleAnker = document.createElement('a');
    titleAnker.setAttribute('href', '/dist/index.html');
    titleAnker.textContent = 'Flayground';
    title.appendChild(titleAnker);
    navWrap.appendChild(title);

    // main menu
    const mainMenuNav = document.createElement('ul');
    mainMenuNav.setAttribute('class', 'nav nav-main');
    navWrap.appendChild(mainMenuNav);

    menuItems.forEach((menu) => {
      const li = document.createElement('li');
      if (menu.uri.includes(currentPage)) {
        li.setAttribute('class', 'active');
      }
      mainMenuNav.appendChild(li);

      // icon
      const menuIcon = document.createElement('i');
      menuIcon.setAttribute('class', menu.icon);
      li.appendChild(menuIcon);

      // menu
      const menuDiv = document.createElement('div');
      li.appendChild(menuDiv);

      // decide popup size
      if (menu.popup === 'full') {
        menu.popup = {
          w: window.innerWidth,
          h: window.innerHeight,
        };
      }

      // current window
      const anker = document.createElement('a');
      anker.setAttribute('href', menu.uri);
      anker.textContent = menu.name;
      menuDiv.appendChild(anker);

      // new window
      const popup = document.createElement('a');
      popup.setAttribute('href', `javascript:window.open('${menu.uri}', '${menu.name}', 'width=${menu.popup.w},height=${menu.popup.h}')`);
      const popupIcon = document.createElement('i');
      popupIcon.setAttribute('class', 'fa fa-external-link hover');
      popup.appendChild(popupIcon);
      menuDiv.appendChild(popup);
    });

    // sub menu
    const subMenuNav = document.createElement('ul');
    subMenuNav.setAttribute('class', 'nav nav-sub');
    navWrap.appendChild(subMenuNav);

    subMenuNav.appendChild(createImageWaterfallToggle());
    subMenuNav.appendChild(createThemeToggle(shadow));
    subMenuNav.appendChild(createRemainTimer());
  }
}

// Define the new element
customElements.define('flay-menu', FlayMenu);

// const flayMenu = document.createElement('flay-menu');
// flayMenu.setAttribute('data-align', 'right');

let bgTheme = LocalStorageItem.get('flay.bgtheme', 'dark');

// set theme initiate
document.getElementsByTagName('html')[0].setAttribute('data-theme', bgTheme);

document.body.prepend(new FlayMenu('left'));

function createImageWaterfallToggle() {
  const iOn = document.createElement('i');
  iOn.classList.add('fa', 'fa-toggle-on');
  const iOff = document.createElement('i');
  iOff.classList.add('fa', 'fa-toggle-off');

  const button = document.createElement('button');
  button.setAttribute('id', 'imageToggle');
  button.setAttribute('type', 'button');
  button.setAttribute('class', 'toggle-off');
  button.classList.add(bgTheme);
  button.appendChild(iOn);
  button.appendChild(iOff);
  button.addEventListener('click', () => {
    if (button.classList.contains('toggle-on')) {
      button.classList.replace('toggle-on', 'toggle-off');
      imageWaterfall.stop();
    } else {
      button.classList.replace('toggle-off', 'toggle-on');
      imageWaterfall.start();
    }
  });

  return menuItemFactory('ImageWaterfall', ['fa', 'fa-toggle-on'], button, () => {
    const main = document.querySelector('body > main');
    const isVisible = main.style.display != 'none';
    if (isVisible) {
      main.style.display = 'none';
      imageWaterfall.front();
    } else {
      main.style.display = 'block';
      imageWaterfall.behind();
    }
  });
}

function createThemeToggle(shadow) {
  const navWrap = shadow.querySelector('nav.nav-wrap');

  const iSun = document.createElement('i');
  iSun.classList.add('fa', 'fa-sun-o', 'light');
  const iMoon = document.createElement('i');
  iMoon.classList.add('fa', 'fa-moon-o', 'dark');

  const button = document.createElement('button');
  button.setAttribute('id', 'themeToggle');
  button.setAttribute('type', 'button');
  button.classList.add(bgTheme);
  button.appendChild(iSun);
  button.appendChild(iMoon);
  button.addEventListener('click', () => {
    // console.log('themeToggle', button, button.classList, navWrap);
    let currentTheme = button.classList.item(0);
    let selectedTheme = currentTheme === 'dark' ? 'light' : 'dark';
    button.classList.replace(currentTheme, selectedTheme);
    navWrap.classList.replace(currentTheme, selectedTheme);
    LocalStorageItem.set('flay.bgtheme', selectedTheme);
  });

  return menuItemFactory('Theme', ['fa', 'fa-toggle-on'], button);
}

function createRemainTimer() {
  const { remainDay } = calculateLifeTime();
  const label = document.createElement('label');
  label.classList.add('m-0', 'hover');
  label.setAttribute('id', 'lifeTimerWrapper');
  label.addEventListener('click', () => {
    window.open('./kamoru.life.timer.html', 'lifeTimer', 'width=600, height=250');
  });
  const small = document.createElement('small');
  small.textContent = remainDay + ' days';
  label.appendChild(small);

  return menuItemFactory('Remain', ['fa', 'fa-clock-o'], label);
}

function menuItemFactory(title, iconClasses, element, clickEventHandler) {
  const li = document.createElement('li');
  const i = document.createElement('i');
  const div = document.createElement('div');
  const span = document.createElement('span');
  i.classList.add(...iconClasses);
  span.textContent = title;
  li.appendChild(i);
  li.appendChild(div);
  div.appendChild(span);
  div.appendChild(element);

  if (clickEventHandler) {
    span.addEventListener('click', clickEventHandler);
  }

  return li;
}
