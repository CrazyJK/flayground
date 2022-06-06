import menuItems from '../main.json';
import { calculateLifeTime } from './kamoru.life.timer';
import { Rest } from './flay.rest.service';
import { LocalStorageItem } from './crazy.common.js';
import flayWebsocket from './flay.websocket.js';

/* ref)
   https://developer.mozilla.org/ko/docs/Web/Web_Components/Using_custom_elements
   https://developer.mozilla.org/ko/docs/Web/Web_Components/Using_shadow_DOM
 */

class FlayMenu extends HTMLElement {
  constructor(align) {
    super();

    // Create a shadow root
    const shadow = this.attachShadow({ mode: 'open' });

    // get align
    let dataAlign = this.getAttribute('data-align') || align;
    let alignLeft = dataAlign !== 'right';

    // style
    const linkElem = document.createElement('link');
    linkElem.setAttribute('rel', 'stylesheet');
    linkElem.setAttribute('href', 'css/font-awesome.css');
    shadow.appendChild(linkElem);

    const style = document.createElement('style');
    style.textContent = `
    a {
      color: #607d8b;
      text-decoration: none;
    }
    .nav-wrap {
      background-color: #151515;
      color: #607d8b;
      position: absolute;
      top: 0;
      ${alignLeft ? 'left' : 'right'}: -200px;
      bottom: 0;
      width: 200px;
      overflow: hidden;
      z-index: 6974892;
      transition: ${alignLeft ? 'left' : 'right'} 0.4s;
    }
    .nav-wrap.fixed,
    .nav-wrap:hover {
      ${alignLeft ? 'left' : 'right'}: 0;
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
      margin: 2rem 0 1rem;
      text-align: center;
    }
    .nav-wrap ul.nav {
      display: flex;
      flex-direction: column;
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .nav-wrap ul.nav li {
      display: flex;
      align-items: center;
      flex: 0 0 2rem;
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
    }

    button#themeToggle {
      background-color: transparent;
      border: 1px solid #273439;
      color: inherit;
    }
    button#themeToggle > i {
      margin: 0.25rem 0.5rem;
    }
    button#themeToggle.dark > i.light {
      display: none;
    }
    button#themeToggle.light > i.dark {
      display: none;
    }
    `;
    shadow.appendChild(style);

    // main wrapper
    const navWrap = document.createElement('nav');
    navWrap.setAttribute('class', 'nav-wrap');
    shadow.appendChild(navWrap);

    // fixed pin
    const fixedPin = document.createElement('span');
    fixedPin.setAttribute('id', 'fixedPin');
    fixedPin.setAttribute('class', 'fa fa-thumb-tack');
    fixedPin.addEventListener('click', (e) => {
      navWrap.classList.toggle('fixed');
    });
    navWrap.appendChild(fixedPin);

    // open trigger
    const openTrigger = document.createElement('span');
    openTrigger.setAttribute('id', 'openTrigger');
    openTrigger.setAttribute('class', 'fa fa-angle-double-' + (alignLeft ? 'right' : 'left'));
    navWrap.appendChild(openTrigger);

    // title
    const title = document.createElement('h1');
    const titleAnker = document.createElement('a');
    titleAnker.setAttribute('href', '/dist/main.html');
    titleAnker.textContent = 'Flayground';
    title.appendChild(titleAnker);
    navWrap.appendChild(title);

    // main menu
    const mainMenuNav = document.createElement('ul');
    mainMenuNav.setAttribute('class', 'nav');
    navWrap.appendChild(mainMenuNav);

    menuItems.forEach((menu) => {
      const li = document.createElement('li');
      mainMenuNav.appendChild(li);

      // icon
      const menuIcon = document.createElement('i');
      menuIcon.setAttribute('class', menu.icon);
      li.appendChild(menuIcon);

      // menu
      const menuDiv = document.createElement('div');
      li.appendChild(menuDiv);

      // decide url
      let menuURL = menu.uri;
      if (menu.mode === 'include') {
        menuURL = 'main.popup.html?target=' + menu.uri;
      }
      // decide popup size
      if (menu.popup === 'full') {
        menu.popup = {
          w: window.innerWidth,
          h: window.innerHeight,
        };
      }

      // current window
      const anker = document.createElement('a');
      anker.setAttribute('class', menu.mode);
      anker.setAttribute('href', menuURL);
      anker.textContent = menu.name;
      menuDiv.appendChild(anker);

      // new window
      const popup = document.createElement('a');
      popup.setAttribute('href', `javascript:window.open('${menuURL}', '${menu.name}', 'width=${menu.popup.w},height=${menu.popup.h}')`);
      const popupIcon = document.createElement('i');
      popupIcon.setAttribute('class', 'fa fa-external-link hover');
      popup.appendChild(popupIcon);
      menuDiv.appendChild(popup);
    });

    // sub menu
    const subMenuNav = document.createElement('ul');
    subMenuNav.setAttribute('class', 'nav');
    navWrap.appendChild(subMenuNav);

    subMenuNav.appendChild(createThemeToggle());
    subMenuNav.appendChild(createRemainTimer());
    subMenuNav.appendChild(createLogout());
  }
}

// Define the new element
customElements.define('flay-menu', FlayMenu);

// const flayMenu = document.createElement('flay-menu');
// flayMenu.setAttribute('data-align', 'right');

document.body.prepend(new FlayMenu('left'));

function createThemeToggle() {
  let bgTheme = LocalStorageItem.get('flay.bgtheme', 'dark');

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
    console.log('themeToggle', button, button.classList);
    let currentTheme = button.classList.item(0);
    let selectedTheme = currentTheme === 'dark' ? 'light' : 'dark';
    button.classList.replace(currentTheme, selectedTheme);
    LocalStorageItem.set('flay.bgtheme', selectedTheme);
    try {
      flayWebsocket.info('bgtheme');
    } catch (e) {
      // no nothing
    }
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
  label.textContent = remainDay + ' days';

  return menuItemFactory('Remain', ['fa', 'fa-clock-o'], label);
}

function createLogout() {
  const label = document.createElement('label');
  label.classList.add('m-0', 'hover');
  label.setAttribute('id', 'logout');
  label.addEventListener('click', () => {
    let tokenValue = '';
    document.cookie.split(';').forEach((cookie) => {
      if ('XSRF-TOKEN' === cookie.substr(0, cookie.indexOf('=')).replace(/^\s+|\s+$/g, '')) {
        tokenValue = unescape(cookie.substr(cookie.indexOf('=') + 1));
        return false;
      }
    });

    const logoutForm = document.createElement('form');
    logoutForm.setAttribute('method', 'POST');
    logoutForm.setAttribute('action', '/logout');

    const csrfField = document.createElement('input');
    csrfField.setAttribute('type', 'hidden');
    csrfField.setAttribute('name', '_csrf');
    csrfField.setAttribute('value', tokenValue);

    document.body.appendChild(logoutForm);
    logoutForm.appendChild(csrfField);
    logoutForm.submit();
  });
  Rest.Security.whoami((principal) => {
    label.textContent = principal.username + ' as ' + principal.authorities[0].authority.replace(/ROLE_/gi, '');
  });

  return menuItemFactory('Logout', ['fa', 'fa-sign-out'], label);
}

function menuItemFactory(title, iconClasses, element) {
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
  return li;
}
